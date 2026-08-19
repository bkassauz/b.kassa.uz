import { createClient } from '@supabase/supabase-js';

// DIQQAT: bu fayl faqat server tomonda (API routes) ishlatiladi.
// SUPABASE_SERVICE_ROLE_KEY hech qachon brauzerga yuborilmasin (NEXT_PUBLIC_ prefiksisiz saqlanadi).
export function createSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY yoki NEXT_PUBLIC_SUPABASE_URL sozlanmagan.');
  }

  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
