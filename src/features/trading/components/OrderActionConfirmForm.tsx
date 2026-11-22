'use client';

import { useState, type FormEvent } from 'react';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { useLocale } from '@/lib/i18n';
import styles from '../trading.module.css';

export type OrderPendingAction = 'cancel' | 'accept' | 'reject' | 'resume';

const ACTION_PROMPTS: Record<OrderPendingAction, { es: string; en: string }> = {
  cancel: {
    es: 'la solicitud de cancelación',
    en: 'the cancellation request',
  },
  resume: { es: 'la reanudación', en: 'resuming this order' },
  accept: {
    es: 'la aceptación del nuevo precio',
    en: 'accepting the updated price',
  },
  reject: {
    es: 'el rechazo del nuevo precio',
    en: 'rejecting the updated price',
  },
};

export function OrderActionConfirmForm({
  action,
  busy,
  reason,
  reasonText,
  onReasonChange,
  onReasonTextChange,
  onConfirm,
  onCancel,
}: {
  action: OrderPendingAction;
  busy: boolean;
  reason: string;
  reasonText: string;
  onReasonChange: (value: string) => void;
  onReasonTextChange: (value: string) => void;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}) {
  const { tx } = useLocale();
  const [localError, setLocalError] = useState('');

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (action === 'cancel' && reason === 'other' && !reasonText.trim()) {
      setLocalError(
        tx(
          'Describe el motivo de la cancelación antes de confirmar.',
          'Describe the cancellation reason before confirming.',
        ),
      );
      return;
    }
    setLocalError('');
    void onConfirm();
  }

  return (
    <form className={styles.orderPreview} onSubmit={handleSubmit} noValidate>
      <fieldset disabled={busy} className={styles.orderFields}>
        <p className={styles.previewTitle}>
          {tx(
            `¿Confirmas ${ACTION_PROMPTS[action].es}?`,
            `Confirm ${ACTION_PROMPTS[action].en}?`,
          )}
        </p>
        {action === 'cancel' && (
          <div className={styles.fieldGrid}>
            <div className={styles.fieldGroup}>
              <label
                htmlFor="order-cancel-reason"
                className={styles.fieldLabel}
              >
                {tx('Motivo', 'Reason')}
              </label>
              <CustomSelect
                id="order-cancel-reason"
                value={reason}
                onChange={onReasonChange}
                options={[
                  {
                    value: 'no_longer_needed',
                    label: tx('Ya no la necesito', 'No longer needed'),
                  },
                  {
                    value: 'price_changed',
                    label: tx('Cambió el precio', 'Price changed'),
                  },
                  {
                    value: 'input_error',
                    label: tx('Error en los datos', 'Input error'),
                  },
                  {
                    value: 'other',
                    label: tx('Otro motivo', 'Other reason'),
                  },
                ]}
              />
            </div>
            {reason === 'other' && (
              <label className={styles.fieldGroup}>
                <span className={styles.fieldLabel}>
                  {tx('Describe el motivo', 'Describe the reason')}
                </span>
                <input
                  className={styles.input}
                  required
                  maxLength={500}
                  value={reasonText}
                  onChange={(e) => onReasonTextChange(e.target.value)}
                />
              </label>
            )}
          </div>
        )}
        {localError && (
          <p role="alert" className={styles.alertError}>
            {localError}
          </p>
        )}
        <div className={styles.actionsRow}>
          <button type="submit" className={styles.btnPrimary}>
            {busy
              ? tx('Procesando…', 'Processing…')
              : tx('Confirmar acción', 'Confirm action')}
          </button>
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={onCancel}
          >
            {tx('Volver', 'Back')}
          </button>
        </div>
      </fieldset>
    </form>
  );
}
