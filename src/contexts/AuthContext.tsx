'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

// Helper function to sync user to public.users table
const syncUserToDatabase = async (user: User, session: Session | null) => {
  if (!user) return;

  try {
    // Extract user metadata
    const userMetadata = user.user_metadata || {};
    const appMetadata = user.app_metadata || {};
    
    // Determine auth provider
    let authProvider = 'email';
    let googleId = null;
    
    if (appMetadata.provider === 'google' || userMetadata.provider === 'google') {
      authProvider = 'google';
      googleId = userMetadata.sub || userMetadata.google_id || user.id;
    }

    // Extract name information
    const fullName = userMetadata.name || userMetadata.full_name || userMetadata.fullName || '';
    const firstName = userMetadata.first_name || userMetadata.firstName || userMetadata.given_name || '';
    const lastName = userMetadata.last_name || userMetadata.lastName || userMetadata.family_name || '';
    const profilePicture = userMetadata.avatar_url || userMetadata.picture || userMetadata.profile_picture || null;

    // Sync user to database
    const response = await fetch('/api/users/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: user.id,
        email: user.email,
        fullName: fullName,
        firstName: firstName,
        lastName: lastName,
        profilePicture: profilePicture,
        googleId: googleId,
        authProvider: authProvider,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Failed to sync user to database:', error);
      // Don't throw - this is a non-critical operation
      // User is still authenticated even if sync fails
    } else {
      const result = await response.json();
      console.log('User synced to database successfully:', result);
    }
  } catch (error) {
    console.error('Error syncing user to database:', error);
  }
};

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithMagicLink: (email: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signInWithMagicLink: async () => ({ error: null }),
  signInWithGoogle: async () => ({ error: null }),
  signOut: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!mounted) return;
      
      if (error) {
        console.error('Error getting session:', error);
        setLoading(false);
        return;
      }

      console.log('Initial session:', session?.user?.email || 'No session');
      
      setSession(session);
      setUser(session?.user ?? null);
      
      // Don't sync on page load - only sync on actual sign in/sign up events
      // This prevents overwriting user-edited profile data with auth metadata
      
      setLoading(false);
    });

    // Listen for auth changes - but only for actual changes, not INITIAL_SESSION
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      // Skip INITIAL_SESSION - we already handled it with getSession()
      if (event === 'INITIAL_SESSION') {
        return;
      }

      console.log('Auth state changed:', event, session?.user?.email || 'No user');
      
      setSession(session);
      setUser(session?.user ?? null);
      
      // Sync user to database only on actual sign in/sign up (not on token refresh or page load)
      // This prevents overwriting user-edited profile data
      const eventString = event as string;
      if (session?.user && (eventString === 'SIGNED_IN' || eventString === 'SIGNED_UP')) {
        await syncUserToDatabase(session.user, session);
        
        // Update email verification status if user is verified
        if (session.user.email_confirmed_at) {
          try {
            await fetch('/api/users/sync', {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                userId: session.user.id,
                emailVerified: true,
              }),
            });
          } catch (error) {
            console.error('Error updating email verification status:', error);
          }
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signInWithMagicLink = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    return { error };
  };

  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  const value = {
    user,
    session,
    loading,
    signInWithMagicLink,
    signInWithGoogle,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

