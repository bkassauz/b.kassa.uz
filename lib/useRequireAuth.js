'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from './supabaseClient';

// Faqat berilgan rolga ega, tizimga kirgan foydalanuvchini sahifada ushlab turadi.
// Aks holda /login ga qaytaradi. Sahifalarda: const { loading, profile } = useRequireAuth('developer');
export function useRequireAuth(requiredRole) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    let active = true;

    async function check() {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.replace('/login');
        return;
      }

      const { data: profileRow, error } = await supabase
        .from('profiles')
        .select('role, username, full_name')
        .eq('id', session.user.id)
        .single();

      if (!active) return;

      if (error || !profileRow || (requiredRole && profileRow.role !== requiredRole)) {
        router.replace('/login');
        return;
      }

      setProfile(profileRow);
      setLoading(false);
    }

    check();

    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        router.replace('/login');
      }
    });

    return () => {
      active = false;
      listener?.subscription?.unsubscribe();
    };
  }, [requiredRole, router]);

  return { loading, profile };
}

export async function signOut(router) {
  await supabase.auth.signOut();
  router.replace('/login');
}
