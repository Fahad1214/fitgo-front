import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create a server-side Supabase client with service role key for admin operations
const getSupabaseAdmin = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, email, fullName, firstName, lastName, profilePicture, googleId, authProvider } = body;

    if (!userId || !email) {
      return NextResponse.json(
        { error: 'User ID and email are required' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 is "not found" error, which is expected for new users
      console.error('Error checking user:', checkError);
      return NextResponse.json(
        { error: checkError.message, code: checkError.code },
        { status: 500 }
      );
    }

    const userData: any = {
      id: userId,
      email: email,
      updated_at: new Date().toISOString(),
    };

    // Only update fields if they are provided and not empty
    // This prevents overwriting existing database data with empty/null auth metadata
    if (fullName !== undefined && fullName !== null && fullName !== '') {
      userData.full_name = fullName;
    }
    if (firstName !== undefined && firstName !== null && firstName !== '') {
      userData.first_name = firstName;
    }
    if (lastName !== undefined && lastName !== null && lastName !== '') {
      userData.last_name = lastName;
    }
    if (profilePicture !== undefined && profilePicture !== null && profilePicture !== '') {
      userData.profile_picture = profilePicture;
    }
    if (googleId !== undefined && googleId !== null) {
      userData.google_id = googleId;
    }
    if (authProvider !== undefined && authProvider !== null) {
      userData.auth_provider = authProvider;
    }

    let result;
    if (existingUser) {
      // Get current user data to preserve existing values
      const { data: currentUser } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      // Update existing user - only update fields that are provided AND don't exist in DB
      // This prevents overwriting user-edited data with auth metadata
      const updateData: any = {
        email: email, // Always update email
        updated_at: new Date().toISOString(),
      };
      
      // NEVER update full_name from auth metadata if DB already has one
      // This prevents overwriting user-edited names with auth metadata
      // Only set it if DB doesn't have a value at all (first time sync)
      if (fullName !== undefined && fullName !== null && fullName !== '') {
        // Only update if DB doesn't have a value (never overwrite existing user-edited name)
        if (currentUser) {
          // If DB already has a full_name, NEVER overwrite it
          if (!currentUser.full_name) {
            // Only set if DB doesn't have one
            updateData.full_name = fullName;
          }
          // If currentUser.full_name exists, skip it completely (preserve user's edit)
        } else {
          // If user doesn't exist yet, set it
          updateData.full_name = fullName;
        }
      }
      
      // NEVER update profile_picture from auth metadata if DB already has one
      // This prevents overwriting user-uploaded images with auth metadata
      // Only set it if DB doesn't have a value at all (first time sync)
      if (profilePicture !== undefined && profilePicture !== null && profilePicture !== '') {
        // Only update if DB doesn't have a value (never overwrite existing user-uploaded image)
        // Check if currentUser exists and has a profile_picture
        if (currentUser) {
          // If DB already has a profile_picture, NEVER overwrite it
          if (!currentUser.profile_picture) {
            // Only set if DB doesn't have one
            updateData.profile_picture = profilePicture;
          }
          // If currentUser.profile_picture exists, skip it completely (preserve user's upload)
        } else {
          // If user doesn't exist yet, set it
          updateData.profile_picture = profilePicture;
        }
      }
      
      // Always update these if provided (they're less likely to be user-edited)
      if (firstName !== undefined && firstName !== null && firstName !== '') {
        updateData.first_name = firstName;
      }
      if (lastName !== undefined && lastName !== null && lastName !== '') {
        updateData.last_name = lastName;
      }
      if (googleId !== undefined && googleId !== null) {
        updateData.google_id = googleId;
      }
      if (authProvider !== undefined && authProvider !== null) {
        updateData.auth_provider = authProvider;
      }
      
      const { data, error } = await supabaseAdmin
        .from('users')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating user:', error);
        return NextResponse.json(
          { error: error.message, code: error.code, details: error.details },
          { status: 500 }
        );
      }

      result = data;
    } else {
      // Insert new user
      userData.created_at = new Date().toISOString();
      userData.email_verified = false;

      const { data, error } = await supabaseAdmin
        .from('users')
        .insert(userData)
        .select()
        .single();

      if (error) {
        console.error('Error creating user:', error);
        return NextResponse.json(
          { error: error.message, code: error.code, details: error.details },
          { status: 500 }
        );
      }

      result = data;
    }

    return NextResponse.json({ user: result }, { status: 200 });
  } catch (error: any) {
    console.error('Error in sync user:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, emailVerified, fullName, profilePicture } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Get current user data first to preserve existing values
    const { data: currentUser } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (emailVerified !== undefined) {
      updateData.email_verified = emailVerified;
    }

    // Always update fullName if provided (user explicitly edited it)
    if (fullName !== undefined) {
      updateData.full_name = fullName;
    }

    // Always update profilePicture if provided (user explicitly uploaded it)
    // Allow null/empty to clear the image if needed
    if (profilePicture !== undefined) {
      updateData.profile_picture = profilePicture || null;
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user:', error);
      return NextResponse.json(
        { error: error.message, code: error.code, details: error.details },
        { status: 500 }
      );
    }

    return NextResponse.json({ user: data }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

