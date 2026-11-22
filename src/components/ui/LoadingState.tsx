'use client';

import { useId } from 'react';
import styles from './loading.module.css';

export interface LoadingStateProps {
  label: string;
  detail?: string;
  mode?: 'card' | 'compact';
}

export function LoadingState({
  label,
  detail,
  mode = 'card',
}: LoadingStateProps) {
  const gradientId = useId();
  const isCompact = mode === 'compact';

  return (
    <div
      className={isCompact ? styles.compactWrapper : styles.cardWrapper}
      role="status"
      aria-live="polite"
    >
      <div
        className={`${styles.ringBox} ${
          isCompact ? styles.ringCompact : styles.ringLarge
        }`}
        aria-hidden="true"
      >
        <svg className={styles.ringSvg} viewBox="0 0 80 80">
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--color-button)" />
              <stop offset="100%" stopColor="var(--color-accent)" />
            </linearGradient>
          </defs>
          <circle className={styles.ringTrack} cx="40" cy="40" r={32} />
          <circle
            className={styles.ringProgress}
            cx="40"
            cy="40"
            r={32}
            stroke={`url(#${gradientId})`}
            strokeDasharray="145 202"
          />
        </svg>
      </div>

      <div className={styles.textGroup}>
        <p className={styles.title}>{label}</p>
        {detail ? <p className={styles.detail}>{detail}</p> : null}
      </div>
    </div>
  );
}
