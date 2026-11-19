'use client';

import Link from 'next/link';
import { Icon } from './Icon';
import styles from './session-closed.module.css';

export interface SessionClosedOverlayProps {
  onBeforeNavigate?: () => void;
}

/** Modal oscuro a pantalla completa cuando la sesión del usuario expiró o se cerró. */
export function SessionClosedOverlay({
  onBeforeNavigate,
}: SessionClosedOverlayProps) {
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
          Sesión finalizada
        </div>

        <div className={styles.iconRing} aria-hidden="true">
          <Icon name="shield" size={28} />
        </div>

        <h2 id="session-closed-title" className={styles.title}>
          ¿Te faltó una acción? Tu sesión se cerró
        </h2>

        <p id="session-closed-desc" className={styles.message}>
          ¿Se te quedó pendiente una orden, un depósito o revisar algún
          movimiento? Cerramos tu sesión por seguridad o inactividad. ¿Quieres
          iniciar sesión de nuevo?
        </p>

        <div className={styles.actions}>
          <Link
            href="/login"
            className={styles.primaryAction}
            onClick={() => onBeforeNavigate?.()}
          >
            Iniciar sesión de nuevo →
          </Link>
          <Link
            href="/"
            className={styles.secondaryAction}
            onClick={() => onBeforeNavigate?.()}
          >
            Volver a la portada
          </Link>
        </div>
      </section>
    </div>
  );
}
