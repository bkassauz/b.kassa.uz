import { createClient } from '@supabase/supabase-js';
import { createSupabaseAdmin } from './supabaseAdmin';

// Chaqiruvchining haqiqatan developer ekanligini token orqali tekshiradi.
// 1) anon klient bilan tokenning haqiqiyligini tasdiqlaymiz (getUser)
// 2) profilni admin (service role) klient bilan o'qiymiz — bu RLS'ni chetlab
//    o'tadi, lekin xavfsiz, chunki identifikatsiya allaqachon JWT orqali tasdiqlangan.
export async function verifyDeveloper(authHeader) {
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.replace('Bearer ', '');

  const anon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const { data: userData, error: userErr } = await anon.auth.getUser(token);
  if (userErr || !userData?.user) return null;

  const admin = createSupabaseAdmin();
  const { data: profile, error: profileErr } = await admin
    .from('profiles')
    .select('role')
    .eq('id', userData.user.id)
    .single();

  if (profileErr || profile?.role !== 'developer') return null;
  return userData.user;
}
