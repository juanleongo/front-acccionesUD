'use client';

import { formatMarketDateTime, formatUsd } from '@/lib/formatters';
import { useLocale } from '@/lib/i18n';
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
  const { locale, tx } = useLocale();
  return (
    <div
      className={styles.previewBox}
      aria-label={tx('Vista previa de la orden', 'Order preview')}
    >
      <div className={styles.previewHeader}>
        <h3 className={styles.previewTitle}>
          {tx('Resumen previo de la orden', 'Order preview summary')}
        </h3>
        <span
          className={
            preview.market_open
              ? styles.marketBadgeOpen
              : styles.marketBadgeClosed
          }
        >
          <span className={styles.dotPulse} aria-hidden="true" />
          {preview.market_open
            ? tx('Mercado abierto', 'Market open')
            : tx('Mercado cerrado', 'Market closed')}
        </span>
      </div>

      <div className={styles.summaryRow}>
        <span>{tx('Precio de referencia', 'Reference price')}</span>
        <strong className={styles.tabularNum}>
          {formatUsd(preview.reference_price, {
            withCode: true,
            minimumFractionDigits: 2,
            maximumFractionDigits: 4,
          })}
        </strong>
      </div>
      <div className={styles.summaryRow}>
        <span>{tx('Importe estimado', 'Estimated amount')}</span>
        <strong className={styles.tabularNum}>
          {formatUsd(preview.estimated_amount, { withCode: true })}
        </strong>
      </div>
      <div className={styles.summaryRow}>
        <span>
          {tx('Comisión de referencia estimada', 'Estimated reference fee')}
        </span>
        <strong className={styles.tabularNum}>
          {formatUsd(preview.reference_commission, { withCode: true })}
        </strong>
      </div>
      <div className={`${styles.summaryRow} ${styles.summaryTotal}`}>
        <span>
          {tx('Poder de compra disponible', 'Available buying power')}
        </span>
        <strong className={styles.tabularNum}>
          {formatUsd(preview.available_buying_power, { withCode: true })}
        </strong>
      </div>

      {preview.scheduled_for && (
        <div className={styles.summaryRow}>
          <span>{tx('Programada para', 'Scheduled for')}</span>
          <strong className={styles.tabularNum}>
            {formatMarketDateTime(preview.scheduled_for, locale)}
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
          {tx(
            'Autorizo expresamente esta operación de monto elevado',
            'I explicitly authorize this high-amount transaction',
          )}
        </label>
      )}

      {preview.authorization_method === 'totp' && (
        <label className={styles.fieldGroup}>
          <span className={styles.fieldLabel}>
            {tx('Código MFA', 'MFA Code')}
          </span>
          <input
            className={`${styles.input} ${styles.tabularNum}`}
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
        {tx(
          'Confirma los datos antes de enviar la orden.',
          'Review all details before submitting your order.',
        )}
      </p>
    </div>
  );
}
