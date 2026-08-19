'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../../lib/supabaseClient';
import { formatUzPhone } from '../../../../lib/phoneMask';
import styles from '../../developer.module.css';

export default function GameClubDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: club, error: clubErr } = await supabase
        .from('game_clubs')
        .select('*')
        .eq('id', id)
        .single();

      if (clubErr || !club) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const { data: admins } = await supabase
        .from('club_admins')
        .select('*')
        .eq('game_club_id', id)
        .order('created_at');

      setForm({
        name: club.name,
        phone: club.phone || '+998',
        address: club.address || '',
        username: club.username,
        password: '',
        admins:
          admins && admins.length > 0
            ? admins.map((a) => ({ full_name: a.full_name, phone: a.phone || '+998' }))
            : [{ full_name: '', phone: '+998' }],
      });
      setLoading(false);
    }

    load();
  }, [id]);

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
    setSuccess('');
    setSaving(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      const res = await fetch(`/api/game-clubs/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error || 'Xatolik yuz berdi.');
        setSaving(false);
        return;
      }

      setSuccess('O\'zgarishlar saqlandi.');
      setForm((f) => ({ ...f, password: '' }));
    } catch (err) {
      setError('Server bilan bog\'lanib bo\'lmadi.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className={styles.mutedSmall}>Yuklanmoqda...</p>;
  }

  if (notFound || !form) {
    return (
      <div className={styles.panel}>
        <p className={styles.errorText}>Bar topilmadi.</p>
        <button className={styles.btnGhost} onClick={() => router.push('/developer/game-clubs')}>
          ← Ro'yxatga qaytish
        </button>
      </div>
    );
  }

  return (
    <>
      <div className={styles.pageHead}>
        <h1>{form.name}</h1>
        <p>Bar ma'lumotlarini tahrirlash</p>
      </div>

      <div className={styles.panel}>
        <div className={styles.panelHead}>
          <h2>Ma'lumotlar</h2>
          <button className={styles.btnGhost} onClick={() => router.push('/developer/game-clubs')}>
            ← Ro'yxatga qaytish
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.formGrid}>
            <div className={`${styles.formField} ${styles.full}`}>
              <label>Game Club nomi</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
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
                required
              />
            </div>

            <div className={styles.formField}>
              <label>Yangi parol (ixtiyoriy)</label>
              <input
                type="text"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="o'zgartirish uchun kiriting"
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
          {success && (
            <p className={styles.mutedSmall} style={{ color: '#7fffa0', marginTop: 10 }}>
              {success}
            </p>
          )}

          <div className={styles.formActions}>
            <button type="submit" className={styles.btnPrimary} disabled={saving}>
              {saving ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
