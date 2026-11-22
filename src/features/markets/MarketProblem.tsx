'use client';

import Link from 'next/link';
import { ApiError } from '@/lib/api';
import { useLocale } from '@/lib/i18n';
import styles from './markets.module.css';

export function Problem({ error, retry }: { error: Error; retry: () => void }) {
  const { tx } = useLocale();
  const status = error instanceof ApiError && error.metadata.status;
  if (status === 401)
    return (
      <p className={styles.alertBox} role="alert">
        <Link href="/login">{tx('Inicia sesión', 'Sign in')}</Link>{' '}
        {tx('para consultar los mercados.', 'to inspect market data.')}
      </p>
    );
  if (status === 403)
    return (
      <p className={styles.alertBox} role="alert">
        {tx(
          'Tu cuenta no tiene permiso para consultar mercados.',
          'Your account does not have permission to view markets.',
        )}
      </p>
    );
  return (
    <div className={styles.alertBox} role="alert">
      <p>
        {error instanceof ApiError && error.metadata.timeout
          ? tx(
              'La consulta tardó demasiado. Comprueba tu conexión y vuelve a intentarlo.',
              'The request took too long. Check your connection and try again.',
            )
          : status === 404
            ? tx(
                'No se encontró el mercado solicitado.',
                'Requested market was not found.',
              )
            : status === 422
              ? tx(
                  'Revisa las fechas de la consulta.',
                  'Check your selected date range.',
                )
              : tx(
                  'No se pudieron cargar los datos de mercado.',
                  'Could not load market data.',
                )}
      </p>
      <button type="button" className={styles.retryBtn} onClick={retry}>
        {tx('Reintentar', 'Retry')}
      </button>
    </div>
  );
}
