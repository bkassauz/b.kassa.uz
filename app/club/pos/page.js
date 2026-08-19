'use client';

import styles from '../club.module.css';

export default function PosPage() {
  return (
    <>
      <div className={styles.pageHead}>
        <h1>Sotuv POS</h1>
        <p>Bu bo'lim tez orada to'liq ishga tushiriladi</p>
      </div>

      <div className={styles.panel}>
        <p className={styles.mutedSmall}>
          Sotuv (POS) interfeysi shu joyga qo'shiladi — talablar aniqlashtirilgach.
        </p>
      </div>
    </>
  );
}
