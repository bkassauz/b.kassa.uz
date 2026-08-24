'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import { useClubAuth } from '../../../lib/ClubAuthContext';
import styles from '../club.module.css';

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleString('uz-UZ', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function ClubDashboardPage() {
  const { profile, club } = useClubAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    categories: null,
    products: null,
    lowStock: null,
    stockValue: null,
    todaySales: null,
  });
  const [lastAnnouncement, setLastAnnouncement] = useState(null);

  useEffect(() => {
    if (!club?.id) return;

    async function loadStats() {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const [catRes, productsRes, salesRes] = await Promise.all([
        supabase.from('categories').select('id', { count: 'exact', head: true }).eq('game_club_id', club.id),
        supabase.from('products').select('quantity, cost_price').eq('game_club_id', club.id),
        supabase.from('sales').select('total, created_at').eq('game_club_id', club.id).gte('created_at', todayStart.toISOString()),
      ]);

      const products = productsRes.data || [];
      const lowStock = products.filter((p) => Number(p.quantity) <= 5).length;
      const stockValue = products.reduce((sum, p) => sum + Number(p.quantity) * Number(p.cost_price), 0);
      const todaySales = (salesRes.data || []).reduce((s, r) => s + Number(r.total), 0);

      setStats({
        categories: catRes.count ?? 0,
        products: products.length,
        lowStock,
        stockValue,
        todaySales,
      });
    }

    async function loadAnnouncement() {
      const { data } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      setLastAnnouncement(data || null);
    }

    loadStats();
    loadAnnouncement();
  }, [club?.id]);

  return (
    <>
      <div className={styles.pageHead}>
        <h1>Xush kelibsiz, {profile?.full_name || profile?.username}</h1>
      </div>

      <div className={styles.grid}>
        <div className={styles.widget}>
          <div className={styles.widgetAccent}></div>
          <div className={styles.widgetLabel}>Kategoriyalar</div>
          <div className={styles.widgetValue}>{stats.categories ?? '—'}</div>
          <div className={styles.widgetHint}>Jami kategoriyalar soni</div>
        </div>

        <div className={styles.widget}>
          <div className={styles.widgetAccent}></div>
          <div className={styles.widgetLabel}>Mahsulotlar</div>
          <div className={styles.widgetValue}>{stats.products ?? '—'}</div>
          <div className={styles.widgetHint}>Ombordagi jami mahsulot turi</div>
        </div>

        <div className={styles.widget}>
          <div className={styles.widgetAccent}></div>
          <div className={styles.widgetLabel}>Kam qolgan mahsulot</div>
          <div className={styles.widgetValue}>{stats.lowStock ?? '—'}</div>
          <div className={styles.widgetHint}>Qoldiq 5 tadan kam</div>
        </div>

        <div className={styles.widget}>
          <div className={styles.widgetAccent}></div>
          <div className={styles.widgetLabel}>Ombor qiymati</div>
          <div className={styles.widgetValue}>
            {stats.stockValue != null ? Math.round(stats.stockValue).toLocaleString('ru-RU') : '—'}
          </div>
          <div className={styles.widgetHint}>Kelish narxi bo'yicha, so'm</div>
        </div>

        <div className={styles.widget}>
          <div className={styles.widgetAccent}></div>
          <div className={styles.widgetLabel}>Bugungi savdo</div>
          <div className={styles.widgetValue}>
            {stats.todaySales != null ? Math.round(stats.todaySales).toLocaleString('ru-RU') : '—'}
          </div>
          <div className={styles.widgetHint}>so'm</div>
        </div>
      </div>

      <div className={styles.panel}>
        <div className={styles.panelHead}>
          <h2>Tezkor amallar</h2>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button className={styles.btnPrimary} onClick={() => router.push('/club/products')}>
            + Mahsulot / kategoriya qo'shish
          </button>
          <button className={styles.btnGhost} onClick={() => router.push('/club/history')}>
            Kirim tarixini ko'rish
          </button>
        </div>
      </div>

      <div className={styles.panel}>
        <div className={styles.panelHead}>
          <h2>Developer'dan xabar</h2>
        </div>

        <div className={styles.phoneMock}>
          <div className={styles.phoneNotch}></div>
          <div className={styles.phoneScreen}>
            <div className={styles.phoneScreenLabel}>So'nggi xabar</div>
            {lastAnnouncement ? (
              <>
                <div className={styles.phoneMessage}>{lastAnnouncement.message}</div>
                <div className={styles.phoneMessageTime}>{formatDate(lastAnnouncement.created_at)}</div>
              </>
            ) : (
              <div className={styles.phoneMessageEmpty}>Hozircha xabar yo'q</div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
