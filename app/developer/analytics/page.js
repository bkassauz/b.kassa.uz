'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import styles from '../developer.module.css';

// Hozircha namunaviy ma'lumot — kelajakda "sales" jadvalidan real query bilan almashtiriladi
const SAMPLE_WEEK = [
  { day: 'Dush', value: 42 },
  { day: 'Sesh', value: 58 },
  { day: 'Chor', value: 39 },
  { day: 'Pay', value: 71 },
  { day: 'Jum', value: 88 },
  { day: 'Shan', value: 95 },
  { day: 'Yak', value: 63 },
];

const SAMPLE_PRODUCTS = [
  { name: 'VOLT Energy', value: 120 },
  { name: 'ONYX Energy', value: 96 },
  { name: 'Cola 0.5L', value: 84 },
  { name: 'Suv 0.5L', value: 70 },
  { name: 'Chips', value: 44 },
];

function LineChart({ data }) {
  const w = 560, h = 200, pad = 30;
  const max = Math.max(...data.map((d) => d.value));
  const stepX = (w - pad * 2) / (data.length - 1);

  const points = data.map((d, i) => {
    const x = pad + i * stepX;
    const y = h - pad - (d.value / max) * (h - pad * 2);
    return `${x},${y}`;
  });

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%">
      <defs>
        <linearGradient id="lineFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ff1f3d" stopOpacity="0.35" />
          <stop offset="1" stopColor="#ff1f3d" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75, 1].map((t) => (
        <line
          key={t}
          x1={pad} x2={w - pad}
          y1={h - pad - t * (h - pad * 2)} y2={h - pad - t * (h - pad * 2)}
          stroke="rgba(255,255,255,.06)"
        />
      ))}
      <polyline points={points.join(' ')} fill="none" stroke="#ff1f3d" strokeWidth="2.5" />
      <polygon
        points={`${pad},${h - pad} ${points.join(' ')} ${w - pad},${h - pad}`}
        fill="url(#lineFill)"
      />
      {data.map((d, i) => {
        const x = pad + i * stepX;
        const y = h - pad - (d.value / max) * (h - pad * 2);
        return <circle key={d.day} cx={x} cy={y} r="3.5" fill="#ff5470" />;
      })}
      {data.map((d, i) => (
        <text
          key={d.day}
          x={pad + i * stepX}
          y={h - 6}
          fontSize="10"
          fill="#8b8b98"
          textAnchor="middle"
        >
          {d.day}
        </text>
      ))}
    </svg>
  );
}

function BarChart({ data }) {
  const w = 400, h = 220, pad = 26, barGap = 14;
  const max = Math.max(...data.map((d) => d.value));
  const barW = (w - pad * 2 - barGap * (data.length - 1)) / data.length;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%">
      {data.map((d, i) => {
        const barH = (d.value / max) * (h - pad * 2 - 16);
        const x = pad + i * (barW + barGap);
        const y = h - pad - barH;
        return (
          <g key={d.name}>
            <rect
              x={x} y={y} width={barW} height={barH}
              fill="url(#barFill)"
              rx="3"
            />
            <text x={x + barW / 2} y={h - 8} fontSize="9" fill="#8b8b98" textAnchor="middle">
              {d.name.split(' ')[0]}
            </text>
          </g>
        );
      })}
      <defs>
        <linearGradient id="barFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ff5470" />
          <stop offset="1" stopColor="#8c0e22" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function AnalyticsPage() {
  const [clubs, setClubs] = useState([]);
  const [selectedClub, setSelectedClub] = useState('');

  useEffect(() => {
    supabase
      .from('game_clubs')
      .select('id, name')
      .order('name')
      .then(({ data }) => setClubs(data || []));
  }, []);

  return (
    <>
      <div className={styles.pageHead}>
        <h1>Analitika</h1>
        <p>Tahlil qilmoqchi bo'lgan game club barni tanlang</p>
      </div>

      <div className={styles.selectRow}>
        <div className={styles.formField}>
          <label>Game Club</label>
          <select value={selectedClub} onChange={(e) => setSelectedClub(e.target.value)}>
            <option value="">— tanlang —</option>
            {clubs.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {!selectedClub && (
        <div className={styles.panel}>
          <p className={styles.mutedSmall}>
            Statistikani ko'rish uchun yuqoridan game club tanlang.
          </p>
        </div>
      )}

      {selectedClub && (
        <>
          <div className={styles.chartGrid}>
            <div className={styles.panel}>
              <div className={styles.panelHead}>
                <h2>Haftalik savdo dinamikasi</h2>
              </div>
              <LineChart data={SAMPLE_WEEK} />
              <p className={styles.chartCaption}>Namunaviy ma'lumot — sales jadvali ulanganda real ko'rsatkichlar chiqadi.</p>
            </div>

            <div className={styles.panel}>
              <div className={styles.panelHead}>
                <h2>Top mahsulotlar</h2>
              </div>
              <BarChart data={SAMPLE_PRODUCTS} />
              <p className={styles.chartCaption}>Eng ko'p sotilgan 5 ta mahsulot (namunaviy).</p>
            </div>
          </div>

          <div className={styles.panel}>
            <div className={styles.panelHead}>
              <h2>Qisqacha jadval</h2>
            </div>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr><th>Mahsulot</th><th>Sotildi</th><th>Ulush</th></tr>
                </thead>
                <tbody>
                  {SAMPLE_PRODUCTS.map((p) => (
                    <tr key={p.name}>
                      <td>{p.name}</td>
                      <td>{p.value}</td>
                      <td>{Math.round((p.value / SAMPLE_PRODUCTS.reduce((s, x) => s + x.value, 0)) * 100)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className={styles.placeholderNote}>
              Bu jadval hozircha namunaviy. Sotuvlar jadvali (masalan `sales`) Supabase'ga
              qo'shilgach, shu joyga real so'rov ulanadi.
            </p>
          </div>
        </>
      )}
    </>
  );
}
