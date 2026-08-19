'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from './supabaseClient';

const DeveloperAuthCtx = createContext(null);

export function DeveloperAuthProvider({ children }) {
  const router = useRouter();
  const [state, setState] = useState({ loading: true, profile: null });

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
        .select('id, role, username, full_name')
        .eq('id', session.user.id)
        .single();

      if (!active) return;

      if (error || !profileRow || profileRow.role !== 'developer') {
        router.replace('/login');
        return;
      }

      setState({ loading: false, profile: profileRow });
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

  function updateLocalProfile(patch) {
    setState((s) => ({ ...s, profile: { ...s.profile, ...patch } }));
  }

  return (
    <DeveloperAuthCtx.Provider value={{ ...state, updateLocalProfile }}>
      {children}
    </DeveloperAuthCtx.Provider>
  );
}

export function useDeveloperAuth() {
  const ctx = useContext(DeveloperAuthCtx);
  if (!ctx) {
    throw new Error('useDeveloperAuth faqat DeveloperAuthProvider ichida ishlaydi');
  }
  return ctx;
}
