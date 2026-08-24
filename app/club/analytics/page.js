'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { useClubAuth } from '../../../lib/ClubAuthContext';
import styles from '../club.module.css';

const PAYMENT_LABELS = { naqd: 'Naqd', karta: 'Karta', click: 'Click' };

const PERIODS = [
  { key: 'bugun', label: 'Bugun' },
  { key: '7kun', label: '7 kun' },
  { key: '30kun', label: '30 kun' },
  { key: 'hammasi', label: 'Hammasi' },
];

function periodStart(period) {
  const now = new Date();
  if (period === 'bugun') return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (period === '7kun') { const d = new Date(now); d.setDate(d.getDate() - 6); d.setHours(0, 0, 0, 0); return d; }
  if (period === '30kun') { const d = new Date(now); d.setDate(d.getDate() - 29); d.setHours(0, 0, 0, 0); return d; }
  return null;
}

function dayKey(iso) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function dayLabel(key) {
  const [, m, d] = key.split('-');
  return `${d}.${m}`;
}

function fmt(n) {
  return Math.round(Number(n) || 0).toLocaleString('ru-RU');
}

function LineChart({ data }) {
  const w = 640, h = 220, pad = 34;
  const max = Math.max(1, ...data.map((d) => d.value));
  const stepX = data.length > 1 ? (w - pad * 2) / (data.length - 1) : 0;

  const points = data.map((d, i) => {
    const x = pad + i * stepX;
    const y = h - pad - (d.value / max) * (h - pad * 2);
    return `${x},${y}`;
  });

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%">
      <defs>
        <linearGradient id="clubLineFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ff1f3d" stopOpacity="0.35" />
          <stop offset="1" stopColor="#ff1f3d" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75, 1].map((t) => (
        <line key={t} x1={pad} x2={w - pad} y1={h - pad - t * (h - pad * 2)} y2={h - pad - t * (h - pad * 2)} stroke="rgba(255,255,255,.06)" />
      ))}
      {data.length > 1 && (
        <>
          <polyline points={points.join(' ')} fill="none" stroke="#ff1f3d" strokeWidth="2.5" />
          <polygon points={`${pad},${h - pad} ${points.join(' ')} ${w - pad},${h - pad}`} fill="url(#clubLineFill)" />
        </>
      )}
      {data.map((d, i) => {
        const x = pad + i * stepX;
        const y = h - pad - (d.value / max) * (h - pad * 2);
        return <circle key={d.label + i} cx={x} cy={y} r="3.2" fill="#ff5470" />;
      })}
      {data.map((d, i) => (
        (data.length <= 10 || i % Math.ceil(data.length / 10) === 0) && (
          <text key={d.label + i + 'l'} x={pad + i * stepX} y={h - 8} fontSize="9.5" fill="#8b8b98" textAnchor="middle">
            {d.label}
          </text>
        )
      ))}
    </svg>
  );
}

