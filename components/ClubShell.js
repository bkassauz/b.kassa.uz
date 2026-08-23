'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import ClubSidebar from './ClubSidebar';
import styles from '../app/club/club.module.css';

const TITLES = {
  '/club/pos': ['Sotuv POS', ''],
  '/club/dashboard': ['Dashboard', "Umumiy ko'rinish"],
  '/club/products': ['Mahsulotlar', "Kategoriyalar va ombor"],
  '/club/sales-history': ['Savdo tarixi', "POS orqali sotilgan mahsulotlar"],
  '/club/history': ['Kirim tarixi', "Barcha o'zgarishlar jurnali"],
};

export default function ClubShell({ userLabel, clubName, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const matchedKey = Object.keys(TITLES).find((key) => pathname?.startsWith(key));
  const [title, subtitle] = matchedKey ? TITLES[matchedKey] : ['b.Kassa.uz', ''];

  return (
    <div className={styles.wrap}>
      <div className={styles.bg}></div>

      <ClubSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        userLabel={userLabel}
        clubName={clubName}
      />

      <header className={styles.topbar}>
        <button className={styles.burger} onClick={() => setSidebarOpen(true)} aria-label="Menyu">
          <span></span><span></span><span></span>
        </button>
        <div>
          <div className={styles.topbarTitle}>{title}</div>
          {subtitle && <div className={styles.topbarSub}>{subtitle}</div>}
        </div>
        <div className={styles.topbarRight}>
          {userLabel && (
            <span className={styles.userChip}>
              <b>{userLabel}</b>
            </span>
          )}
        </div>
      </header>

      <main className={styles.main}>{children}</main>
    </div>
  );
}
