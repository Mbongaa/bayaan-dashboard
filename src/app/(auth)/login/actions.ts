'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/app/utils/supabase/server';

export async function login(formData: FormData) {
  const supabase = await createClient();
  
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  };

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    redirect('/login?error=' + encodeURIComponent(error.message));
  }

  revalidatePath('/', 'layout');
  redirect('/workspace');
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const fullName = formData.get('fullName') as string;

  // Sign up the user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/confirm`,
    }
  });

  if (authError) {
    redirect('/signup?error=' + encodeURIComponent(authError.message));
  }

  // Create profile for the user
  if (authData.user) {
    const { error: profileError } = await (supabase as any)
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: email,
        full_name: fullName,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (profileError) {
      console.error('Profile creation error:', profileError);
    }
  }

  redirect('/login?message=' + encodeURIComponent('Check your email to confirm your account'));
}

export async function signInWithGoogle() {
  const supabase = await createClient();
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    }
  });

  if (error) {
    redirect('/login?error=' + encodeURIComponent(error.message));
  }

  if (data.url) {
    redirect(data.url);
  }
}

export async function signInWithGitHub() {
  const supabase = await createClient();
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
    }
  });

  if (error) {
    redirect('/login?error=' + encodeURIComponent(error.message));
  }

  if (data.url) {
    redirect(data.url);
  }
}

export async function signOut() {
  const supabase = await createClient();
  
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    redirect('/workspace?error=' + encodeURIComponent(error.message));
  }
  
  revalidatePath('/', 'layout');
  redirect('/login');
}