'use client';

import type { Preview } from '../trading-api';
import styles from '../trading.module.css';

export function OrderPreviewCard({
  preview,
  ack,
  totp,
  onAckChange,
  onTotpChange,
}: {
  preview: Preview;
  ack: boolean;
  totp: string;
  onAckChange: (checked: boolean) => void;
  onTotpChange: (value: string) => void;
}) {
  return (
    <div className={styles.previewBox} aria-label="Vista previa de la orden">
      <div className={styles.previewHeader}>
        <h3 className={styles.previewTitle}>Resumen previo de la orden</h3>
        <span
          className={
            preview.market_open
              ? styles.marketBadgeOpen
              : styles.marketBadgeClosed
          }
        >
          <span className={styles.dotPulse} aria-hidden="true" />
          {preview.market_open ? 'Mercado abierto' : 'Mercado cerrado'}
        </span>
      </div>

      <div className={styles.summaryRow}>
        <span>Precio de referencia</span>
        <strong>${preview.reference_price} USD</strong>
      </div>
      <div className={styles.summaryRow}>
        <span>Importe estimado</span>
        <strong>${preview.estimated_amount} USD</strong>
      </div>
      <div className={styles.summaryRow}>
        <span>Comisión de referencia estimada</span>
        <strong>${preview.reference_commission} USD</strong>
      </div>
      <div className={`${styles.summaryRow} ${styles.summaryTotal}`}>
        <span>Poder de compra disponible</span>
        <strong>${preview.available_buying_power} USD</strong>
      </div>

      {preview.scheduled_for && (
        <div className={styles.summaryRow}>
          <span>Programada para</span>
          <strong>
            {new Date(preview.scheduled_for).toLocaleString('es-CO')}
          </strong>
        </div>
      )}

      {preview.authorization_method === 'acknowledgement' && (
        <label className={styles.checkRow}>
          <input
            type="checkbox"
            required
            checked={ack}
            onChange={(e) => onAckChange(e.target.checked)}
          />
          Autorizo expresamente esta operación de monto elevado
        </label>
      )}

      {preview.authorization_method === 'totp' && (
        <label className={styles.fieldGroup}>
          Código MFA
          <input
            className={styles.input}
            required
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            placeholder="000000"
            autoComplete="one-time-code"
            value={totp}
            onChange={(e) => onTotpChange(e.target.value)}
          />
        </label>
      )}

      <p className={styles.previewNote}>
        Confirma los datos antes de enviar la orden.
      </p>
    </div>
  );
}
