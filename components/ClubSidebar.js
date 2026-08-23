'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';
import styles from '../app/club/club.module.css';

const NAV_ITEMS = [
  {
    href: '/club/pos',
    label: 'Sotuv POS',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <path d="M6 11h4M6 15h2" />
        <path d="M16 3v4M8 3v4" />
      </svg>
    ),
  },
  {
    href: '/club/dashboard',
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
    href: '/club/products',
    label: 'Mahsulotlar',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 7 12 3 4 7v10l8 4 8-4V7z" />
        <path d="M4 7l8 4 8-4M12 11v10" />
      </svg>
    ),
  },
  {
    href: '/club/analytics',
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
    href: '/club/sales-history',
    label: 'Savdo tarixi',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" />
        <path d="M14 2v6h6M9 13h6M9 17h6" />
      </svg>
    ),
  },
  {
    href: '/club/history',
    label: 'Kirim tarixi',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v5h5" />
        <path d="M3.05 13a9 9 0 1 0 2.13-6.36L3 8" />
        <path d="M12 7v5l3 3" />
      </svg>
    ),
  },
];

export default function ClubSidebar({ open, onClose, userLabel, clubName }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace('/login');
  }

  return (
    <>
      <div className={`${styles.overlay} ${open ? styles.overlayOpen : ''}`} onClick={onClose} />
      <aside className={`${styles.sidebar} ${open ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarHead}>
          <div className={styles.sidebarLogo}>b.<span>Kassa</span></div>
          <div className={styles.sidebarLogoSub}>{clubName || 'Club panel'}</div>
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
          <button className={styles.logoutBtn} onClick={handleSignOut}>
            Chiqish
          </button>
        </div>
      </aside>
    </>
  );
}
