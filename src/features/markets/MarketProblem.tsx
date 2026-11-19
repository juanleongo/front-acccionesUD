import Link from 'next/link';
import { ApiError } from '@/lib/api';
import styles from './markets.module.css';

export function Problem({ error, retry }: { error: Error; retry: () => void }) {
  const status = error instanceof ApiError && error.metadata.status;
  if (status === 401)
    return (
      <p className={styles.alertBox} role="alert">
        <Link href="/login">Inicia sesión</Link> para consultar los mercados.
      </p>
    );
  if (status === 403)
    return (
      <p className={styles.alertBox} role="alert">
        Tu cuenta no tiene permiso para consultar mercados.
      </p>
    );
  return (
    <div className={styles.alertBox} role="alert">
      <p>
        {status === 404
          ? 'No se encontró el mercado solicitado.'
          : status === 422
            ? 'Revisa las fechas de la consulta.'
            : 'No se pudieron cargar los datos de mercado.'}
      </p>
      <button type="button" className={styles.retryBtn} onClick={retry}>
        Reintentar
      </button>
    </div>
  );
}
