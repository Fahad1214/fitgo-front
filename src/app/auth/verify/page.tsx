'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');
      const type = searchParams.get('type');

      if (!token) {
        setStatus('error');
        setMessage('No verification token found. Please check your email for the verification link.');
        return;
      }

      try {
        // Verify the email with the token
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: type as any || 'email',
        });

        if (error) {
          setStatus('error');
          setMessage(error.message || 'Failed to verify email. The link may have expired.');
        } else {
          setStatus('success');
          setMessage('Email verified successfully! You can now sign in.');
          
          // Update email verification status in database
          if (data.user) {
            try {
              await fetch('/api/users/sync', {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  userId: data.user.id,
                  emailVerified: true,
                }),
              });
            } catch (err) {
              console.error('Error updating email verification status:', err);
            }
          }
          
          // Redirect to login after 3 seconds
          setTimeout(() => {
            router.push('/login');
          }, 3000);
        }
      } catch (err: any) {
        setStatus('error');
        setMessage(err.message || 'An error occurred during verification.');
      }
    };

    verifyEmail();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-2xl p-8 text-center">
          {status === 'verifying' && (
            <>
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500 mx-auto mb-4"></div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifying Email</h2>
              <p className="text-gray-600">{message}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Email Verified!</h2>
              <p className="text-gray-600 mb-6">{message}</p>
              <Link
                href="/login"
                className="inline-block bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold transition"
              >
                Go to Login
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h2>
              <p className="text-gray-600 mb-6">{message}</p>
              <div className="space-y-3">
                <Link
                  href="/login"
                  className="block bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold transition"
                >
                  Back to Login
                </Link>
                <button
                  onClick={() => router.push('/login?resend=true')}
                  className="block w-full bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold transition"
                >
                  Resend Verification Email
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmail() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500"></div>
      </div>
    }>
      <VerifyEmailForm />
    </Suspense>
  );
}
