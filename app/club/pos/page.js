'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { useClubAuth } from '../../../lib/ClubAuthContext';
import styles from '../club.module.css';

const PAYMENT_METHODS = [
  { key: 'naqd', label: 'Naqd' },
  { key: 'karta', label: 'Karta' },
  { key: 'click', label: 'Click' },
];

export default function PosPage() {
  const { club } = useClubAuth();

  const [allProducts, setAllProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('naqd');
  const [finalizing, setFinalizing] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  async function loadProducts() {
    if (!club?.id) return;
    const { data } = await supabase
      .from('products')
      .select('id, name, image_url, unit, sale_price, quantity')
      .eq('game_club_id', club.id)
      .order('name');
    setAllProducts(data || []);
  }

  useEffect(() => {
    loadProducts();
  }, [club?.id]);

  const searchResults = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return [];
    return allProducts.filter((p) => p.name.toLowerCase().includes(term)).slice(0, 8);
  }, [searchTerm, allProducts]);

  function addToCart(product) {
    setCart((c) => {
      const existing = c.find((item) => item.product_id === product.id);
      if (existing) {
        if (existing.quantity >= product.quantity) return c;
        return c.map((item) =>
          item.product_id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      if (product.quantity <= 0) return c;
      return [
        ...c,
        {
          product_id: product.id,
          name: product.name,
          image_url: product.image_url,
          unit: product.unit,
          price: Number(product.sale_price),
          stock: Number(product.quantity),
          quantity: 1,
        },
      ];
    });
    setSearchTerm('');
    setSearchOpen(false);
  }

  function updateQty(productId, value) {
    setCart((c) =>
      c.map((item) => {
        if (item.product_id !== productId) return item;
        let q = Number(value);
        if (isNaN(q) || q < 0) q = 0;
        if (q > item.stock) q = item.stock;
        return { ...item, quantity: q };
      })
    );
  }

  function removeLine(productId) {
    setCart((c) => c.filter((item) => item.product_id !== productId));
  }

  function resetSale() {
    setCart([]);
    setPaymentMethod('naqd');
    setMessage({ type: '', text: '' });
  }

  const itemsCount = cart.reduce((s, i) => s + Number(i.quantity), 0);
  const grandTotal = cart.reduce((s, i) => s + Number(i.quantity) * Number(i.price), 0);

  async function handleFinish() {
    setMessage({ type: '', text: '' });

    const validLines = cart.filter((i) => i.quantity > 0);
    if (validLines.length === 0) {
      setMessage({ type: 'error', text: "Savat bo'sh." });
      return;
    }

    setFinalizing(true);

    try {
      const { data: sale, error: saleErr } = await supabase
        .from('sales')
        .insert({
          game_club_id: club.id,
          payment_method: paymentMethod,
          total: grandTotal,
        })
        .select()
        .single();

      if (saleErr || !sale) {
        setMessage({ type: 'error', text: saleErr?.message || 'Xatolik yuz berdi.' });
        setFinalizing(false);
        return;
      }

      const itemRows = validLines.map((i) => ({
        sale_id: sale.id,
        game_club_id: club.id,
        product_id: i.product_id,
        product_name: i.name,
        unit: i.unit,
        quantity: i.quantity,
        price: i.price,
        line_total: i.quantity * i.price,
      }));

      await supabase.from('sale_items').insert(itemRows);

      for (const line of validLines) {
        const newQty = Math.max(0, line.stock - line.quantity);
        await supabase.from('products').update({ quantity: newQty }).eq('id', line.product_id);
      }

      setMessage({ type: 'ok', text: 'Sotuv yakunlandi.' });
      resetSale();
      loadProducts();
    } catch (err) {
      setMessage({ type: 'error', text: 'Kutilmagan xatolik yuz berdi.' });
    } finally {
      setFinalizing(false);
    }
  }

  return (
    <>
      <div className={styles.pageHead}>
        <h1>Sotuv POS</h1>
      </div>

      <div className={styles.posWrap}>
        {/* Chap: qidiruv + savat */}
        <div className={styles.panel}>
          <div className={styles.posSearchWrap}>
            <input
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setSearchOpen(true); }}
              onFocus={() => setSearchOpen(true)}
              placeholder="Mahsulot nomi, barkod yoki SKU"
              style={{
                width: '100%', background: 'rgba(0,0,0,.35)', border: '1.5px solid rgba(255,31,61,.5)',
                color: '#fff', padding: '12px 14px', outline: 'none', fontSize: 14,
              }}
            />
            {searchOpen && searchResults.length > 0 && (
              <div className={styles.posSearchResults}>
                {searchResults.map((p) => (
                  <div key={p.id} className={styles.posSearchItem} onClick={() => addToCart(p)}>
                    {p.image_url ? (
                      <img src={p.image_url} alt="" className={styles.productThumb} />
                    ) : (
                      <div className={styles.productThumbPlaceholder}>—</div>
                    )}
                    <span className="name" style={{ flex: 1 }}>{p.name}</span>
                    <span className={styles.mutedSmall}>{p.quantity} {p.unit}</span>
                    <span style={{ color: '#ff9c7f', fontWeight: 600, fontSize: 12.5 }}>
                      {Number(p.sale_price).toLocaleString('ru-RU')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>№</th>
                  <th>Rasm</th>
                  <th>Nomi</th>
                  <th>Miqdor</th>
                  <th>Narx</th>
                  <th>Jami narxi</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {cart.map((item, idx) => (
                  <tr key={item.product_id}>
                    <td>{idx + 1}</td>
                    <td>
                      {item.image_url ? (
                        <img src={item.image_url} alt="" className={styles.productThumb} />
                      ) : (
                        <div className={styles.productThumbPlaceholder}>—</div>
                      )}
                    </td>
                    <td>{item.name}</td>
                    <td>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        max={item.stock}
                        className={styles.qtyInput}
                        value={item.quantity}
                        onChange={(e) => updateQty(item.product_id, e.target.value)}
                      />
                      <span className={styles.mutedSmall} style={{ marginLeft: 6 }}>{item.unit}</span>
                    </td>
                    <td>{item.price.toLocaleString('ru-RU')}</td>
                    <td>{(item.price * item.quantity).toLocaleString('ru-RU')}</td>
                    <td>
                      <button className={styles.btnIcon} onClick={() => removeLine(item.product_id)} aria-label="O'chirish">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                          <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {cart.length === 0 && (
              <div className={styles.cartEmpty}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M21 8V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v2M3 8l1.5 11a2 2 0 0 0 2 1.8h11a2 2 0 0 0 2-1.8L21 8M3 8h18" />
                </svg>
                <span>Savat bo'sh</span>
              </div>
            )}
          </div>
        </div>

        {/* O'ng: to'lov */}
        <div className={styles.panel}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8 }}>
            To'lov turi
          </label>
          <div className={styles.paymentRow}>
            {PAYMENT_METHODS.map((m) => (
              <button
                key={m.key}
                type="button"
                className={`${styles.paymentBtn} ${paymentMethod === m.key ? styles.paymentBtnActive : ''}`}
                onClick={() => setPaymentMethod(m.key)}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div className={styles.totalsRow}>
            <span>Umumiy miqdor</span>
            <span>{itemsCount}</span>
          </div>

          <div className={styles.totalsGrand}>
            <span style={{ fontSize: 14, color: 'var(--muted)', fontWeight: 500 }}>Jami:</span>
            <span>{grandTotal.toLocaleString('ru-RU')} so'm</span>
          </div>

          {message.text && (
            <p
              className={message.type === 'error' ? styles.errorText : styles.mutedSmall}
              style={message.type === 'ok' ? { color: '#7fffa0', marginTop: 10 } : { marginTop: 10 }}
            >
              {message.text}
            </p>
          )}

          <div className={styles.posActions}>
            <button className={styles.btnGhost} onClick={resetSale}>
              Yangi
            </button>
            <button className={styles.btnPrimary} onClick={handleFinish} disabled={finalizing || cart.length === 0}>
              {finalizing ? 'Yakunlanmoqda...' : 'Yakunlash'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
