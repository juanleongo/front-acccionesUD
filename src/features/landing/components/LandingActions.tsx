'use client';

import { createContext, useContext, useId, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Icon } from '@/components/ui/Icon';
import { useLocale } from '@/lib/i18n';
import styles from '../landing.module.css';

const ActionContext = createContext<(title: string) => void>(() => {});

export function LandingActions({ children }: { children: ReactNode }) {
  const { tx } = useLocale();
  const dialog = useRef<HTMLDialogElement>(null);
  const [title, setTitle] = useState('');
  const titleId = useId();
  const descriptionId = useId();

  function showUpcoming(nextTitle: string) {
    setTitle(nextTitle);
    dialog.current?.showModal();
  }

  return (
    <ActionContext.Provider value={showUpcoming}>
      {children}
      <dialog
        ref={dialog}
        className={styles.dialog}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onClick={(event) => {
          if (event.target === dialog.current) {
            dialog.current.close();
          }
        }}
      >
        <div className={styles.dialogTop}>
          <span className={styles.eyebrow}>
            {tx('Próximamente', 'Coming soon')}
          </span>
          <button
            type="button"
            className={styles.iconButton}
            onClick={() => dialog.current?.close()}
            aria-label={tx('Cerrar', 'Close')}
          >
            <Icon name="close" />
          </button>
        </div>
        <h2 id={titleId} className={styles.dialogTitle}>
          {title}
        </h2>
        <p id={descriptionId} className={styles.dialogBody}>
          {tx(
            'Esta función estará disponible en el siguiente sprint. Por ahora puedes crear tu cuenta, iniciar sesión y explorar las bolsas de Estados Unidos en tiempo real.',
            'This feature will be available in the next sprint. For now, you can create your account, sign in, and explore U.S. stock exchanges in real time.',
          )}
        </p>
        <form method="dialog" className={styles.dialogActions}>
          <button type="submit" className={styles.primaryButton}>
            {tx('Entendido', 'Got it')}
          </button>
        </form>
      </dialog>
    </ActionContext.Provider>
  );
}

export function UpcomingButton({
  children,
  feature,
  className,
}: {
  children: ReactNode;
  feature: string;
  className?: string | undefined;
}) {
  const showUpcoming = useContext(ActionContext);
  return (
    <button
      type="button"
      className={className}
      onClick={(event) => {
        event.currentTarget.focus();
        showUpcoming(feature);
      }}
    >
      {children}
    </button>
  );
}
