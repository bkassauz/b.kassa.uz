'use client';

import { useEffect, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '../../../lib/supabaseClient';
import { useClubAuth } from '../../../lib/ClubAuthContext';
import styles from '../club.module.css';

const PAYMENT_LABELS = { naqd: 'Naqd', karta: 'Karta', click: 'Click' };

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleString('uz-UZ', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function periodStart(period) {
  const now = new Date();
  if (period === 'kunlik') {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  if (period === 'haftalik') {
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    return d;
  }
  if (period === 'oylik') {
    const d = new Date(now);
    d.setDate(d.getDate() - 30);
    return d;
  }
  return null; // butun tarix
}

export default function SalesHistoryPage() {
  const { club } = useClubAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!club?.id) return;

    async function load() {
      const { data } = await supabase
        .from('sale_items')
        .select('*, sales(payment_method, created_at)')
        .eq('game_club_id', club.id)
        .order('created_at', { ascending: false })
        .limit(500);
      setRows(data || []);
      setLoading(false);
    }

    load();
  }, [club?.id]);

  useEffect(() => {
    function handleOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  function handleExport(period, label) {
    const start = periodStart(period);
    const filtered = start ? rows.filter((r) => new Date(r.created_at) >= start) : rows;

    if (filtered.length === 0) {
      setMenuOpen(false);
      alert("Tanlangan davrda savdo tarixi topilmadi.");
      return;
    }

    const sheetData = filtered.map((r) => ({
      Sana: formatDate(r.created_at),
      Mahsulot: r.product_name,
      Soni: r.quantity,
      "O'lchov": r.unit || '',
      Narx: r.price,
      Jami: r.line_total,
      "To'lov turi": PAYMENT_LABELS[r.sales?.payment_method] || r.sales?.payment_method || '',
    }));

    const ws = XLSX.utils.json_to_sheet(sheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Savdo tarixi');
    XLSX.writeFile(wb, `savdo-tarixi-${label}-${Date.now()}.xlsx`);
    setMenuOpen(false);
  }

  return (
    <>
      <div className={styles.pageHead}>
        <h1>Savdo tarixi</h1>
        <p>POS orqali sotilgan barcha mahsulotlar</p>
      </div>

      <div className={styles.panel}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Mahsulot</th>
                <th>Soni</th>
                <th>Narx</th>
                <th>Jami</th>
                <th>To'lov</th>
                <th>Sana</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={6} className={styles.tableEmpty}>Yuklanmoqda...</td></tr>
              )}
              {!loading && rows.length === 0 && (
                <tr><td colSpan={6} className={styles.tableEmpty}>Hozircha savdo tarixi yo'q.</td></tr>
              )}
              {!loading && rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.product_name}</td>
                  <td>{r.quantity} {r.unit}</td>
                  <td>{Number(r.price).toLocaleString('ru-RU')}</td>
                  <td>{Number(r.line_total).toLocaleString('ru-RU')}</td>
                  <td>
                    <span className={styles.badge}>
                      {PAYMENT_LABELS[r.sales?.payment_method] || r.sales?.payment_method}
                    </span>
                  </td>
                  <td>{formatDate(r.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={styles.downloadRow} ref={menuRef}>
          {menuOpen && (
            <div className={styles.downloadMenu}>
              <button onClick={() => handleExport('kunlik', 'kunlik')}>Kunlik</button>
              <button onClick={() => handleExport('haftalik', 'haftalik')}>Haftalik</button>
              <button onClick={() => handleExport('oylik', 'oylik')}>Oylik</button>
              <button onClick={() => handleExport('butun', 'butun-tarix')}>Butun tarix</button>
            </div>
          )}
          <button
            className={styles.downloadBtn}
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Excel'ga yuklab olish"
            title="Excel'ga yuklab olish"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3v12M7 10l5 5 5-5" />
              <path d="M4 19h16" />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}
