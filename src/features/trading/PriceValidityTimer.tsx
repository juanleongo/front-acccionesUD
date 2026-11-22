'use client';

import { useEffect, useRef, useState } from 'react';
import { useLocale } from '@/lib/i18n';
import styles from './trading.module.css';

export function PriceValidityTimer({
  expiresAtMs,
  ttlSeconds,
  onRefresh,
  onExpire,
}: {
  expiresAtMs: number;
  ttlSeconds: number;
  onRefresh: () => void;
  onExpire?: () => void;
}) {
  const { tx } = useLocale();
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  const [remainingMs, setRemainingMs] = useState(() =>
    Math.max(0, expiresAtMs - Date.now()),
  );

  useEffect(() => {
    const interval = window.setInterval(() => {
      const next = Math.max(0, expiresAtMs - Date.now());
      setRemainingMs(next);
      if (next === 0) {
        window.clearInterval(interval);
        onExpireRef.current?.();
      }
    }, 200);
    return () => window.clearInterval(interval);
  }, [expiresAtMs]);

  const remainingSeconds = Math.ceil(remainingMs / 1000);
  const progressPct = Math.min(
    100,
    Math.max(0, (remainingMs / (ttlSeconds * 1000)) * 100),
  );
  const expired = remainingMs <= 0;
  const warning = !expired && remainingSeconds <= 4;

  return (
    <div className={styles.timerBox} role="status" aria-live="polite">
      <div className={styles.timerHeader}>
        <span className={styles.tabularNum}>
          {expired
            ? tx('Cotización de preview expirada', 'Preview quote expired')
            : tx(
                `Vigencia del preview de precio: ${remainingSeconds}s`,
                `Quote preview valid for: ${remainingSeconds}s`,
              )}
        </span>
        <button type="button" onClick={onRefresh} className={styles.btnCompact}>
          {tx('Refrescar cotización', 'Refresh quote')}
        </button>
      </div>
      <div className={styles.timerTrack} aria-hidden="true">
        <div
          className={`${styles.timerFill} ${warning ? styles.timerFillWarning : ''} ${expired ? styles.timerFillExpired : ''}`}
          style={{ width: `${progressPct}%` }}
        />
      </div>
    </div>
  );
}
