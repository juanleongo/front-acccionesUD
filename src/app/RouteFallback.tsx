'use client';

import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { LoadingState } from '@/components/ui/LoadingState';
import { useLocale } from '@/lib/i18n';
import styles from './app-fallback.module.css';

export type RouteFallbackProps =
  | { kind: 'loading' }
  | { kind: 'not-found' }
  | { kind: 'error'; onRetry: () => void };

export function RouteFallback(props: RouteFallbackProps) {
  const { tx } = useLocale();

  if (props.kind === 'loading') {
    return (
      <main className={styles.shell}>
        <div className={styles.loadingWrap}>
          <LoadingState
            label={tx('Cargando Acciones UD…', 'Loading Acciones UD…')}
            detail={tx(
              'Preparando tu vista del mercado estadounidense.',
              'Preparing your U.S. market workspace.',
            )}
          />
        </div>
      </main>
    );
  }

  const isError = props.kind === 'error';

  return (
    <main className={styles.shell}>
      <section
        className={styles.card}
        role={isError ? 'alert' : undefined}
        aria-labelledby="route-fallback-title"
      >
        <div className={styles.badgeRow}>
          <span
            className={`${styles.iconCircle} ${
              isError ? styles.iconCircleError : ''
            }`}
          >
            <Icon name={isError ? 'shield' : 'globe'} size={22} />
          </span>
          <span className={styles.kicker}>
            {isError
              ? tx('Interrupción temporal', 'Temporary interruption')
              : tx('Ruta no encontrada · 404', 'Route not found · 404')}
          </span>
        </div>

        <h1 id="route-fallback-title" className={styles.title}>
          {isError
            ? tx(
                'No pudimos mostrar esta sección',
                'We could not render this view',
              )
            : tx(
                'Esta página no existe en Acciones UD',
                'This page does not exist on Acciones UD',
              )}
        </h1>

        <p className={styles.description}>
          {isError
            ? tx(
                'Ocurrió un inconveniente inesperado al cargar la vista. Puedes reintentar sin perder tu sesión o regresar al inicio.',
                'An unexpected issue occurred while loading this view. You can retry without losing your session or return home.',
              )
            : tx(
                'Verifica la dirección ingresada o vuelve a la portada y mercados en tiempo real de Estados Unidos.',
                'Verify the URL you entered or return to the home page and live U.S. markets.',
              )}
        </p>

        <div className={styles.actions}>
          {isError && (
            <button
              type="button"
              className={styles.primaryBtn}
              onClick={props.onRetry}
            >
              {tx('Reintentar carga', 'Try again')}
            </button>
          )}
          <Link
            href="/"
            className={isError ? styles.secondaryLink : styles.primaryBtn}
          >
            {tx('Volver al inicio', 'Back to home')}
          </Link>
          <Link href="/markets" className={styles.secondaryLink}>
            {tx('Explorar mercados', 'Explore markets')}
          </Link>
        </div>
      </section>
    </main>
  );
}
