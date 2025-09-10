import { type EmailOtpType } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { createClient } from '@/app/utils/supabase/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const next = searchParams.get('next') ?? '/dashboard';

  // Create redirect link without the secret token
  const redirectTo = request.nextUrl.clone();
  redirectTo.pathname = next;
  redirectTo.searchParams.delete('token_hash');
  redirectTo.searchParams.delete('type');
  redirectTo.searchParams.delete('next');

  if (token_hash && type) {
    const supabase = await createClient();

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

    if (!error) {
      // Email confirmed successfully, redirect to dashboard
      return NextResponse.redirect(redirectTo);
    }
  }

  // Return the user to login page with error message
  redirectTo.pathname = '/login';
  redirectTo.searchParams.set('error', 'Invalid or expired confirmation link');
  return NextResponse.redirect(redirectTo);
}