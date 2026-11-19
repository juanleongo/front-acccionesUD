'use client';

import type { FormEvent } from 'react';
import styles from '../trading.module.css';

export type OrderPendingAction = 'cancel' | 'accept' | 'reject' | 'resume';

const ACTION_PROMPTS: Record<OrderPendingAction, string> = {
  cancel: 'la solicitud de cancelación',
  resume: 'la reanudación',
  accept: 'la aceptación del nuevo precio',
  reject: 'el rechazo del nuevo precio',
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
  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    void onConfirm();
  }

  return (
    <form className={styles.orderPreview} onSubmit={handleSubmit}>
      <fieldset disabled={busy} className={styles.orderFields}>
        <p className={styles.previewTitle}>
          ¿Confirmas {ACTION_PROMPTS[action]}?
        </p>
        {action === 'cancel' && (
          <div className={styles.fieldGrid}>
            <label className={styles.fieldGroup}>
              Motivo
              <select
                className={styles.select}
                value={reason}
                onChange={(e) => onReasonChange(e.target.value)}
              >
                <option value="no_longer_needed">Ya no la necesito</option>
                <option value="price_changed">Cambió el precio</option>
                <option value="input_error">Error en los datos</option>
                <option value="other">Otro motivo</option>
              </select>
            </label>
            {reason === 'other' && (
              <label className={styles.fieldGroup}>
                Describe el motivo
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
        <div className={styles.actionsRow}>
          <button type="submit" className={styles.btnPrimary}>
            {busy ? 'Procesando…' : 'Confirmar acción'}
          </button>
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={onCancel}
          >
            Volver
          </button>
        </div>
      </fieldset>
    </form>
  );
}
