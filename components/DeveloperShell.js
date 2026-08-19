'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import styles from '../app/developer/developer.module.css';

const TITLES = {
  '/developer/dashboard': ['Dashboard', "Umumiy ko'rinish"],
  '/developer/game-clubs': ['Game Clubs', "Barlarni ro'yxatga olish"],
  '/developer/analytics': ['Analitika', "Game club bo'yicha statistika"],
  '/developer/settings': ['Developer sozlamalari', 'Profil va xavfsizlik'],
};

export default function DeveloperShell({ userLabel, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const matchedKey = Object.keys(TITLES).find((key) => pathname?.startsWith(key));
  const [title, subtitle] = matchedKey ? TITLES[matchedKey] : ['b.Kassa.uz', ''];

  return (
    <div className={styles.wrap}>
      <div className={styles.bg}></div>

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} userLabel={userLabel} />

      <header className={styles.topbar}>
        <button
          className={styles.burger}
          onClick={() => setSidebarOpen(true)}
          aria-label="Menyu"
        >
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
