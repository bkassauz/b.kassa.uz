'use client';

import { useState } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabaseClient';
import Modal from './Modal';
import styles from '../app/club/club.module.css';

const UNITS = ['dona', 'kilo', 'pachka'];

export default function ExcelImportModal({ gameClubId, onClose, onImported }) {
  const [step, setStep] = useState('upload'); // 'upload' | 'preview'
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [importing, setImporting] = useState(false);

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const wb = XLSX.read(data, { type: 'array' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        const mapped = json
          .map((row) => {
            const norm = {};
            Object.keys(row).forEach((k) => {
              norm[k.trim()] = row[k];
            });
            return {
              name: String(norm['Mahsulot nomi'] ?? '').trim(),
              category: String(norm['kategoriyasi'] ?? '').trim(),
              quantity: Number(norm['soni'] ?? 0) || 0,
              cost_price: Number(norm['kelish narxi'] ?? 0) || 0,
              sale_price: Number(norm['sotuv narxi'] ?? 0) || 0,
              unit: String(norm["o'lchov birligi"] ?? '').trim() || 'dona',
            };
          })
          .filter((r) => r.name);

        if (mapped.length === 0) {
          setError('Faylda mos ma\'lumot topilmadi. Shablon ustunlariga mos ekanligini tekshiring.');
          return;
        }

        setRows(mapped);
        setStep('preview');
      } catch (err) {
        setError('Faylni o\'qib bo\'lmadi. .xlsx formatida ekanligiga ishonch hosil qiling.');
      }
    };
    reader.readAsArrayBuffer(file);
  }

  function updateRow(index, field, value) {
    setRows((rs) => {
      const next = [...rs];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }

  function removeRow(index) {
    setRows((rs) => rs.filter((_, i) => i !== index));
  }

  async function handleConfirm() {
    setImporting(true);
    setError('');

    try {
      const { data: existingCats } = await supabase
        .from('categories')
        .select('id, name')
        .eq('game_club_id', gameClubId);

      const catMap = {};
      (existingCats || []).forEach((c) => {
        catMap[c.name.trim().toLowerCase()] = c.id;
      });

      for (const row of rows) {
        const catName = row.category.trim() || 'Boshqa';
        const key = catName.toLowerCase();
        let catId = catMap[key];

        if (!catId) {
          const { data: newCat, error: catErr } = await supabase
            .from('categories')
            .insert({ game_club_id: gameClubId, name: catName })
            .select()
            .single();

          if (catErr || !newCat) continue;
          catId = newCat.id;
          catMap[key] = catId;

          await supabase.from('inventory_history').insert({
            game_club_id: gameClubId,
            action: 'category_added',
            category_name: catName,
          });
        }

        await supabase.from('products').insert({
          game_club_id: gameClubId,
          category_id: catId,
          name: row.name,
          quantity: row.quantity || 0,
          cost_price: row.cost_price || 0,
          sale_price: row.sale_price || 0,
          unit: row.unit || 'dona',
        });

        await supabase.from('inventory_history').insert({
          game_club_id: gameClubId,
          action: 'product_imported',
          category_name: catName,
          product_name: row.name,
          quantity: row.quantity || 0,
          unit: row.unit || 'dona',
        });
      }

      onImported();
      onClose();
    } catch (err) {
      setError('Import paytida xatolik yuz berdi.');
    } finally {
      setImporting(false);
    }
  }

  return (
    <Modal title="Excel orqali import qilish" onClose={onClose}>
      {step === 'upload' && (
        <>
          <label className={styles.dropZone}>
            <input type="file" accept=".xlsx,.xls" onChange={handleFile} />
            <div>📄 Excel faylni yuklang (.xlsx)</div>
            <div className={styles.mutedSmall} style={{ marginTop: 6 }}>
              Ustunlar: Mahsulot nomi, kategoriyasi, soni, kelish narxi, sotuv narxi, o'lchov birligi
            </div>
          </label>
          {error && <p className={styles.errorText} style={{ marginTop: 10 }}>{error}</p>}
        </>
      )}

      {step === 'preview' && (
        <>
          <p className={styles.placeholderNote} style={{ marginBottom: 14 }}>
            Tasdiqlashdan oldin ma'lumotlarni tahrirlashingiz mumkin. Import qilingan
            mahsulotlar rasmsiz holatda qo'shiladi — rasmni keyin kategoriya ichidan mahsulot
            ustiga bosib qo'shasiz.
          </p>

          <div className={styles.importTableWrap}>
            <table className={styles.importTable}>
              <thead>
                <tr>
                  <th>Nomi</th>
                  <th>Kategoriya</th>
                  <th>Soni</th>
                  <th>Kelish narxi</th>
                  <th>Sotuv narxi</th>
                  <th>O'lchov</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i}>
                    <td><input value={r.name} onChange={(e) => updateRow(i, 'name', e.target.value)} /></td>
                    <td><input value={r.category} onChange={(e) => updateRow(i, 'category', e.target.value)} /></td>
                    <td><input type="number" value={r.quantity} onChange={(e) => updateRow(i, 'quantity', Number(e.target.value))} /></td>
                    <td><input type="number" value={r.cost_price} onChange={(e) => updateRow(i, 'cost_price', Number(e.target.value))} /></td>
                    <td><input type="number" value={r.sale_price} onChange={(e) => updateRow(i, 'sale_price', Number(e.target.value))} /></td>
                    <td>
                      <select value={r.unit} onChange={(e) => updateRow(i, 'unit', e.target.value)}>
                        {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </td>
                    <td>
                      <button type="button" className={styles.btnIcon} onClick={() => removeRow(i)}>✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {error && <p className={styles.errorText}>{error}</p>}

          <div className={styles.formActions}>
            <button type="button" className={styles.btnGhost} onClick={onClose}>
              Bekor qilish
            </button>
            <button
              type="button"
              className={styles.btnPrimary}
              onClick={handleConfirm}
              disabled={importing || rows.length === 0}
            >
              {importing ? 'Import qilinmoqda...' : `Tasdiqlash (${rows.length})`}
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}
