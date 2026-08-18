'use client';

import { useState } from 'react';
import Sidebar from './Sidebar';
import styles from '../app/developer/developer.module.css';

export default function DeveloperShell({ title, subtitle, userLabel, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