export default function ClubAnalyticsPage() {
  const { club } = useClubAuth();
  const [period, setPeriod] = useState('7kun');
  const [loading, setLoading] = useState(true);
  const [sales, setSales] = useState([]);
  const [saleItems, setSaleItems] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    if (!club?.id) return;

    async function load() {
      setLoading(true);
      const [salesRes, itemsRes, productsRes] = await Promise.all([
        supabase.from('sales').select('id, total, payment_method, created_at').eq('game_club_id', club.id),
        supabase.from('sale_items').select('*, sales(created_at)').eq('game_club_id', club.id),
        supabase.from('products').select('id, name, quantity, cost_price, category_id, categories(name)').eq('game_club_id', club.id),
      ]);
      setSales(salesRes.data || []);
      setSaleItems(itemsRes.data || []);
      setProducts(productsRes.data || []);
      setLoading(false);
    }

    load();
  }, [club?.id]);

  const filtered = useMemo(() => {
    const start = periodStart(period);
    const salesF = start ? sales.filter((s) => new Date(s.created_at) >= start) : sales;
    const itemsF = start ? saleItems.filter((i) => new Date(i.sales?.created_at || i.created_at) >= start) : saleItems;
    return { salesF, itemsF };
  }, [sales, saleItems, period]);

  const stats = useMemo(() => {
    const { salesF, itemsF } = filtered;
    const totalRevenue = salesF.reduce((s, r) => s + Number(r.total), 0);
    const txCount = salesF.length;
    const avgCheck = txCount > 0 ? totalRevenue / txCount : 0;
    const unitsSold = itemsF.reduce((s, r) => s + Number(r.quantity), 0);
    return { totalRevenue, txCount, avgCheck, unitsSold };
  }, [filtered]);

  const dailySeries = useMemo(() => {
    const { salesF } = filtered;
    const map = {};
    salesF.forEach((s) => {
      const key = dayKey(s.created_at);
      map[key] = (map[key] || 0) + Number(s.total);
    });
    const keys = Object.keys(map).sort();
    return keys.map((k) => ({ label: dayLabel(k), value: map[k] }));
  }, [filtered]);

  const topProducts = useMemo(() => {
    const { itemsF } = filtered;
    const map = {};
    itemsF.forEach((i) => {
      if (!map[i.product_name]) map[i.product_name] = { name: i.product_name, qty: 0, revenue: 0 };
      map[i.product_name].qty += Number(i.quantity);
      map[i.product_name].revenue += Number(i.line_total);
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 6);
  }, [filtered]);

  const paymentBreakdown = useMemo(() => {
    const { salesF } = filtered;
    const map = {};
    salesF.forEach((s) => {
      const key = s.payment_method || 'boshqa';
      if (!map[key]) map[key] = { key, count: 0, total: 0 };
      map[key].count += 1;
      map[key].total += Number(s.total);
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [filtered]);

  const categoryBreakdown = useMemo(() => {
    const { itemsF } = filtered;
    const productCatMap = {};
    products.forEach((p) => {
      productCatMap[p.id] = p.categories?.name || 'Boshqa';
    });
    const map = {};
    itemsF.forEach((i) => {
      const catName = productCatMap[i.product_id] || 'Boshqa';
      map[catName] = (map[catName] || 0) + Number(i.line_total);
    });
    const arr = Object.entries(map).map(([name, revenue]) => ({ name, revenue }));
    return arr.sort((a, b) => b.revenue - a.revenue);
  }, [filtered, products]);

  const lowStock = useMemo(() => {
    return products.filter((p) => Number(p.quantity) <= 5).sort((a, b) => a.quantity - b.quantity);
  }, [products]);

  const profitBreakdown = useMemo(() => {
    const { itemsF } = filtered;
    const costMap = {};
    products.forEach((p) => { costMap[p.id] = Number(p.cost_price) || 0; });

    const map = {};
    itemsF.forEach((i) => {
      if (!map[i.product_name]) {
        map[i.product_name] = { name: i.product_name, qty: 0, cost: 0, revenue: 0 };
      }
      const unitCost = costMap[i.product_id] ?? 0;
      map[i.product_name].qty += Number(i.quantity);
      map[i.product_name].cost += unitCost * Number(i.quantity);
      map[i.product_name].revenue += Number(i.line_total);
    });

    return Object.values(map)
      .map((r) => ({ ...r, profit: r.revenue - r.cost }))
      .sort((a, b) => b.profit - a.profit);
  }, [filtered, products]);

  const profitBreakdownTotals = useMemo(() => {
    const cost = profitBreakdown.reduce((s, r) => s + r.cost, 0);
    const revenue = profitBreakdown.reduce((s, r) => s + r.revenue, 0);
    return { cost, revenue, profit: revenue - cost };
  }, [profitBreakdown]);

  const profitByDay = useMemo(() => {
    const { itemsF } = filtered;
    const costMap = {};
    products.forEach((p) => { costMap[p.id] = Number(p.cost_price) || 0; });

    const map = {};
    itemsF.forEach((i) => {
      const key = dayKey(i.sales?.created_at || i.created_at);
      if (!map[key]) map[key] = { key, cost: 0, revenue: 0 };
      map[key].cost += Number(i.quantity) * (costMap[i.product_id] ?? 0);
      map[key].revenue += Number(i.line_total);
    });

    return Object.values(map)
      .sort((a, b) => a.key.localeCompare(b.key))
      .map((r) => ({ ...r, profit: r.revenue - r.cost, label: dayLabel(r.key) }));
  }, [filtered, products]);

  const profitTotals = useMemo(() => {
    const cost = profitByDay.reduce((s, r) => s + r.cost, 0);
    const revenue = profitByDay.reduce((s, r) => s + r.revenue, 0);
    return { cost, revenue, profit: revenue - cost };
  }, [profitByDay]);

  const maxTopRevenue = Math.max(1, ...topProducts.map((p) => p.revenue));
  const maxCatRevenue = Math.max(1, ...categoryBreakdown.map((c) => c.revenue));

  if (loading) {
    return <p className={styles.mutedSmall}>Yuklanmoqda...</p>;
  }

  return (
    <>
      <div className={styles.pageHead}>
        <h1>Analitika</h1>
        <p>Savdo va ombor bo'yicha to'liq tahlil</p>
      </div>

      <div className={styles.periodRow}>
        {PERIODS.map((p) => (
          <button
            key={p.key}
            className={`${styles.periodBtn} ${period === p.key ? styles.periodBtnActive : ''}`}
            onClick={() => setPeriod(p.key)}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className={styles.grid}>
        <div className={styles.widget}>
          <div className={styles.widgetAccent}></div>
          <div className={styles.widgetLabel}>Jami savdo</div>
          <div className={styles.widgetValue}>{fmt(stats.totalRevenue)}</div>
          <div className={styles.widgetHint}>so'm</div>
        </div>
        <div className={styles.widget}>
          <div className={styles.widgetAccent}></div>
          <div className={styles.widgetLabel}>Tranzaksiyalar</div>
          <div className={styles.widgetValue}>{stats.txCount}</div>
          <div className={styles.widgetHint}>ta chek</div>
        </div>
        <div className={styles.widget}>
          <div className={styles.widgetAccent}></div>
          <div className={styles.widgetLabel}>O'rtacha chek</div>
          <div className={styles.widgetValue}>{fmt(stats.avgCheck)}</div>
          <div className={styles.widgetHint}>so'm</div>
        </div>
        <div className={styles.widget}>
          <div className={styles.widgetAccent}></div>
          <div className={styles.widgetLabel}>Sotilgan mahsulot</div>
          <div className={styles.widgetValue}>{fmt(stats.unitsSold)}</div>
          <div className={styles.widgetHint}>dona/birlik</div>
        </div>
        <div className={styles.widget}>
          <div className={styles.widgetAccent}></div>
          <div className={styles.widgetLabel}>Sof foyda</div>
          <div className={styles.widgetValue}>{fmt(profitTotals.profit)}</div>
          <div className={styles.widgetHint}>so'm (kelish narxi asosida)</div>
        </div>
      </div>

      <div className={styles.panel}>
        <div className={styles.panelHead}>
          <h2>Savdo dinamikasi</h2>
        </div>
        {dailySeries.length === 0 ? (
          <p className={styles.emptyNote}>Tanlangan davrda savdo topilmadi.</p>
        ) : (
          <LineChart data={dailySeries} />
        )}
      </div>

      <div className={styles.panel}>
        <div className={styles.panelHead}>
          <h2>Foyda tahlili</h2>
        </div>
        <div className={styles.grid} style={{ marginBottom: 18 }}>
          <div className={styles.widget}>
            <div className={styles.widgetAccent}></div>
            <div className={styles.widgetLabel}>Kelish narxi (tannarx)</div>
            <div className={styles.widgetValue}>{fmt(profitTotals.cost)}</div>
            <div className={styles.widgetHint}>so'm</div>
          </div>
          <div className={styles.widget}>
            <div className={styles.widgetAccent}></div>
            <div className={styles.widgetLabel}>Sotuv narxi</div>
            <div className={styles.widgetValue}>{fmt(profitTotals.revenue)}</div>
            <div className={styles.widgetHint}>so'm</div>
          </div>
          <div className={styles.widget}>
            <div className={styles.widgetAccent}></div>
            <div className={styles.widgetLabel}>Sof foyda</div>
            <div className={styles.widgetValue} style={{ color: profitTotals.profit >= 0 ? '#7fffa0' : '#ff6b7f' }}>
              {fmt(profitTotals.profit)}
            </div>
            <div className={styles.widgetHint}>so'm</div>
          </div>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr><th>Sana</th><th>Kelish narxi</th><th>Sotuv narxi</th><th>Foyda</th></tr>
            </thead>
            <tbody>
              {profitByDay.length === 0 && (
                <tr><td colSpan={4} className={styles.tableEmpty}>Tanlangan davrda ma'lumot yo'q.</td></tr>
              )}
              {profitByDay.map((r) => (
                <tr key={r.key}>
                  <td>{r.label}</td>
                  <td>{fmt(r.cost)}</td>
                  <td>{fmt(r.revenue)}</td>
                  <td style={{ color: r.profit >= 0 ? '#7fffa0' : '#ff6b7f' }}>{fmt(r.profit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className={styles.placeholderNote} style={{ marginTop: 12 }}>
          Kelish narxi mahsulotning hozirgi (joriy) tannarxi asosida taxminiy hisoblanadi.
        </p>
      </div>

      <div className={styles.chartGrid}>
        <div className={styles.panel}>
          <div className={styles.panelHead}>
            <h2>Top mahsulotlar</h2>
          </div>
          {topProducts.length === 0 && <p className={styles.emptyNote}>Ma'lumot yo'q.</p>}
          {topProducts.map((p) => (
            <div key={p.name}>
              <div className={styles.barLabel}>
                <span>{p.name} ({p.qty})</span>
                <span>{fmt(p.revenue)}</span>
              </div>
              <div className={styles.barTrack}>
                <div className={styles.barFill} style={{ width: `${(p.revenue / maxTopRevenue) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>

        <div className={styles.panel}>
          <div className={styles.panelHead}>
            <h2>Kategoriyalar bo'yicha savdo</h2>
          </div>
          {categoryBreakdown.length === 0 && <p className={styles.emptyNote}>Ma'lumot yo'q.</p>}
          {categoryBreakdown.map((c) => (
            <div key={c.name}>
              <div className={styles.barLabel}>
                <span>{c.name}</span>
                <span>{fmt(c.revenue)}</span>
              </div>
              <div className={styles.barTrack}>
                <div className={styles.barFill} style={{ width: `${(c.revenue / maxCatRevenue) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.chartGrid}>
        <div className={styles.panel}>
          <div className={styles.panelHead}>
            <h2>To'lov turlari</h2>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr><th>Turi</th><th>Soni</th><th>Summa</th><th>Ulush</th></tr>
              </thead>
              <tbody>
                {paymentBreakdown.length === 0 && (
                  <tr><td colSpan={4} className={styles.tableEmpty}>Ma'lumot yo'q.</td></tr>
                )}
                {paymentBreakdown.map((p) => (
                  <tr key={p.key}>
                    <td><span className={styles.badge}>{PAYMENT_LABELS[p.key] || p.key}</span></td>
                    <td>{p.count}</td>
                    <td>{fmt(p.total)}</td>
                    <td>{stats.totalRevenue > 0 ? Math.round((p.total / stats.totalRevenue) * 100) : 0}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className={styles.panel}>
          <div className={styles.panelHead}>
            <h2>Kam qolgan mahsulotlar</h2>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr><th>Nomi</th><th>Qoldiq</th></tr>
              </thead>
              <tbody>
                {lowStock.length === 0 && (
                  <tr><td colSpan={2} className={styles.tableEmpty}>Kam qolgan mahsulot yo'q.</td></tr>
                )}
                {lowStock.map((p) => (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td className={styles.lowStock}>{p.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div className={styles.panel}>
        <div className={styles.panelHead}>
          <h2>Foyda tahlili — kelish / sotuv narxi bo'yicha</h2>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Mahsulot</th>
                <th>Soni</th>
                <th>Kelish narxi (jami)</th>
                <th>Sotuv narxi (jami)</th>
                <th>Foyda</th>
              </tr>
            </thead>
            <tbody>
              {profitBreakdown.length === 0 && (
                <tr><td colSpan={5} className={styles.tableEmpty}>Tanlangan davrda ma'lumot yo'q.</td></tr>
              )}
              {profitBreakdown.map((r) => (
                <tr key={r.name}>
                  <td>{r.name}</td>
                  <td>{r.qty}</td>
                  <td>{fmt(r.cost)}</td>
                  <td>{fmt(r.revenue)}</td>
                  <td className={r.profit >= 0 ? undefined : styles.lowStock} style={r.profit >= 0 ? { color: '#7fffa0', fontWeight: 600 } : undefined}>
                    {fmt(r.profit)}
                  </td>
                </tr>
              ))}
            </tbody>
            {profitBreakdown.length > 0 && (
              <tfoot>
                <tr>
                  <td style={{ fontWeight: 700 }}>Jami</td>
                  <td></td>
                  <td style={{ fontWeight: 700 }}>{fmt(profitBreakdownTotals.cost)}</td>
                  <td style={{ fontWeight: 700 }}>{fmt(profitBreakdownTotals.revenue)}</td>
                  <td style={{ fontWeight: 700, color: '#7fffa0' }}>{fmt(profitBreakdownTotals.profit)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
        <p className={styles.placeholderNote} style={{ marginTop: 12 }}>
          Foyda hisobi mahsulotning hozirgi kelish narxi asosida taxminiy hisoblanadi
          (narx keyinchalik o'zgargan bo'lsa, sotuv vaqtidagi narx alohida saqlanmaydi).
        </p>
      </div>
    </>
  );
}
