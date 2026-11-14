'use client';

import { useState, type FormEvent } from 'react';
import styles from './wallet.module.css';

export function WithdrawalModal({
  open,
  availableBalanceUsd,
  reservedBalanceUsd,
  onClose,
  onConfirmWithdrawal,
}: {
  open: boolean;
  availableBalanceUsd: number;
  reservedBalanceUsd: number;
  onClose: () => void;
  onConfirmWithdrawal: (payload: {
    amountUsd: number;
    destination: string;
  }) => void;
}) {
  const [amountText, setAmountText] = useState('1000');
  const [destination, setDestination] = useState(
    'Cuenta Bancolombia ****4821 (ACH / Swift Simulado)',
  );
  const [error, setError] = useState('');

  if (!open) return null;

  const amount = parseFloat(amountText) || 0;
  const exceedsAvailable = amount > availableBalanceUsd;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (amount <= 0) {
      setError('Ingresa un monto mayor a cero.');
      return;
    }
    if (exceedsAvailable) {
      setError(
        `Fondos insuficientes. Tu saldo disponible máximo retirable es $${availableBalanceUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD.`,
      );
      return;
    }
    setError('');
    onConfirmWithdrawal({ amountUsd: amount, destination });
    onClose();
  }

  return (
    <div
      className={styles.modalOverlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="withdraw-modal-title"
    >
      <div className={styles.modalCard}>
        <h3 id="withdraw-modal-title" className={styles.modalTitle}>
          Retirar Fondos (USD)
        </h3>
        <p className={styles.cardSubtitle}>
          Solo puedes retirar efectivo del <strong>Saldo Disponible</strong>. El
          saldo reservado en órdenes abiertas permanece bloqueado.
        </p>

        <form onSubmit={handleSubmit} style={{ marginTop: '1rem' }}>
          <div className={styles.fieldGroup}>
            <label htmlFor="wd-amount" className={styles.fieldLabel}>
              Monto a retirar (USD)
            </label>
            <input
              id="wd-amount"
              type="number"
              step="0.01"
              min="1"
              className={styles.input}
              value={amountText}
              onChange={(e) => {
                setAmountText(e.target.value);
                setError('');
              }}
            />
          </div>

          <div className={styles.fieldGroup} style={{ marginTop: '0.75rem' }}>
            <label htmlFor="wd-dest" className={styles.fieldLabel}>
              Cuenta Bancaria Destino
            </label>
            <select
              id="wd-dest"
              className={styles.select}
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            >
              <option value="Cuenta Bancolombia ****4821 (ACH / Swift Simulado)">
                Cuenta Bancolombia ****4821 (ACH / Swift Simulado)
              </option>
              <option value="Cuenta Davivienda ****9102 (Transferencia Internacional)">
                Cuenta Davivienda ****9102 (Transferencia Internacional)
              </option>
            </select>
          </div>

          <div className={styles.summaryBox}>
            <div className={styles.summaryRow}>
              <span>Saldo disponible actual:</span>
              <strong style={{ color: '#10b981' }}>
                $
                {availableBalanceUsd.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                })}{' '}
                USD
              </strong>
            </div>
            <div className={styles.summaryRow}>
              <span>Saldo reservado (intocable):</span>
              <strong style={{ color: 'var(--color-warning)' }}>
                $
                {reservedBalanceUsd.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                })}{' '}
                USD
              </strong>
            </div>
            <div className={styles.summaryRow}>
              <span>Nuevo saldo disponible estimado:</span>
              <strong>
                $
                {Math.max(0, availableBalanceUsd - amount).toLocaleString(
                  'en-US',
                  { minimumFractionDigits: 2 },
                )}{' '}
                USD
              </strong>
            </div>
          </div>

          {error && (
            <p className={styles.errorText} role="alert">
              {error}
            </p>
          )}

          <div className={styles.actionsRow}>
            <button
              type="submit"
              className={styles.btnPrimary}
              disabled={exceedsAvailable || amount <= 0}
            >
              Confirmar Retiro
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
