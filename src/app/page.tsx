import { redirect } from 'next/navigation';
import { createClient } from '@/app/utils/supabase/server';

export default async function HomePage() {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect('/workspace');
  } else {
    redirect('/login');
  }
}
