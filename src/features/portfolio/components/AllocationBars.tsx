'use client';

import type { ReactNode } from 'react';
import styles from '../portfolio.module.css';

export interface AllocationBarItem {
  key: string;
  label: ReactNode;
  valueText: string;
  percentage: number;
}

/** Shared horizontal allocation bars used by portfolio positions and statistics views. */
export function AllocationBars({
  items,
  spaced = false,
}: {
  items: readonly AllocationBarItem[];
  spaced?: boolean;
}) {
  return (
    <div
      className={
        spaced ? `${styles.barsList} ${styles.barsListSpaced}` : styles.barsList
      }
    >
      {items.map((item) => (
        <div key={item.key} className={styles.barRow}>
          <div className={styles.barRowHeader}>
            <span>{item.label}</span>
            <span className={styles.tabularNum}>{item.valueText}</span>
          </div>
          <div className={styles.barTrack}>
            <div
              className={styles.barFill}
              style={{
                width: `${Math.min(100, Math.max(0, item.percentage))}%`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
