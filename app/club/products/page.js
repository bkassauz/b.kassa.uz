'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import { useClubAuth } from '../../../lib/ClubAuthContext';
import Modal from '../../../components/Modal';
import ExcelImportModal from '../../../components/ExcelImportModal';
import styles from '../club.module.css';

export default function ProductsPage() {
  const { club } = useClubAuth();
  const router = useRouter();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState(null); // null = create, object = rename
  const [importOpen, setImportOpen] = useState(false);
  const [catName, setCatName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function loadCategories() {
    if (!club?.id) return;
    setLoading(true);
    const { data } = await supabase
      .from('categories')
      .select('id, name, created_at, products(count)')
      .eq('game_club_id', club.id)
      .order('created_at', { ascending: false });
    setCategories(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadCategories();
  }, [club?.id]);

  function openCreate() {
    setEditingCat(null);
    setCatName('');
    setError('');
    setCatModalOpen(true);
  }

  function openRename(cat, e) {
    e.stopPropagation();
    setEditingCat(cat);
    setCatName(cat.name);
    setError('');
    setCatModalOpen(true);
  }

  async function handleDelete(cat, e) {
    e.stopPropagation();
    const ok = window.confirm(
      `"${cat.name}" kategoriyasini o'chirasizmi? Ichidagi barcha mahsulotlar ham o'chib ketadi.`
    );
    if (!ok) return;

    await supabase.from('categories').delete().eq('id', cat.id);
    loadCategories();
  }

  async function handleCatSubmit(e) {
    e.preventDefault();
    setError('');
    if (!catName.trim()) return;
    setSaving(true);

    if (editingCat) {
      const { error: updErr } = await supabase
        .from('categories')
        .update({ name: catName.trim() })
        .eq('id', editingCat.id);

      if (updErr) {
        setError(updErr.message);
        setSaving(false);
        return;
      }
    } else {
      const { error: insErr } = await supabase.from('categories').insert({
        game_club_id: club.id,
        name: catName.trim(),
      });

      if (insErr) {
        setError(insErr.message);
        setSaving(false);
        return;
      }

      await supabase.from('inventory_history').insert({
        game_club_id: club.id,
        action: 'category_added',
        category_name: catName.trim(),
      });
    }

    setCatName('');
    setCatModalOpen(false);
    setEditingCat(null);
    setSaving(false);
    loadCategories();
  }

  return (
    <>
      <div className={styles.pageHead}>
        <h1>Mahsulotlar</h1>
        <p>Kategoriyalar bo'yicha ombor</p>
      </div>

      <div className={styles.panelHead} style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 15, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>
          Kategoriyalar
        </h2>
        <button className={styles.btnPrimary} onClick={openCreate}>
          + Kategoriya qo'shish
        </button>
      </div>

      {loading && <p className={styles.mutedSmall}>Yuklanmoqda...</p>}

      {!loading && categories.length === 0 && (
        <div className={styles.panel}>
          <p className={styles.mutedSmall}>
            Hozircha kategoriya yo'q. "Kategoriya qo'shish" tugmasini bosing yoki pastdagi
            belgi orqali Excel'dan import qiling.
          </p>
        </div>
      )}

      <div className={styles.catGrid}>
        {categories.map((cat) => (
          <div
            key={cat.id}
            className={styles.catCard}
            onClick={() => router.push(`/club/products/${cat.id}`)}
          >
            <div className={styles.catCardActions}>
              <button
                type="button"
                className={styles.btnIcon}
                onClick={(e) => openRename(cat, e)}
                aria-label="Tahrirlash"
                title="Nomini o'zgartirish"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                </svg>
              </button>
              <button
                type="button"
                className={styles.btnIcon}
                onClick={(e) => handleDelete(cat, e)}
                aria-label="O'chirish"
                title="O'chirish"
              >
                ✕
              </button>
            </div>
            <div className={styles.catCardName}>{cat.name}</div>
            <div className={styles.catCardCount}>{cat.products?.[0]?.count ?? 0} ta mahsulot</div>
          </div>
        ))}
      </div>

      <button className={styles.fab} onClick={() => setImportOpen(true)} aria-label="Excel'dan import qilish" title="Excel'dan import qilish">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3v12M7 10l5 5 5-5" />
          <path d="M4 19h16" />
        </svg>
      </button>

      {catModalOpen && (
        <Modal title={editingCat ? "Kategoriya nomini o'zgartirish" : "Kategoriya qo'shish"} onClose={() => setCatModalOpen(false)}>
          <form onSubmit={handleCatSubmit}>
            <div className={styles.formField}>
              <label>Kategoriya nomi</label>
              <input
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                placeholder="Masalan: Ichimliklar"
                required
                autoFocus
              />
            </div>

            {error && <p className={styles.errorText}>{error}</p>}

            <div className={styles.formActions}>
              <button type="button" className={styles.btnGhost} onClick={() => setCatModalOpen(false)}>
                Bekor qilish
              </button>
              <button type="submit" className={styles.btnPrimary} disabled={saving}>
                {saving ? 'Saqlanmoqda...' : 'Saqlash'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {importOpen && (
        <ExcelImportModal
          gameClubId={club.id}
          onClose={() => setImportOpen(false)}
          onImported={loadCategories}
        />
      )}
    </>
  );
}
