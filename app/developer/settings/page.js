'use client';

import { useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { useDeveloperAuth } from '../../../lib/DeveloperAuthContext';
import styles from '../developer.module.css';

export default function SettingsPage() {
  const { profile, updateLocalProfile } = useDeveloperAuth();

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [username, setUsername] = useState(profile?.username || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });

  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });

  async function handleProfileSubmit(e) {
    e.preventDefault();
    setProfileMsg({ type: '', text: '' });
    setSavingProfile(true);

    const { data: { session } } = await supabase.auth.getSession();

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName.trim(),
        username: username.trim().toLowerCase(),
      })
      .eq('id', session.user.id);

    if (error) {
      const msg = error.message.includes('duplicate')
        ? 'Bu login band. Boshqa login tanlang.'
        : error.message;
      setProfileMsg({ type: 'error', text: msg });
    } else {
      setProfileMsg({ type: 'ok', text: 'Profil yangilandi.' });
      updateLocalProfile({ full_name: fullName.trim(), username: username.trim().toLowerCase() });
    }
    setSavingProfile(false);
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    setPasswordMsg({ type: '', text: '' });

    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'Parol kamida 6 belgidan iborat bo\'lishi kerak.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Parollar bir xil emas.' });
      return;
    }

    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setPasswordMsg({ type: 'error', text: error.message });
    } else {
      setPasswordMsg({ type: 'ok', text: 'Parol muvaffaqiyatli o\'zgartirildi.' });
      setNewPassword('');
      setConfirmPassword('');
    }
    setSavingPassword(false);
  }

  return (
    <>
      <div className={styles.pageHead}>
        <h1>Developer sozlamalari</h1>
        <p>Shaxsiy profilingiz — ism, login va parolni shu yerdan boshqarasiz</p>
      </div>

      <div className={styles.panel}>
        <div className={styles.panelHead}>
          <h2>Profil ma'lumotlari</h2>
        </div>
        <form onSubmit={handleProfileSubmit}>
          <div className={styles.formGrid}>
            <div className={styles.formField}>
              <label>Ism Familiya</label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ism Familiya"
                required
              />
            </div>
            <div className={styles.formField}>
              <label>Login</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="login"
                required
              />
            </div>
          </div>

          {profileMsg.text && (
            <p className={profileMsg.type === 'error' ? styles.errorText : styles.mutedSmall} style={profileMsg.type === 'ok' ? { color: '#7fffa0', marginTop: 10 } : { marginTop: 10 }}>
              {profileMsg.text}
            </p>
          )}

          <div className={styles.formActions}>
            <button type="submit" className={styles.btnPrimary} disabled={savingProfile}>
              {savingProfile ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
          </div>
        </form>
      </div>

      <div className={styles.panel}>
        <div className={styles.panelHead}>
          <h2>Parolni o'zgartirish</h2>
        </div>
        <form onSubmit={handlePasswordSubmit}>
          <div className={styles.formGrid}>
            <div className={styles.formField}>
              <label>Yangi parol</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="kamida 6 belgi"
              />
            </div>
            <div className={styles.formField}>
              <label>Parolni tasdiqlang</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="parolni qayta kiriting"
              />
            </div>
          </div>

          {passwordMsg.text && (
            <p className={passwordMsg.type === 'error' ? styles.errorText : styles.mutedSmall} style={passwordMsg.type === 'ok' ? { color: '#7fffa0', marginTop: 10 } : { marginTop: 10 }}>
              {passwordMsg.text}
            </p>
          )}

          <div className={styles.formActions}>
            <button type="submit" className={styles.btnPrimary} disabled={savingPassword}>
              {savingPassword ? 'Saqlanmoqda...' : 'Parolni yangilash'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
