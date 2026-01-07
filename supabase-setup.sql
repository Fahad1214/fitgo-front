-- This SQL file contains database triggers and functions to automatically sync auth users to public.users table
-- Run this in your Supabase SQL Editor

-- Function to handle new user creation from auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id,
    email,
    full_name,
    first_name,
    last_name,
    profile_picture,
    google_id,
    auth_provider,
    email_verified,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'first_name', NEW.raw_user_meta_data->>'given_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', NEW.raw_user_meta_data->>'family_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', NULL),
    CASE 
      WHEN NEW.app_metadata->>'provider' = 'google' THEN COALESCE(NEW.raw_user_meta_data->>'sub', NEW.id::text)
      ELSE NULL
    END,
    COALESCE(NEW.app_metadata->>'provider', 'email'),
    COALESCE(NEW.email_confirmed_at IS NOT NULL, false),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, users.full_name),
    first_name = COALESCE(EXCLUDED.first_name, users.first_name),
    last_name = COALESCE(EXCLUDED.last_name, users.last_name),
    profile_picture = COALESCE(EXCLUDED.profile_picture, users.profile_picture),
    google_id = COALESCE(EXCLUDED.google_id, users.google_id),
    auth_provider = COALESCE(EXCLUDED.auth_provider, users.auth_provider),
    email_verified = COALESCE(EXCLUDED.email_verified, users.email_verified),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create/update user in public.users when auth.users is created
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to update email_verified when email is confirmed
CREATE OR REPLACE FUNCTION public.handle_email_verification()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
    UPDATE public.users
    SET
      email_verified = true,
      updated_at = NOW()
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update email_verified status
CREATE OR REPLACE TRIGGER on_email_verified
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  WHEN (NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL)
  EXECUTE FUNCTION public.handle_email_verification();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.users TO anon, authenticated;

