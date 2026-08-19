'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { useClubAuth } from '../../../lib/ClubAuthContext';
import styles from '../club.module.css';

const ACTION_LABELS = {
  category_added: { text: 'Kategoriya', cls: 'category' },
  product_added: { text: 'Qo\'shildi', cls: 'added' },
  product_imported: { text: 'Import', cls: 'imported' },
  product_updated: { text: 'Tahrirlandi', cls: 'updated' },
};

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleString('uz-UZ', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function HistoryPage() {
  const { club } = useClubAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!club?.id) return;

    async function load() {
      const { data } = await supabase
        .from('inventory_history')
        .select('*')
        .eq('game_club_id', club.id)
        .order('created_at', { ascending: false })
        .limit(200);
      setRows(data || []);
      setLoading(false);
    }

    load();
  }, [club?.id]);

  return (
    <>
      <div className={styles.pageHead}>
        <h1>Kirim tarixi</h1>
        <p>Kategoriya va mahsulotlar bo'yicha barcha o'zgarishlar jurnali</p>
      </div>

      <div className={styles.panel}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Turi</th>
                <th>Kategoriya</th>
                <th>Mahsulot</th>
                <th>Soni</th>
                <th>Sana</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={5} className={styles.tableEmpty}>Yuklanmoqda...</td></tr>
              )}
              {!loading && rows.length === 0 && (
                <tr><td colSpan={5} className={styles.tableEmpty}>Hozircha tarix yo'q.</td></tr>
              )}
              {!loading && rows.map((r) => {
                const label = ACTION_LABELS[r.action] || { text: r.action, cls: 'added' };
                return (
                  <tr key={r.id}>
                    <td><span className={`${styles.historyBadge} ${styles[label.cls]}`}>{label.text}</span></td>
                    <td>{r.category_name || '—'}</td>
                    <td>{r.product_name || '—'}</td>
                    <td>{r.quantity != null ? `${r.quantity} ${r.unit || ''}` : '—'}</td>
                    <td>{formatDate(r.created_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
