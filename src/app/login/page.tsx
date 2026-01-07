'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

function LoginForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { signInWithMagicLink, signInWithGoogle, user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [email, setEmail] = useState('');

  useEffect(() => {
    // Redirect to profile if already logged in
    if (!authLoading && user) {
      router.push('/profile');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    // Check for OAuth errors
    if (searchParams.get('error')) {
      setError('Authentication failed. Please try again.');
    }
  }, [searchParams]);

  const handleGoogleSignIn = async () => {
    setError(null);
    setSuccess(null);
    setGoogleLoading(true);
    
    const { error } = await signInWithGoogle();
    
    if (error) {
      setError(error.message || 'Failed to sign in with Google');
      setGoogleLoading(false);
    }
    // Note: User will be redirected to Google, so we don't set loading to false here
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const { error } = await signInWithMagicLink(email);
      
      if (error) {
        setError(error.message || 'Failed to send verification email');
      } else {
        setSuccess('Check your email! We sent you a magic link to sign in.');
        setEmail('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  // Don't render login form if user is logged in (will redirect)
  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link href="/" className="text-4xl font-bold text-orange-500 hover:text-orange-400 transition inline-block mb-2">
            FitGo
          </Link>
          <h2 className="text-3xl font-bold text-white mb-2">
            Sign In
          </h2>
          <p className="text-gray-400">
            Sign in to continue your fitness journey
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                <p className="font-semibold mb-1">Email sent!</p>
                <p className="text-sm">{success}</p>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-700 placeholder:text-gray-400"
                placeholder="you@example.com"
                disabled={loading || googleLoading}
              />
            </div>

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg font-semibold transition transform hover:scale-105"
            >
              {loading ? 'Sending...' : 'Send Magic Link'}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={googleLoading || loading}
                className="w-full inline-flex justify-center items-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {googleLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-700"></div>
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span className="ml-2">Continue with Google</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-gray-400 text-sm">
          By continuing, you agree to FitGo&apos;s{' '}
          <a href="#" className="text-orange-500 hover:text-orange-400">Terms of Service</a>
          {' '}and{' '}
          <a href="#" className="text-orange-500 hover:text-orange-400">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
}

export default function Login() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
