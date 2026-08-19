import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Build vaqtida .env.local topilmasa aniq xato chiqarish uchun
  console.warn(
    'Supabase muhit o\'zgaruvchilari topilmadi. .env.local faylini tekshiring (.env.example ga qarang).'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
