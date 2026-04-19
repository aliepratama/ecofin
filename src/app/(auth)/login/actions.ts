'use server';

import { createClient } from '@/libs/supabase/server';

export async function checkUserExists(identifier: string) {
  const supabase = await createClient();

  // Cari berdasarkan email atau nomor HP di public.users
  const { data } = await supabase
    .from('users')
    .select('email, phone_number')
    .or(`email.eq.${identifier},phone_number.eq.${identifier}`)
    .maybeSingle();

  if (data) {
    return { exists: true, email: data.email };
  }
  return { exists: false };
}
