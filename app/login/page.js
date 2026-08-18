'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import styles from './login.module.css';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1) username -> email (login_lookup view orqali, faqat username+email ochiq)
      const { data: lookup, error: lookupErr } = await supabase
        .from('login_lookup')
        .select('email')
        .eq('username', username.trim())
        .maybeSingle();

      if (lookupErr || !lookup) {
        setError('Login yoki parol noto\'g\'ri.');
        setLoading(false);
        return;
      }

      // 2) Supabase Auth orqali kirish
      const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
        email: lookup.email,
        password,
      });

      if (signInErr || !signInData?.user) {
        setError('Login yoki parol noto\'g\'ri.');
        setLoading(false);
        return;
      }

      // 3) Profil (rol) ni olib, tegishli panelga yo'naltirish
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', signInData.user.id)
        .single();

      if (profileErr || !profile) {
        setError('Profil topilmadi. Administrator bilan bog\'laning.');
        setLoading(false);
        return;
      }

      if (profile.role === 'developer') {
        router.push('/developer/dashboard');
      } else if (profile.role === 'seller_admin') {
        router.push('/club/dashboard');
      } else {
        setError('Noma\'lum foydalanuvchi turi.');
      }
    } catch (err) {
      setError('Xatolik yuz berdi. Qaytadan urinib ko\'ring.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.root}>
      <div className={styles.bg}></div>

      <div className={`${styles.deco} ${styles.tl}`} style={{ '--r': '-8deg' }}>
        <svg viewBox="0 0 60 150" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#ff5470" />
              <stop offset="1" stopColor="#4a0e18" />
            </linearGradient>
          </defs>
          <rect x="4" y="4" width="52" height="142" rx="18" fill="url(#g1)" opacity=".85" />
          <rect x="4" y="4" width="52" height="142" rx="18" fill="none" stroke="#ff1f3d" strokeWidth="1.5" opacity=".7" />
          <path d="M20 55 L34 55 L24 80 L38 80 L18 115 L26 85 L14 85 Z" fill="#ffe4e9" opacity=".9" />
        </svg>
      </div>

      <div className={`${styles.deco} ${styles.tr}`} style={{ '--r': '6deg' }}>
        <svg viewBox="0 0 60 150" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="g2" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#2a2a34" />
              <stop offset="1" stopColor="#ff1f3d" />
            </linearGradient>
          </defs>
          <rect x="4" y="4" width="52" height="142" rx="18" fill="url(#g2)" opacity=".85" />
          <rect x="4" y="4" width="52" height="142" rx="18" fill="none" stroke="#ff1f3d" strokeWidth="1.5" opacity=".7" />
          <circle cx="30" cy="55" r="12" fill="none" stroke="#ffe4e9" strokeWidth="2" opacity=".8" />
          <path d="M22 95 L38 95 L30 118 Z" fill="#ffe4e9" opacity=".85" />
        </svg>
      </div>

      <div className={`${styles.deco} ${styles.bl}`} style={{ '--r': '5deg' }}>
        <svg viewBox="0 0 60 150" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="g3" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#8c0e22" />
              <stop offset="1" stopColor="#16161e" />
            </linearGradient>
          </defs>
          <rect x="4" y="4" width="52" height="142" rx="18" fill="url(#g3)" opacity=".85" />
          <rect x="4" y="4" width="52" height="142" rx="18" fill="none" stroke="#ff1f3d" strokeWidth="1.5" opacity=".7" />
          <rect x="16" y="60" width="28" height="6" fill="#ffe4e9" opacity=".8" />
          <rect x="16" y="72" width="20" height="6" fill="#ffe4e9" opacity=".6" />
        </svg>
      </div>

      <div className={`${styles.deco} ${styles.br}`} style={{ '--r': '-4deg' }}>
        <svg viewBox="0 0 60 150" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="g4" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#ff1f3d" />
              <stop offset="1" stopColor="#1a1a22" />
            </linearGradient>
          </defs>
          <rect x="4" y="4" width="52" height="142" rx="18" fill="url(#g4)" opacity=".85" />
          <rect x="4" y="4" width="52" height="142" rx="18" fill="none" stroke="#ff1f3d" strokeWidth="1.5" opacity=".7" />
          <path d="M30 50 L30 100 M18 65 L42 65 M18 85 L42 85" stroke="#ffe4e9" strokeWidth="2.5" opacity=".8" strokeLinecap="round" />
        </svg>
      </div>

      <div className={styles.stage}>
        <div className={styles.card}>
          <div className={styles.cardNotch}><i></i><i></i><i></i></div>
          <div className={styles.head}>
            <h1>Welcome</h1>
            <p>b.Kassa.uz</p>
          </div>

          <form onSubmit={handleSubmit} autoComplete="off">
            <div className={styles.field}>
              <div className={styles.inputWrap}>
                <input
                  type="text"
                  placeholder="Login"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>

              <div className={styles.inputWrap}>
                <input
                  type={showPwd ? 'text' : 'password'}
                  placeholder="Parol"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className={styles.toggleEye}
                  onClick={() => setShowPwd((v) => !v)}
                  aria-label="Parolni ko'rsatish"
                >
                  {showPwd ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a19.9 19.9 0 0 1 5.06-5.94M9.9 4.24A10.4 10.4 0 0 1 12 4c7 0 11 7 11 7a19.9 19.9 0 0 1-2.16 3.19M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && <p className={styles.error}>{error}</p>}

            <button type="submit" className={styles.submit} disabled={loading}>
              {loading ? 'Tekshirilmoqda...' : 'Tizimga kirish'}
            </button>

            <div className={styles.links}>
              <a href="#">Parolni unutdingizmi?</a>
            </div>
          </form>
        </div>
        <div className={styles.footTag}>Game Club Bar Control</div>
      </div>

      <div className={styles.credit}>created by — imradjabov</div>
    </div>
  );
}
