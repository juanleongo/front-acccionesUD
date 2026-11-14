'use client';

import { useState, type FormEvent } from 'react';
import { FX_RATES, convertToUsd, type CurrencyCode } from './wallet-mock';
import styles from './wallet.module.css';

export function DepositModal({
  open,
  onClose,
  onConfirmDeposit,
}: {
  open: boolean;
  onClose: () => void;
  onConfirmDeposit: (payload: {
    currency: CurrencyCode;
    originalAmount: number;
    amountUsd: number;
    feeUsd: number;
    method: string;
  }) => void;
}) {
  const [currency, setCurrency] = useState<CurrencyCode>('COP');
  const [amountText, setAmountText] = useState('4320000');
  const [method, setMethod] = useState('PSE / Transferencia Bancaria Simulada');
  const [error, setError] = useState('');

  if (!open) return null;

  const amount = parseFloat(amountText) || 0;
  const grossUsd = convertToUsd(amount, currency);
  const fxFeeUsd =
    currency === 'USD' ? 0 : Number((grossUsd * 0.005).toFixed(2));
  const netUsd = Math.max(0, Number((grossUsd - fxFeeUsd).toFixed(2)));

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (amount <= 0) {
      setError('Ingresa un monto mayor a cero.');
      return;
    }
    setError('');
    onConfirmDeposit({
      currency,
      originalAmount: amount,
      amountUsd: netUsd,
      feeUsd: fxFeeUsd,
      method,
    });
    onClose();
  }

  return (
    <div
      className={styles.modalOverlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="deposit-modal-title"
    >
      <div className={styles.modalCard}>
        <h3 id="deposit-modal-title" className={styles.modalTitle}>
          Depositar Fondos Multi-Moneda
        </h3>
        <p className={styles.cardSubtitle}>
          Tu depósito en divisa local se convierte automáticamente a USD como
          moneda base de negociación en Wall Street.
        </p>

        <form onSubmit={handleSubmit} style={{ marginTop: '1rem' }}>
          <div className={styles.converterGrid}>
            <div className={styles.fieldGroup}>
              <label htmlFor="dep-currency" className={styles.fieldLabel}>
                Divisa
              </label>
              <select
                id="dep-currency"
                className={styles.select}
                value={currency}
                onChange={(e) => {
                  const next = e.target.value as CurrencyCode;
                  setCurrency(next);
                  setAmountText(next === 'COP' ? '4320000' : '1000');
                }}
              >
                <option value="COP">COP · Peso Colombiano</option>
                <option value="EUR">EUR · Euro</option>
                <option value="GBP">GBP · Libra Esterlina</option>
                <option value="USD">USD · Dólar Estadounidense</option>
              </select>
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="dep-amount" className={styles.fieldLabel}>
                Monto ({currency})
              </label>
              <input
                id="dep-amount"
                type="number"
                step="any"
                min="1"
                className={styles.input}
                value={amountText}
                onChange={(e) => setAmountText(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.fieldGroup} style={{ marginTop: '0.75rem' }}>
            <label htmlFor="dep-method" className={styles.fieldLabel}>
              Pasarela / Método (Simulado / Stripe Sandbox)
            </label>
            <select
              id="dep-method"
              className={styles.select}
              value={method}
              onChange={(e) => setMethod(e.target.value)}
            >
              <option value="PSE / Transferencia Bancaria Simulada">
                PSE / Transferencia Bancaria Simulada
              </option>
              <option value="Stripe Sandbox · Tarjeta Crédito/Débito">
                Stripe Sandbox · Tarjeta Crédito/Débito
              </option>
              <option value="Acreditación Académica UD">
                Acreditación Académica UD
              </option>
            </select>
          </div>

          <div className={styles.summaryBox}>
            <div className={styles.summaryRow}>
              <span>Tasa de cambio aplicada:</span>
              <strong>
                {currency === 'USD'
                  ? '1.00 USD = 1.00 USD'
                  : `1 USD = ${FX_RATES.find((r) => r.currency === currency)?.unitsPerUsd.toLocaleString('en-US')} ${currency}`}
              </strong>
            </div>
            <div className={styles.summaryRow}>
              <span>Comisión conversión FX (0.5%):</span>
              <strong>-${fxFeeUsd.toFixed(2)} USD</strong>
            </div>
            <div className={styles.summaryRow}>
              <span>Total neto a acreditar en billetera:</span>
              <strong style={{ color: '#10b981', fontSize: '1.05rem' }}>
                +${netUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}{' '}
                USD
              </strong>
            </div>
          </div>

          {error && <p className={styles.errorText}>{error}</p>}

          <div className={styles.actionsRow}>
            <button type="submit" className={styles.btnPrimary}>
              Confirmar Depósito
            </button>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={onClose}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
