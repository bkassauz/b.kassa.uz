'use client';

import { ClubAuthProvider, useClubAuth } from '../../lib/ClubAuthContext';
import ClubShell from '../../components/ClubShell';
import styles from './club.module.css';

function Inner({ children }) {
  const { loading, profile, club } = useClubAuth();

  if (loading) {
    return <div className={styles.loadingScreen}>Yuklanmoqda...</div>;
  }

  return (
    <ClubShell userLabel={profile?.full_name || profile?.username} clubName={club?.name}>
      {children}
    </ClubShell>
  );
}

export default function ClubLayout({ children }) {
  return (
    <ClubAuthProvider>
      <Inner>{children}</Inner>
    </ClubAuthProvider>
  );
}
