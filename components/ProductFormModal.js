'use client';

import { useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import Modal from './Modal';
import styles from '../app/club/club.module.css';

const UNITS = ['dona', 'kilo', 'pachka'];

function emptyDraft() {
  return {
    name: '', quantity: '', cost_price: '', sale_price: '', unit: 'dona',
    imageFile: null, imagePreview: '',
  };
}

export default function ProductFormModal({ gameClubId, categoryId, categoryName, product, onClose, onSaved }) {
  const isEdit = Boolean(product);
  const uidRef = useRef(0);

  // ---------- EDIT MODE (single product) ----------
  const [name, setName] = useState(product?.name || '');
  const [quantity, setQuantity] = useState(product?.quantity ?? '');
  const [costPrice, setCostPrice] = useState(product?.cost_price ?? '');
  const [salePrice, setSalePrice] = useState(product?.sale_price ?? '');
  const [unit, setUnit] = useState(product?.unit || 'dona');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(product?.image_url || '');

  // ---------- ADD MODE (multiple drafts) ----------
  const [drafts, setDrafts] = useState([{ id: 0, ...emptyDraft() }]);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  function addDraftRow() {
    uidRef.current += 1;
    setDrafts((ds) => [...ds, { id: uidRef.current, ...emptyDraft() }]);
  }

  function removeDraftRow(id) {
    setDrafts((ds) => (ds.length > 1 ? ds.filter((d) => d.id !== id) : ds));
  }

  function updateDraft(id, field, value) {
    setDrafts((ds) => ds.map((d) => (d.id === id ? { ...d, [field]: value } : d)));
  }

  function pickDraftImage(id, file) {
    if (!file) return;
    setDrafts((ds) => ds.map((d) => (d.id === id ? { ...d, imageFile: file, imagePreview: URL.createObjectURL(file) } : d)));
  }

  async function uploadImage(file, keyHint) {
    const path = `${gameClubId}/${Date.now()}-${keyHint}-${file.name.replace(/\s+/g, '_')}`;
    const { error: uploadErr } = await supabase.storage.from('product-images').upload(path, file, { upsert: true });
    if (uploadErr) throw new Error('Rasm yuklashda xatolik: ' + uploadErr.message);
    const { data } = supabase.storage.from('product-images').getPublicUrl(path);
    return data.publicUrl;
  }

  async function handleDelete() {
    const ok = window.confirm(`"${product.name}" mahsulotini o'chirasizmi?`);
    if (!ok) return;
    setDeleting(true);
    const { error: delErr } = await supabase.from('products').delete().eq('id', product.id);
    if (delErr) {
      setError(delErr.message);
      setDeleting(false);
      return;
    }
    onSaved();
    onClose();
  }

  async function handleEditSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      let imageUrl = product?.image_url || null;
      if (imageFile) {
        imageUrl = await uploadImage(imageFile, 'edit');
      }

      const payload = {
        game_club_id: gameClubId,
        category_id: categoryId,
        name: name.trim(),
        quantity: Number(quantity) || 0,
        cost_price: Number(costPrice) || 0,
        sale_price: Number(salePrice) || 0,
        unit,
        image_url: imageUrl,
        updated_at: new Date().toISOString(),
      };

      const { error: updErr } = await supabase.from('products').update(payload).eq('id', product.id);
      if (updErr) {
        setError(updErr.message);
        setSaving(false);
        return;
      }

      await supabase.from('inventory_history').insert({
        game_club_id: gameClubId,
        action: 'product_updated',
        category_name: categoryName,
        product_name: payload.name,
        quantity: payload.quantity,
        unit: payload.unit,
      });

      onSaved();
      onClose();
    } catch (err) {
      setError(err.message || 'Kutilmagan xatolik yuz berdi.');
    } finally {
      setSaving(false);
    }
  }

  async function handleAddSubmit(e) {
    e.preventDefault();
    setError('');

    const valid = drafts.filter((d) => d.name.trim());
    if (valid.length === 0) {
      setError('Kamida bitta mahsulot nomini kiriting.');
      return;
    }

    setSaving(true);

    try {
      for (const d of valid) {
        let imageUrl = null;
        if (d.imageFile) {
          imageUrl = await uploadImage(d.imageFile, d.id);
        }

        const payload = {
          game_club_id: gameClubId,
          category_id: categoryId,
          name: d.name.trim(),
          quantity: Number(d.quantity) || 0,
          cost_price: Number(d.cost_price) || 0,
          sale_price: Number(d.sale_price) || 0,
          unit: d.unit,
          image_url: imageUrl,
        };

        const { error: insErr } = await supabase.from('products').insert(payload);
        if (insErr) throw new Error(insErr.message);

        await supabase.from('inventory_history').insert({
          game_club_id: gameClubId,
          action: 'product_added',
          category_name: categoryName,
          product_name: payload.name,
          quantity: payload.quantity,
          unit: payload.unit,
        });
      }

      onSaved();
      onClose();
    } catch (err) {
      setError(err.message || 'Kutilmagan xatolik yuz berdi.');
    } finally {
      setSaving(false);
    }
  }

  function renderImagePicker(preview, onChange) {
    return (
      <label className={styles.imageUpload}>
        <input type="file" accept="image/*" onChange={onChange} />
        {preview ? (
          <img src={preview} alt="" />
        ) : (
          <>
            <svg className={styles.imageUploadIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <circle cx="9" cy="10" r="2" />
              <path d="M21 16l-5-5-4 4-3-3-6 6" />
            </svg>
            <span>Galereyadan tanlang yoki rasmga oling</span>
          </>
        )}
      </label>
    );
  }

  // ================= EDIT MODE UI =================
  if (isEdit) {
    return (
      <Modal title="Mahsulotni tahrirlash" onClose={onClose}>
        <form onSubmit={handleEditSubmit}>
          <div className={styles.formGrid}>
            <div className={`${styles.formField} ${styles.full}`}>
              <label>Mahsulot rasmi</label>
              {renderImagePicker(imagePreview, (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                setImageFile(f);
                setImagePreview(URL.createObjectURL(f));
              })}
            </div>

            <div className={`${styles.formField} ${styles.full}`}>
              <label>Mahsulot nomi</label>
              <input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>

            <div className={styles.formField}>
              <label>Soni</label>
              <input type="number" step="any" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
            </div>

            <div className={styles.formField}>
              <label>O'lchov birligi</label>
              <select value={unit} onChange={(e) => setUnit(e.target.value)}>
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>

            <div className={styles.formField}>
              <label>Kelish narxi</label>
              <input type="number" step="any" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} required />
            </div>

            <div className={styles.formField}>
              <label>Sotuv narxi</label>
              <input type="number" step="any" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} required />
            </div>
          </div>

          {error && <p className={styles.errorText}>{error}</p>}

          <div className={styles.formActions}>
            <button type="button" className={styles.btnGhost} style={{ color: '#ff6b7f', marginRight: 'auto' }} onClick={handleDelete} disabled={deleting || saving}>
              {deleting ? "O'chirilmoqda..." : "O'chirish"}
            </button>
            <button type="button" className={styles.btnGhost} onClick={onClose}>Bekor qilish</button>
            <button type="submit" className={styles.btnPrimary} disabled={saving}>
              {saving ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
          </div>
        </form>
      </Modal>
    );
  }

  // ================= ADD MODE UI (bir nechtasi) =================
  return (
    <Modal title="Mahsulot qo'shish" onClose={onClose}>
      <form onSubmit={handleAddSubmit}>
        {drafts.map((d, idx) => (
          <div className={styles.productDraftBlock} key={d.id}>
            <span className={styles.productDraftIndex}>Mahsulot #{idx + 1}</span>
            {drafts.length > 1 && (
              <button
                type="button"
                className={`${styles.btnIcon} ${styles.productDraftRemove}`}
                onClick={() => removeDraftRow(d.id)}
                aria-label="Olib tashlash"
              >
                ✕
              </button>
            )}

            <div className={styles.formGrid}>
              <div className={`${styles.formField} ${styles.full}`}>
                <label>Mahsulot rasmi</label>
                {renderImagePicker(d.imagePreview, (e) => pickDraftImage(d.id, e.target.files?.[0]))}
              </div>

              <div className={`${styles.formField} ${styles.full}`}>
                <label>Mahsulot nomi</label>
                <input value={d.name} onChange={(e) => updateDraft(d.id, 'name', e.target.value)} required={idx === 0} />
              </div>

              <div className={styles.formField}>
                <label>Soni</label>
                <input type="number" step="any" value={d.quantity} onChange={(e) => updateDraft(d.id, 'quantity', e.target.value)} />
              </div>

              <div className={styles.formField}>
                <label>O'lchov birligi</label>
                <select value={d.unit} onChange={(e) => updateDraft(d.id, 'unit', e.target.value)}>
                  {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>

              <div className={styles.formField}>
                <label>Kelish narxi</label>
                <input type="number" step="any" value={d.cost_price} onChange={(e) => updateDraft(d.id, 'cost_price', e.target.value)} />
              </div>

              <div className={styles.formField}>
                <label>Sotuv narxi</label>
                <input type="number" step="any" value={d.sale_price} onChange={(e) => updateDraft(d.id, 'sale_price', e.target.value)} />
              </div>
            </div>
          </div>
        ))}

        <button type="button" className={styles.addMoreBtn} onClick={addDraftRow}>
          + Yana mahsulot qo'shish
        </button>

        {error && <p className={styles.errorText}>{error}</p>}

        <div className={styles.formActions}>
          <button type="button" className={styles.btnGhost} onClick={onClose}>Bekor qilish</button>
          <button type="submit" className={styles.btnPrimary} disabled={saving}>
            {saving ? 'Saqlanmoqda...' : `Saqlash (${drafts.filter(d => d.name.trim()).length || drafts.length})`}
          </button>
        </div>
      </form>
    </Modal>
  );
}
