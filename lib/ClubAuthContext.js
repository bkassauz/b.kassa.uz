'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from './supabaseClient';

const ClubAuthCtx = createContext(null);

export function ClubAuthProvider({ children }) {
  const router = useRouter();
  const [state, setState] = useState({ loading: true, profile: null, club: null });

  useEffect(() => {
    let active = true;

    async function check() {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.replace('/login');
        return;
      }

      const { data: profileRow, error: profileErr } = await supabase
        .from('profiles')
        .select('id, role, username, full_name')
        .eq('id', session.user.id)
        .single();

      if (!active) return;

      if (profileErr || !profileRow || profileRow.role !== 'seller_admin') {
        router.replace('/login');
        return;
      }

      const { data: clubRow, error: clubErr } = await supabase
        .from('game_clubs')
        .select('id, name, phone, address, username')
        .eq('owner_id', session.user.id)
        .single();

      if (!active) return;

      if (clubErr || !clubRow) {
        router.replace('/login');
        return;
      }

      setState({ loading: false, profile: profileRow, club: clubRow });
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
  }, [router]);

  return <ClubAuthCtx.Provider value={state}>{children}</ClubAuthCtx.Provider>;
}

export function useClubAuth() {
  const ctx = useContext(ClubAuthCtx);
  if (!ctx) {
    throw new Error('useClubAuth faqat ClubAuthProvider ichida ishlaydi');
  }
  return ctx;
}
