'use client';

import { useLinkStatus } from 'next/link';
import type { ReactNode } from 'react';
import { useLocale } from '@/lib/i18n';
import styles from './link-pending.module.css';

/** Feedback inside a Next Link while its destination is being prepared. */
export function LinkPendingIndicator({ children }: { children?: ReactNode }) {
  const { pending } = useLinkStatus();
  const { tx } = useLocale();
  return (
    <span
      className={styles.slot}
      data-pending={pending}
      role="status"
      aria-live="polite"
    >
      {pending ? (
        <>
          <span className={styles.spinner} aria-hidden="true" />
          <span className={styles.srOnly}>
            {tx('Abriendo formulario…', 'Opening form…')}
          </span>
        </>
      ) : (
        children
      )}
    </span>
  );
}
