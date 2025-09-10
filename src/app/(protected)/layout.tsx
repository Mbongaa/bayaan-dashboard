import { redirect } from 'next/navigation';
import { createClient } from '@/app/utils/supabase/server';

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // IMPORTANT: Use getUser() for secure page protection, not getSession()
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return <>{children}</>;
}