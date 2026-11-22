'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { Icon } from '@/components/ui/Icon';
import { formatDecimalNumber, formatUsd } from '@/lib/formatters';
import { useLocale } from '@/lib/i18n';
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
  const { locale, tx } = useLocale();
  const [currency, setCurrency] = useState<CurrencyCode>('COP');
  const [amountText, setAmountText] = useState('4320000');
  const [method, setMethod] = useState('PSE / Transferencia Bancaria Simulada');
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
  const grossUsd = convertToUsd(amount, currency);
  const fxFeeUsd =
    currency === 'USD' ? 0 : Number((grossUsd * 0.005).toFixed(2));
  const netUsd = Math.max(0, Number((grossUsd - fxFeeUsd).toFixed(2)));
  const activeRate = FX_RATES.find((r) => r.currency === currency);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!Number.isFinite(amount) || amount < 1) {
      setError(
        tx(
          'Ingresa un monto válido de al menos 1.',
          'Enter a valid amount of at least 1.',
        ),
      );
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
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className={styles.modalCard}>
        <div className={styles.modalHeader}>
          <div>
            <h3 id="deposit-modal-title" className={styles.modalTitle}>
              {tx(
                'Depositar Fondos Multi-Moneda',
                'Deposit Multi-Currency Funds',
              )}
            </h3>
            <p className={styles.cardSubtitle}>
              {tx(
                'Tu depósito en divisa local se convierte automáticamente a USD como moneda base de negociación en Wall Street.',
                'Your local-currency deposit is automatically converted to USD as the Wall Street trading base currency.',
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
          <div className={styles.converterGrid}>
            <div className={styles.fieldGroup}>
              <label htmlFor="dep-currency" className={styles.fieldLabel}>
                {tx('Divisa', 'Currency')}
              </label>
              <CustomSelect
                id="dep-currency"
                value={currency}
                onChange={(nextVal) => {
                  const next = nextVal as CurrencyCode;
                  setCurrency(next);
                  setAmountText(next === 'COP' ? '4320000' : '1000');
                  setError('');
                }}
                options={[
                  {
                    value: 'COP',
                    label: tx('COP · Peso Colombiano', 'COP · Colombian Peso'),
                  },
                  { value: 'EUR', label: 'EUR · Euro' },
                  {
                    value: 'GBP',
                    label: tx('GBP · Libra Esterlina', 'GBP · British Pound'),
                  },
                  {
                    value: 'USD',
                    label: tx('USD · Dólar Estadounidense', 'USD · US Dollar'),
                  },
                ]}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="dep-amount" className={styles.fieldLabel}>
                {tx('Monto', 'Amount')} ({currency})
              </label>
              <input
                id="dep-amount"
                type="number"
                step="any"
                min="1"
                className={`${styles.input} ${styles.tabularNum}`}
                value={amountText}
                onChange={(e) => {
                  setAmountText(e.target.value);
                  setError('');
                }}
              />
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="dep-method" className={styles.fieldLabel}>
              {tx(
                'Pasarela / Método (Simulado / Stripe Sandbox)',
                'Gateway / Method (Simulated / Stripe Sandbox)',
              )}
            </label>
            <CustomSelect
              id="dep-method"
              value={method}
              onChange={setMethod}
              options={[
                {
                  value: 'PSE / Transferencia Bancaria Simulada',
                  label: tx(
                    'PSE / Transferencia Bancaria Simulada',
                    'PSE / Simulated Bank Transfer',
                  ),
                },
                {
                  value: 'Stripe Sandbox · Tarjeta Crédito/Débito',
                  label: tx(
                    'Stripe Sandbox · Tarjeta Crédito/Débito',
                    'Stripe Sandbox · Credit / Debit Card',
                  ),
                },
                {
                  value: 'Acreditación Académica UD',
                  label: tx('Acreditación Académica UD', 'UD Academic Credit'),
                },
              ]}
            />
          </div>

          <div className={styles.summaryBox}>
            <div className={styles.summaryRow}>
              <span>{tx('Tasa de cambio aplicada:', 'Applied FX rate:')}</span>
              <strong className={styles.tabularNum}>
                {currency === 'USD'
                  ? '1.00 USD = 1.00 USD'
                  : `1 USD = ${activeRate ? formatDecimalNumber(activeRate.unitsPerUsd, locale, 2) : '—'} ${currency}`}
              </strong>
            </div>
            <div className={styles.summaryRow}>
              <span>
                {tx(
                  'Comisión conversión FX (0.5%):',
                  'FX conversion fee (0.5%):',
                )}
              </span>
              <strong className={styles.tabularNum}>
                -{formatUsd(fxFeeUsd, { withCode: true })}
              </strong>
            </div>
            <div className={styles.summaryRow}>
              <span>
                {tx(
                  'Total neto a acreditar en billetera:',
                  'Net total credited to wallet:',
                )}
              </span>
              <strong
                className={`${styles.summaryValueSuccess} ${styles.tabularNum}`}
              >
                +{formatUsd(netUsd, { withCode: true })}
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
              {tx('Confirmar Depósito', 'Confirm Deposit')}
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
