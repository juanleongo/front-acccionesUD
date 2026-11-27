'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';
import { Icon, type IconName } from '@/components/ui/Icon';
import { LoadingState } from '@/components/ui/LoadingState';
import { useLocale } from '@/lib/i18n';
import type { Tone, ViewState } from './types';
import styles from './workspace.module.css';

export function Panel({
  title,
  hint,
  action,
  children,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className={styles.panel}>
      <header className={styles.panelHeader}>
        <div>
          <h2>{title}</h2>
          {hint && <p>{hint}</p>}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}
export function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: Tone;
}) {
  return (
    <span className={styles.badge} data-tone={tone}>
      {children}
    </span>
  );
}
export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className={styles.field}>
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}
export function Metric({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint: string;
}) {
  return (
    <div className={styles.metric}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{hint}</small>
    </div>
  );
}
export function Amount({
  value,
  currency = 'USD',
}: {
  value: string | null;
  currency?: string;
}) {
  const { intl, tx } = useLocale();
  // Formatting only: totals and monetary calculations always come from the server.
  return (
    <span className={styles.number}>
      {value === null
        ? tx('No disponible', 'Unavailable')
        : new Intl.NumberFormat(intl, { style: 'currency', currency }).format(
            Number(value),
          )}
      {value !== null && <small> {currency}</small>}
    </span>
  );
}
export function Timestamp({ value }: { value: string }) {
  const { intl } = useLocale();
  return (
    <time dateTime={value}>
      {new Intl.DateTimeFormat(intl, {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'America/Bogota',
      }).format(new Date(value))}
    </time>
  );
}
export function EmptyState({
  title,
  detail,
  icon = 'grid',
  children,
}: {
  title: string;
  detail: string;
  icon?: IconName;
  children?: ReactNode;
}) {
  return (
    <div className={styles.empty}>
      <span className={styles.iconTile}>
        <Icon name={icon} size={26} />
      </span>
      <h3>{title}</h3>
      <p>{detail}</p>
      {children}
    </div>
  );
}
export function ViewBoundary({
  state,
  onRetry,
  children,
}: {
  state: ViewState;
  onRetry: () => void;
  children: ReactNode;
}) {
  const { tx } = useLocale();
  if (state === 'loading')
    return (
      <LoadingState
        label={tx('Consultando tu información…', 'Loading your information…')}
        detail={tx(
          'Mostraremos los datos cuando finalice la consulta.',
          'Data will appear when the request completes.',
        )}
      />
    );
  if (state === 'error')
    return (
      <div role="alert">
        <EmptyState
          title={tx(
            'No pudimos cargar esta sección',
            'This section could not be loaded',
          )}
          detail={tx(
            'Vuelve a intentarlo. No se han reemplazado tus datos por información de ejemplo.',
            'Try again. Your data has not been replaced with sample information.',
          )}
          icon="info"
        >
          <button type="button" className={styles.button} onClick={onRetry}>
            {tx('Reintentar', 'Retry')}
          </button>
        </EmptyState>
      </div>
    );
  if (state === 'restricted')
    return (
      <EmptyState
        title={tx(
          'Esta función requiere acceso habilitado',
          'This feature requires access',
        )}
        detail={tx(
          'Comprueba tu plan y los permisos de tu cuenta para continuar.',
          'Check your plan and account permissions to continue.',
        )}
        icon="lock"
      />
    );
  return children;
}
export function WorkspaceDialog({
  title,
  hint,
  onClose,
  children,
}: {
  title: string;
  hint: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  const { tx } = useLocale();
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => {
      dialog?.close();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      aria-labelledby={id}
      aria-describedby={`${id}-hint`}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <header className={styles.panelHeader}>
        <div>
          <span className={styles.eyebrow}>
            {tx('Revisa los detalles', 'Review the details')}
          </span>
          <h2 id={id}>{title}</h2>
        </div>
        <button
          type="button"
          className={styles.iconButton}
          onClick={onClose}
          aria-label={tx('Cerrar', 'Close')}
        >
          <Icon name="close" />
        </button>
      </header>
      <p id={`${id}-hint`} className={styles.muted}>
        {hint}
      </p>
      {children}
    </dialog>
  );
}
