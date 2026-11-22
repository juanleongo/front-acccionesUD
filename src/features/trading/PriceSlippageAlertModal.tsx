'use client';

import { useEffect } from 'react';
import { Icon } from '@/components/ui/Icon';
import { formatPercent, formatUsd } from '@/lib/formatters';
import { useLocale } from '@/lib/i18n';
import styles from './trading.module.css';

export interface SlippageAlertData {
  orderId?: string;
  symbol: string;
  quantity: number;
  originalPriceUsd: number;
  newPriceUsd: number;
  variationPct: number;
  newTotalUsd: number;
}

export function PriceSlippageAlertModal({
  data,
  onReauthorize,
  onCancel,
}: {
  data: SlippageAlertData | null;
  onReauthorize: () => void;
  onCancel: () => void;
}) {
  const { locale, tx } = useLocale();

  useEffect(() => {
    if (!data) return undefined;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onCancel();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [data, onCancel]);

  if (!data) return null;

  return (
    <div
      className={styles.modalOverlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="slippage-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onCancel();
        }
      }}
    >
      <div className={styles.modalCard}>
        <div className={styles.modalHeader}>
          <h3 id="slippage-modal-title" className={styles.modalTitle}>
            <Icon name="shield" size={20} />
            <span>
              {tx(
                'Reautorización por Variación de Precio (Slippage)',
                'Price Slippage Reauthorization Required',
              )}
            </span>
          </h3>
          <button
            type="button"
            className={styles.modalCloseBtn}
            onClick={onCancel}
            aria-label={tx('Cerrar alerta', 'Close alert')}
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        <p className={styles.cardSubtitle}>
          {tx('El precio de mercado de', 'The market price of')}{' '}
          <strong>{data.symbol}</strong>{' '}
          {tx(
            `superó el umbral de tolerancia desde que se emitió el preview. Por seguridad, debes confirmar la nueva cotización antes de ejecutar la orden (${data.quantity} acciones).`,
            `exceeded the tolerance threshold since the preview quote was issued. For your protection, confirm the updated quote before executing (${data.quantity} shares).`,
          )}
        </p>

        <div className={styles.priceCompare}>
          <div className={styles.priceBox}>
            <span>
              {tx('Precio Preview Anterior', 'Previous Preview Price')}
            </span>
            <strong className={styles.tabularNum}>
              {formatUsd(data.originalPriceUsd, { withCode: true })}
            </strong>
          </div>
          <div className={styles.priceBox}>
            <span>{tx('Nuevo Precio de Mercado', 'Updated Market Price')}</span>
            <strong
              className={`${styles.priceWarningText} ${styles.tabularNum}`}
            >
              {formatUsd(data.newPriceUsd, { withCode: true })} (
              {formatPercent(data.variationPct / 100, locale)})
            </strong>
          </div>
        </div>

        <div className={styles.previewBox}>
          <div className={styles.summaryRow}>
            <span>
              {tx(
                'Nuevo total estimado (incluye comisiones):',
                'Updated estimated total (fees included):',
              )}
            </span>
            <strong className={styles.tabularNum}>
              {formatUsd(data.newTotalUsd, { withCode: true })}
            </strong>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button
            type="button"
            className={styles.btnPrimary}
            onClick={onReauthorize}
          >
            {tx('Reautorizar y Ejecutar', 'Reauthorize & Execute')}
          </button>
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={onCancel}
          >
            {tx('Cancelar Orden', 'Cancel Order')}
          </button>
        </div>
      </div>
    </div>
  );
}
