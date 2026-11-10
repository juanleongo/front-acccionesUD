'use client';

import { createContext, useContext, useId, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Icon } from '@/components/ui/Icon';
import styles from '../landing.module.css';

const ActionContext = createContext<(title: string) => void>(() => {});

export function LandingActions({ children }: { children: ReactNode }) {
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
      >
        <div className={styles.dialogTop}>
          <span className={styles.eyebrow}>Próximamente</span>
          <button
            type="button"
            className={styles.iconButton}
            onClick={() => dialog.current?.close()}
            aria-label="Cerrar"
          >
            <Icon name="close" />
          </button>
        </div>
        <h2 id={titleId}>{title}</h2>
        <p id={descriptionId}>
          Esta función estará disponible en una próxima etapa. Por ahora puedes
          explorar los mercados de demostración y conocer Acciones UD.
        </p>
        <form method="dialog">
          <button className={styles.primaryButton}>Entendido</button>
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
        // Safari no enfoca los botones al hacer clic; conservar un retorno de foco fiable.
        event.currentTarget.focus();
        showUpcoming(feature);
      }}
    >
      {children}
    </button>
  );
}
