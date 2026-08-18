'use client';

import { useEffect, useState } from 'react';
import { useRequireAuth } from '../../../lib/useRequireAuth';
import { supabase } from '../../../lib/supabaseClient';
import DeveloperShell from '../../../components/DeveloperShell';
import styles from '../developer.module.css';

export default function DashboardPage() {
  const { loading, profile } = useRequireAuth('developer');
  const [stats, setStats] = useState({
    clubs: null,
    clubAdmins: null,
    siteAdmins: null,
  });

  useEffect(() => {
    if (loading) return;

    async function loadStats() {
      const [clubsRes, clubAdminsRes, adminsRes] = await Promise.all([
        supabase.from('game_clubs').select('id', { count: 'exact', head: true }),
        supabase.from('club_admins').select('id', { count: 'exact', head: true }),
        supabase.from('admins').select('id', { count: 'exact', head: true }),
      ]);

      setStats({
        clubs: clubsRes.count ?? 0,
        clubAdmins: clubAdminsRes.count ?? 0,
        siteAdmins: adminsRes.count ?? 0,
      });
    }

    loadStats();
  }, [loading]);

  if (loading) {
    return <div className={styles.loadingScreen}>Yuklanmoqda...</div>;
  }

  return (
    <DeveloperShell
      title="Dashboard"
      subtitle="Umumiy ko'rinish"
      userLabel={profile?.full_name || profile?.username}
    >
      <div className={styles.pageHead}>
        <h1>Xush kelibsiz, {profile?.full_name || profile?.username}</h1>
        <p>Barcha game club barlar bo'yicha qisqacha ko'rinish</p>
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
          <div className={styles.widgetLabel}>Tizim adminlari</div>
          <div className={styles.widgetValue}>{stats.siteAdmins ?? '—'}</div>
          <div className={styles.widgetHint}>Admin sozlamalari bo'limidan</div>
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
    </DeveloperShell>
  );
}
