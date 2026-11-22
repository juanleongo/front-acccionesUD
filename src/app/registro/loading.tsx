'use client';

import { LoadingState } from '@/components/ui/LoadingState';
import { useLocale } from '@/lib/i18n';
import styles from '../app-fallback.module.css';

export default function Loading() {
  const { tx } = useLocale();
  return (
    <main className={styles.shell}>
      <div className={styles.loadingWrap}>
        <LoadingState
          label={tx('Abriendo tu registro…', 'Opening your registration…')}
          detail={tx(
            'Preparando el formulario de tu cuenta.',
            'Preparing your account form.',
          )}
        />
      </div>
    </main>
  );
}
