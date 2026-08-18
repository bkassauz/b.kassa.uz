'use client';

import { useEffect, useState } from 'react';
import { useRequireAuth } from '../../../lib/useRequireAuth';
import { supabase } from '../../../lib/supabaseClient';
import { formatUzPhone } from '../../../lib/phoneMask';
import DeveloperShell from '../../../components/DeveloperShell';
import Modal from '../../../components/Modal';
import styles from '../developer.module.css';

export default function AdminSettingsPage() {
  const { loading, profile } = useRequireAuth('developer');
  const [admins, setAdmins] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ full_name: '', phone: '+998' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function loadAdmins() {
    setListLoading(true);
    const { data } = await supabase
      .from('admins')
      .select('*')
      .order('created_at', { ascending: false });
    setAdmins(data || []);
    setListLoading(false);
  }

  useEffect(() => {
    if (!loading) loadAdmins();
  }, [loading]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const { error: insertErr } = await supabase.from('admins').insert({
      full_name: form.full_name.trim(),
      phone: form.phone,
    });

    if (insertErr) {
      setError(insertErr.message);
      setSubmitting(false);
      return;
    }

    setModalOpen(false);
    setForm({ full_name: '', phone: '+998' });
    setSubmitting(false);
    loadAdmins();
  }

  if (loading) {
    return <div className={styles.loadingScreen}>Yuklanmoqda...</div>;
  }

  return (
    <DeveloperShell
      title="Admin sozlamalari"
      subtitle="Tizim adminlari ro'yxati"
      userLabel={profile?.full_name || profile?.username}
    >
      <div className={styles.pageHead}>
        <h1>Admin sozlamalari</h1>
        <p>Tizimga kirish huquqiga ega adminlar ro'yxati</p>
      </div>

      <div className={styles.panel}>
        <div className={styles.panelHead}>
          <h2>Adminlar</h2>
          <button className={styles.btnPrimary} onClick={() => setModalOpen(true)}>
            + Admin qo'shish
          </button>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Ism Familiya</th>
                <th>Telefon raqam</th>
              </tr>
            </thead>
            <tbody>
              {listLoading && (
                <tr><td colSpan={2} className={styles.tableEmpty}>Yuklanmoqda...</td></tr>
              )}
              {!listLoading && admins.length === 0 && (
                <tr><td colSpan={2} className={styles.tableEmpty}>Hozircha admin qo'shilmagan.</td></tr>
              )}
              {!listLoading && admins.map((a) => (
                <tr key={a.id}>
                  <td>{a.full_name}</td>
                  <td>{a.phone || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <Modal title="Admin qo'shish" onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSubmit}>
            <div className={styles.formGrid}>
              <div className={`${styles.formField} ${styles.full}`}>
                <label>Ism Familiya</label>
                <input
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  placeholder="Ism Familiya"
                  required
                />
              </div>
              <div className={`${styles.formField} ${styles.full}`}>
                <label>Telefon raqam</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: formatUzPhone(e.target.value) })}
                  placeholder="+998 (__) ___ __ __"
                />
              </div>
            </div>

            {error && <p className={styles.errorText}>{error}</p>}

            <div className={styles.formActions}>
              <button type="button" className={styles.btnGhost} onClick={() => setModalOpen(false)}>
                Bekor qilish
              </button>
              <button type="submit" className={styles.btnPrimary} disabled={submitting}>
                {submitting ? 'Saqlanmoqda...' : 'Saqlash'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </DeveloperShell>
  );
}
