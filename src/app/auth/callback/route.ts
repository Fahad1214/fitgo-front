import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const token = requestUrl.searchParams.get('token');
  const type = requestUrl.searchParams.get('type');
  const next = requestUrl.searchParams.get('next') || '/';

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      flowType: 'pkce',
    },
  });

  // Handle OAuth callback (Google)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error('OAuth callback error:', error);
      return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, requestUrl.origin));
    }
  }

  // Handle magic link callback
  if (token && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: type as any,
    });
    
    if (error) {
      console.error('Magic link verification error:', error);
      return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, requestUrl.origin));
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(new URL(next, requestUrl.origin));
}

