'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { useDeveloperAuth } from '../../../lib/DeveloperAuthContext';
import styles from '../developer.module.css';

export default function DashboardPage() {
  const { profile } = useDeveloperAuth();
  const [stats, setStats] = useState({ clubs: null, clubAdmins: null });

  useEffect(() => {
    async function loadStats() {
      const [clubsRes, clubAdminsRes] = await Promise.all([
        supabase.from('game_clubs').select('id', { count: 'exact', head: true }),
        supabase.from('club_admins').select('id', { count: 'exact', head: true }),
      ]);

      setStats({
        clubs: clubsRes.count ?? 0,
        clubAdmins: clubAdminsRes.count ?? 0,
      });
    }

    loadStats();
  }, []);

  return (
    <>
      <div className={styles.pageHead}>
        <h1>Xush kelibsiz, {profile?.full_name || profile?.username}</h1>
      </div>

      <div className={styles.grid}>
        <div className={styles.widget}>
          <div className={styles.widgetAccent}></div>
          <div className={styles.widgetLabel}>Ro'yxatdagi Game Clublar</div>
          <div className={styles.widgetValue}>{stats.clubs ?? '—'}</div>
          <div className={styles.widgetHint}>Faol ro'yxatdan o'tgan barlar</div>
        </div>

        <div className={styles.widget}>
          <div className={styles.widgetAccent}></div>
          <div className={styles.widgetLabel}>Club adminlari</div>
          <div className={styles.widgetValue}>{stats.clubAdmins ?? '—'}</div>
          <div className={styles.widgetHint}>Barcha clublar bo'yicha jami</div>
        </div>

        <div className={styles.widget}>
          <div className={styles.widgetAccent}></div>
          <div className={styles.widgetLabel}>Bugungi savdo</div>
          <div className={styles.widgetValue}>—</div>
          <div className={styles.widgetHint}>Sotuv jadvali ulanganda chiqadi</div>
        </div>
      </div>

      <div className={styles.panel}>
        <div className={styles.panelHead}>
          <h2>Keyingi qadamlar</h2>
        </div>
        <p className={styles.mutedSmall}>
          Bu yerga har bir game club bar bo'yicha qisqa vidjetlar (kunlik savdo, qoldiq
          ogohlantirishlari, faol xodimlar) qo'shiladi — Game Clubs va Analitika bo'limlari
          to'liq ishga tushgach.
        </p>
      </div>
    </>
  );
}
