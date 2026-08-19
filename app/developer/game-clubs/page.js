'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { formatUzPhone } from '../../../lib/phoneMask';
import Modal from '../../../components/Modal';
import styles from '../developer.module.css';

const emptyForm = {
  name: '',
  phone: '+998',
  address: '',
  username: '',
  password: '',
  admins: [{ full_name: '', phone: '+998' }],
};

export default function GameClubsPage() {
  const [clubs, setClubs] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function loadClubs() {
    setListLoading(true);
    const { data } = await supabase
      .from('game_clubs')
      .select('id, name, phone, address, username, created_at, club_admins(count)')
      .order('created_at', { ascending: false });
    setClubs(data || []);
    setListLoading(false);
  }

  useEffect(() => {
    loadClubs();
  }, []);

  function updateAdmin(index, field, value) {
    setForm((f) => {
      const admins = [...f.admins];
      admins[index] = { ...admins[index], [field]: value };
      return { ...f, admins };
    });
  }

  function addAdminRow() {
    setForm((f) => ({ ...f, admins: [...f.admins, { full_name: '', phone: '+998' }] }));
  }

  function removeAdminRow(index) {
    setForm((f) => ({ ...f, admins: f.admins.filter((_, i) => i !== index) }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      const res = await fetch('/api/game-clubs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error || 'Xatolik yuz berdi.');
        setSubmitting(false);
        return;
      }

      setModalOpen(false);
      setForm(emptyForm);
      loadClubs();
    } catch (err) {
      setError('Server bilan bog\'lanib bo\'lmadi.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className={styles.pageHead}>
        <h1>Game Clubs</h1>
        <p>Ro'yxatdan o'tgan game club barlar va ularning kirish ma'lumotlari</p>
      </div>

      <div className={styles.panel}>
        <div className={styles.panelHead}>
          <h2>Barlar ro'yxati</h2>
          <button className={styles.btnPrimary} onClick={() => setModalOpen(true)}>
            + BAR qo'shish
          </button>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nomi</th>
                <th>Telefon</th>
                <th>Manzil</th>
                <th>Login</th>
                <th>Adminlar</th>
              </tr>
            </thead>
            <tbody>
              {listLoading && (
                <tr><td colSpan={5} className={styles.tableEmpty}>Yuklanmoqda...</td></tr>
              )}
              {!listLoading && clubs.length === 0 && (
                <tr><td colSpan={5} className={styles.tableEmpty}>Hozircha ro'yxatdan o'tgan bar yo'q.</td></tr>
              )}
              {!listLoading && clubs.map((club) => (
                <tr key={club.id}>
                  <td>{club.name}</td>
                  <td>{club.phone || '—'}</td>
                  <td>{club.address || '—'}</td>
                  <td><span className={styles.badge}>{club.username}</span></td>
                  <td>{club.club_admins?.[0]?.count ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <Modal title="Yangi BAR qo'shish" onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSubmit}>
            <div className={styles.formGrid}>
              <div className={`${styles.formField} ${styles.full}`}>
                <label>Game Club nomi</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Masalan: Nexus Arena"
                  required
                />
              </div>

              <div className={styles.formField}>
                <label>Telefon raqam</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: formatUzPhone(e.target.value) })}
                  placeholder="+998 (__) ___ __ __"
                />
              </div>

              <div className={styles.formField}>
                <label>Manzil</label>
                <input
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Shahar, ko'cha"
                />
              </div>

              <div className={styles.formField}>
                <label>Login</label>
                <input
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  placeholder="login"
                  required
                />
              </div>

              <div className={styles.formField}>
                <label>Parol</label>
                <input
                  type="text"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="kamida 6 belgi"
                  required
                />
              </div>

              <div className={`${styles.formField} ${styles.full}`}>
                <label>
                  Adminlar
                  <button
                    type="button"
                    className={styles.btnIcon}
                    style={{ marginLeft: 10 }}
                    onClick={addAdminRow}
                    aria-label="Admin qo'shish"
                  >
                    +
                  </button>
                </label>

                {form.admins.map((a, i) => (
                  <div className={styles.adminRow} key={i}>
                    <div className={styles.formField}>
                      <input
                        value={a.full_name}
                        onChange={(e) => updateAdmin(i, 'full_name', e.target.value)}
                        placeholder="Ism Familiya"
                      />
                    </div>
                    <div className={styles.formField}>
                      <input
                        value={a.phone}
                        onChange={(e) => updateAdmin(i, 'phone', formatUzPhone(e.target.value))}
                        placeholder="+998 (__) ___ __ __"
                      />
                    </div>
                    {form.admins.length > 1 && (
                      <button
                        type="button"
                        className={styles.btnIcon}
                        onClick={() => removeAdminRow(i)}
                        aria-label="O'chirish"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
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
    </>
  );
}
