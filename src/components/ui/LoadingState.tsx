'use client';

import { useEffect, useId, useState } from 'react';
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
  const [percent, setPercent] = useState(18);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setPercent((prev) => {
        if (prev >= 94) return 94;
        if (prev < 55) return Math.min(94, prev + 9);
        if (prev < 80) return Math.min(94, prev + 4);
        return Math.min(94, prev + 2);
      });
    }, 180);
    return () => window.clearInterval(timer);
  }, []);

  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - percent / 100);
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
          <circle className={styles.ringTrack} cx="40" cy="40" r={radius} />
          <circle
            className={styles.ringProgress}
            cx="40"
            cy="40"
            r={radius}
            stroke={`url(#${gradientId})`}
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
          />
        </svg>
        <span
          className={`${styles.percentLabel} ${
            isCompact ? styles.percentCompact : styles.percentLarge
          }`}
        >
          {percent}%
        </span>
      </div>

      <div className={styles.textGroup}>
        <p className={styles.title}>{label}</p>
        {detail ? <p className={styles.detail}>{detail}</p> : null}
      </div>
    </div>
  );
}
