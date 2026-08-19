'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from '../lib/useRequireAuth';
import styles from '../app/developer/developer.module.css';

const NAV_ITEMS = [
  {
    href: '/developer/dashboard',
    label: 'Dashboard',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="9" />
        <rect x="14" y="3" width="7" height="5" />
        <rect x="14" y="12" width="7" height="9" />
        <rect x="3" y="16" width="7" height="5" />
      </svg>
    ),
  },
  {
    href: '/developer/game-clubs',
    label: 'Game Clubs',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="10" rx="3" />
        <circle cx="8" cy="12" r="1.6" />
        <path d="M14.5 12h4M16.5 10v4" />
      </svg>
    ),
  },
  {
    href: '/developer/analytics',
    label: 'Analitika',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18" />
        <rect x="7" y="12" width="3" height="6" />
        <rect x="12.5" y="8" width="3" height="10" />
        <rect x="18" y="5" width="3" height="13" />
      </svg>
    ),
  },
  {
    href: '/developer/settings',
    label: 'Developer sozlamalari',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
      </svg>
    ),
  },
];

export default function Sidebar({ open, onClose, userLabel }) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <>
      <div
        className={`${styles.overlay} ${open ? styles.overlayOpen : ''}`}
        onClick={onClose}
      />
      <aside className={`${styles.sidebar} ${open ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarHead}>
          <div className={styles.sidebarLogo}>b.<span>Kassa</span></div>
          <div className={styles.sidebarLogoSub}>Developer panel</div>
        </div>

        <nav>
          {NAV_ITEMS.map((item) => {
            const active = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navItem} ${active ? styles.navItemActive : ''}`}
                onClick={onClose}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className={styles.sidebarFoot}>
          <p className={styles.userChip} style={{ marginBottom: 10 }}>
            {userLabel ? <>Xush kelibsiz, <b>{userLabel}</b></> : null}
          </p>
          <button className={styles.logoutBtn} onClick={() => signOut(router)}>
            Chiqish
          </button>
        </div>
      </aside>
    </>
  );
}
