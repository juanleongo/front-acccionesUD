'use client';

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
  if (!data) return null;

  return (
    <div
      className={styles.modalOverlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="slippage-modal-title"
    >
      <div className={styles.modalCard}>
        <h3 id="slippage-modal-title" className={styles.modalTitle}>
          ⚠️ Reautorización por Variación de Precio (Slippage)
        </h3>
        <p className={styles.cardSubtitle}>
          El precio de mercado de <strong>{data.symbol}</strong> superó el
          umbral de tolerancia desde que se emitió el preview. Por seguridad,
          debes confirmar la nueva cotización antes de ejecutar la orden (
          {data.quantity} acciones).
        </p>

        <div className={styles.priceCompare}>
          <div className={styles.priceBox}>
            <span>Precio Preview Anterior</span>
            <strong>${data.originalPriceUsd.toFixed(2)} USD</strong>
          </div>
          <div className={styles.priceBox}>
            <span>Nuevo Precio de Mercado</span>
            <strong style={{ color: 'var(--color-warning)' }}>
              ${data.newPriceUsd.toFixed(2)} USD (
              {data.variationPct > 0 ? '+' : ''}
              {data.variationPct.toFixed(2)}%)
            </strong>
          </div>
        </div>

        <div className={styles.previewBox}>
          <div className={styles.summaryRow}>
            <span>Nuevo total estimado (incluye comisiones):</span>
            <strong>${data.newTotalUsd.toFixed(2)} USD</strong>
          </div>
        </div>

        <div className={styles.actionsRow}>
          <button
            type="button"
            className={styles.btnPrimary}
            onClick={onReauthorize}
          >
            Reautorizar y Ejecutar
          </button>
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={onCancel}
          >
            Cancelar Orden
          </button>
        </div>
      </div>
    </div>
  );
}
