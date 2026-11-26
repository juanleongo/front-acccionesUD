'use client';
import { useEffect, useRef, useState } from 'react';
import { useLocale } from '@/lib/i18n';
import styles from '../brokers.module.css';
export interface Confirmation {
  title: string;
  description: string;
  reason?: boolean;
  consent?: boolean;
  action: (reason: string) => Promise<unknown>;
}
export function BrokerConfirmDialog({
  confirmation,
  onClose,
  onConfirm,
  busy,
  error,
}: {
  confirmation: Confirmation;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<boolean>;
  busy: boolean;
  error: string;
}) {
  const { tx } = useLocale();
  const dialog = useRef<HTMLDialogElement>(null);
  const [reason, setReason] = useState('');
  const [consent, setConsent] = useState(false);
  useEffect(() => {
    const node = dialog.current;
    node?.showModal();
    return () => node?.close();
  }, []);
  return (
    <dialog
      ref={dialog}
      className={styles.confirmDialog}
      aria-labelledby="broker-confirm-title"
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onClose();
      }}
    >
      <form
        noValidate
        onSubmit={async (e) => {
          e.preventDefault();
          if (
            (confirmation.reason && !reason.trim()) ||
            (confirmation.consent && !consent)
          )
            return;
          if (await onConfirm(reason.trim())) onClose();
        }}
      >
        <h3 id="broker-confirm-title" className={styles.cardTitle}>
          {confirmation.title}
        </h3>
        <p className={styles.cardDesc}>{confirmation.description}</p>
        {confirmation.reason && (
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="broker-reason">
              {tx('Motivo / evidencia', 'Reason / evidence')}
            </label>
            <textarea
              id="broker-reason"
              className={styles.inputField}
              maxLength={500}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        )}
        {confirmation.consent && (
          <label className={styles.consentLabel}>
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
            />
            {tx(
              'He leído y acepto este consentimiento.',
              'I have read and accept this consent.',
            )}
          </label>
        )}
        {error && (
          <p role="alert" className={styles.formError}>
            {error}
          </p>
        )}
        <div className={styles.btnRow}>
          <button
            type="button"
            disabled={busy}
            className={styles.secondaryBtn}
            onClick={onClose}
          >
            {tx('Cancelar', 'Cancel')}
          </button>
          <button
            className={styles.primaryBtn}
            disabled={
              busy ||
              (confirmation.reason && !reason.trim()) ||
              (confirmation.consent && !consent)
            }
          >
            {busy
              ? tx('Procesando…', 'Processing…')
              : tx('Confirmar', 'Confirm')}
          </button>
        </div>
      </form>
    </dialog>
  );
}
