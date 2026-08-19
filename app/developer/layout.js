'use client';

import { DeveloperAuthProvider, useDeveloperAuth } from '../../lib/DeveloperAuthContext';
import DeveloperShell from '../../components/DeveloperShell';
import styles from './developer.module.css';

function Inner({ children }) {
  const { loading, profile } = useDeveloperAuth();

  if (loading) {
    return <div className={styles.loadingScreen}>Yuklanmoqda...</div>;
  }

  return (
    <DeveloperShell userLabel={profile?.full_name || profile?.username}>
      {children}
    </DeveloperShell>
  );
}

export default function DeveloperLayout({ children }) {
  return (
    <DeveloperAuthProvider>
      <Inner>{children}</Inner>
    </DeveloperAuthProvider>
  );
}
