'use client';

import Link from 'next/link';
import { useLocale } from '@/lib/i18n';
import { Icon } from './Icon';
import styles from './session-closed.module.css';

export interface SessionClosedOverlayProps {
  onBeforeNavigate?: () => void;
}

/** Modal oscuro a pantalla completa cuando la sesión del usuario expiró o se cerró. */
export function SessionClosedOverlay({
  onBeforeNavigate,
}: SessionClosedOverlayProps) {
  const { tx } = useLocale();
  return (
    <div className={styles.backdrop} role="presentation">
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="session-closed-title"
        aria-describedby="session-closed-desc"
        className={styles.card}
      >
        <div className={styles.statusPill}>
          <span className={styles.statusDot} aria-hidden="true" />
          {tx('Sesión finalizada', 'Session ended')}
        </div>

        <div className={styles.iconRing} aria-hidden="true">
          <Icon name="shield" size={28} />
        </div>

        <h2 id="session-closed-title" className={styles.title}>
          {tx('Vuelve a iniciar sesión', 'Sign in to continue')}
        </h2>

        <p id="session-closed-desc" className={styles.message}>
          {tx(
            'Tu sesión ya no está activa. Inicia sesión para volver a tu cuenta y continuar.',
            'Your session is no longer active. Sign in to return to your account and continue.',
          )}
        </p>

        <div className={styles.actions}>
          <Link
            href="/login"
            prefetch={false}
            className={styles.primaryAction}
            onClick={() => onBeforeNavigate?.()}
            onNavigate={(event) => {
              // Recovery must work even when the current RSC router is stale.
              event.preventDefault();
              // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- Session recovery must bypass the RSC transport.
              window.location.assign('/login');
            }}
          >
            {tx('Iniciar sesión de nuevo', 'Sign in again')}
          </Link>
          <Link
            href="/"
            prefetch={false}
            className={styles.secondaryAction}
            onClick={() => onBeforeNavigate?.()}
            onNavigate={(event) => {
              event.preventDefault();
              // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- Session recovery must bypass the RSC transport.
              window.location.assign('/');
            }}
          >
            {tx('Volver a la portada', 'Back to home')}
          </Link>
        </div>
      </section>
    </div>
  );
}
