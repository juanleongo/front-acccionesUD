'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { Icon } from '@/components/ui/Icon';
import { formatUsd } from '@/lib/formatters';
import { useLocale } from '@/lib/i18n';
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
  const { tx } = useLocale();
  const [amountText, setAmountText] = useState('1000');
  const [destination, setDestination] = useState(
    'Cuenta Bancolombia ****4821 (ACH / Swift Simulado)',
  );
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return undefined;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const amount = parseFloat(amountText) || 0;
  const exceedsAvailable = amount > availableBalanceUsd;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!Number.isFinite(amount) || amount <= 0) {
      setError(
        tx(
          'Ingresa un monto mayor a cero.',
          'Enter an amount greater than zero.',
        ),
      );
      return;
    }
    if (exceedsAvailable) {
      setError(
        tx(
          `Fondos insuficientes. Tu saldo disponible máximo retirable es ${formatUsd(availableBalanceUsd, { withCode: true })}.`,
          `Insufficient funds. Your maximum withdrawable balance is ${formatUsd(availableBalanceUsd, { withCode: true })}.`,
        ),
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
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className={styles.modalCard}>
        <div className={styles.modalHeader}>
          <div>
            <h3 id="withdraw-modal-title" className={styles.modalTitle}>
              {tx('Retirar Fondos (USD)', 'Withdraw Funds (USD)')}
            </h3>
            <p className={styles.cardSubtitle}>
              {tx(
                'Solo puedes retirar efectivo del',
                'You can only withdraw from your',
              )}{' '}
              <strong>{tx('Saldo Disponible', 'Available Balance')}</strong>.{' '}
              {tx(
                'El saldo reservado en órdenes abiertas permanece bloqueado.',
                'Balances reserved for open orders remain locked.',
              )}
            </p>
          </div>
          <button
            type="button"
            className={styles.modalCloseBtn}
            onClick={onClose}
            aria-label={tx('Cerrar modal', 'Close modal')}
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalForm} noValidate>
          <div className={styles.fieldGroup}>
            <label htmlFor="wd-amount" className={styles.fieldLabel}>
              {tx('Monto a retirar (USD)', 'Amount to withdraw (USD)')}
            </label>
            <input
              id="wd-amount"
              type="number"
              step="0.01"
              min="1"
              className={`${styles.input} ${styles.tabularNum}`}
              value={amountText}
              onChange={(e) => {
                setAmountText(e.target.value);
                setError('');
              }}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="wd-dest" className={styles.fieldLabel}>
              {tx('Cuenta Bancaria Destino', 'Destination Bank Account')}
            </label>
            <CustomSelect
              id="wd-dest"
              value={destination}
              onChange={setDestination}
              options={[
                {
                  value: 'Cuenta Bancolombia ****4821 (ACH / Swift Simulado)',
                  label: tx(
                    'Cuenta Bancolombia ****4821 (ACH / Swift Simulado)',
                    'Bancolombia Account ****4821 (Simulated ACH / SWIFT)',
                  ),
                },
                {
                  value:
                    'Cuenta Davivienda ****9102 (Transferencia Internacional)',
                  label: tx(
                    'Cuenta Davivienda ****9102 (Transferencia Internacional)',
                    'Davivienda Account ****9102 (International Wire)',
                  ),
                },
              ]}
            />
          </div>

          <div className={styles.summaryBox}>
            <div className={styles.summaryRow}>
              <span>
                {tx('Saldo disponible actual:', 'Current available balance:')}
              </span>
              <strong
                className={`${styles.summaryValueSuccess} ${styles.tabularNum}`}
              >
                {formatUsd(availableBalanceUsd, { withCode: true })}
              </strong>
            </div>
            <div className={styles.summaryRow}>
              <span>
                {tx(
                  'Saldo reservado (intocable):',
                  'Reserved balance (locked):',
                )}
              </span>
              <strong
                className={`${styles.summaryValueWarning} ${styles.tabularNum}`}
              >
                {formatUsd(reservedBalanceUsd, { withCode: true })}
              </strong>
            </div>
            <div className={styles.summaryRow}>
              <span>
                {tx(
                  'Nuevo saldo disponible estimado:',
                  'Estimated remaining available balance:',
                )}
              </span>
              <strong className={styles.tabularNum}>
                {formatUsd(Math.max(0, availableBalanceUsd - amount), {
                  withCode: true,
                })}
              </strong>
            </div>
          </div>

          {error && (
            <p className={styles.errorText} role="alert">
              {error}
            </p>
          )}

          <div className={styles.modalFooter}>
            <button type="submit" className={styles.btnPrimary}>
              {tx('Confirmar Retiro', 'Confirm Withdrawal')}
            </button>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={onClose}
            >
              {tx('Cancelar', 'Cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
