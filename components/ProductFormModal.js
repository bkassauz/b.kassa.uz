'use client';

import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import Modal from './Modal';
import styles from '../app/club/club.module.css';

const UNITS = ['dona', 'kilo', 'pachka'];

export default function ProductFormModal({ gameClubId, categoryId, categoryName, product, onClose, onSaved }) {
  const isEdit = Boolean(product);

  const [name, setName] = useState(product?.name || '');
  const [quantity, setQuantity] = useState(product?.quantity ?? '');
  const [costPrice, setCostPrice] = useState(product?.cost_price ?? '');
  const [salePrice, setSalePrice] = useState(product?.sale_price ?? '');
  const [unit, setUnit] = useState(product?.unit || 'dona');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(product?.image_url || '');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

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

  function handleImagePick(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      let imageUrl = product?.image_url || null;

      if (imageFile) {
        const path = `${gameClubId}/${Date.now()}-${imageFile.name.replace(/\s+/g, '_')}`;
        const { error: uploadErr } = await supabase.storage
          .from('product-images')
          .upload(path, imageFile, { upsert: true });

        if (uploadErr) {
          setError('Rasm yuklashda xatolik: ' + uploadErr.message);
          setSaving(false);
          return;
        }

        const { data: publicUrlData } = supabase.storage.from('product-images').getPublicUrl(path);
        imageUrl = publicUrlData.publicUrl;
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

      if (isEdit) {
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
      } else {
        const { error: insErr } = await supabase.from('products').insert(payload);
        if (insErr) {
          setError(insErr.message);
          setSaving(false);
          return;
        }
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
      setError('Kutilmagan xatolik yuz berdi.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={isEdit ? "Mahsulotni tahrirlash" : "Mahsulot qo'shish"} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className={styles.formGrid}>
          <div className={`${styles.formField} ${styles.full}`}>
            <label>Mahsulot rasmi</label>
            <label className={styles.imageUpload}>
              <input type="file" accept="image/*" onChange={handleImagePick} />
              {imagePreview ? (
                <img src={imagePreview} alt="" />
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
              {UNITS.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
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
          {isEdit && (
            <button
              type="button"
              className={styles.btnGhost}
              style={{ color: '#ff6b7f', marginRight: 'auto' }}
              onClick={handleDelete}
              disabled={deleting || saving}
            >
              {deleting ? "O'chirilmoqda..." : "O'chirish"}
            </button>
          )}
          <button type="button" className={styles.btnGhost} onClick={onClose}>
            Bekor qilish
          </button>
          <button type="submit" className={styles.btnPrimary} disabled={saving}>
            {saving ? 'Saqlanmoqda...' : 'Saqlash'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
