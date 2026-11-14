'use client';

import { useState } from 'react';
import { FX_RATES, convertToUsd, type CurrencyCode } from './wallet-mock';
import styles from './wallet.module.css';

export function CurrencyConverterWidget() {
  const [sourceCurrency, setSourceCurrency] =
    useState<Exclude<CurrencyCode, 'USD'>>('COP');
  const [amountText, setAmountText] = useState('4320000');

  const numericAmount = Math.max(0, parseFloat(amountText) || 0);
  const convertedUsd = convertToUsd(numericAmount, sourceCurrency);

  return (
    <section
      className={styles.card}
      aria-labelledby="currency-converter-heading"
    >
      <div className={styles.cardHeader}>
        <div>
          <h2 id="currency-converter-heading" className={styles.cardTitle}>
            Conversor Multi-Moneda → USD
          </h2>
          <p className={styles.cardSubtitle}>
            Calcula tu depósito en divisa local antes de acreditar en dólares
            (moneda base).
          </p>
        </div>
      </div>

      <div className={styles.converterGrid}>
        <div className={styles.fieldGroup}>
          <label htmlFor="conv-currency" className={styles.fieldLabel}>
            Divisa de Origen
          </label>
          <select
            id="conv-currency"
            className={styles.select}
            value={sourceCurrency}
            onChange={(e) =>
              setSourceCurrency(e.target.value as Exclude<CurrencyCode, 'USD'>)
            }
          >
            {FX_RATES.map((rate) => (
              <option key={rate.currency} value={rate.currency}>
                {rate.currency} · {rate.name}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.fieldGroup}>
          <label htmlFor="conv-amount" className={styles.fieldLabel}>
            Monto ({sourceCurrency})
          </label>
          <input
            id="conv-amount"
            type="number"
            min="0"
            step="any"
            className={styles.input}
            value={amountText}
            onChange={(e) => setAmountText(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.conversionResult}>
        <span style={{ fontSize: '0.84rem', color: 'var(--color-text-muted)' }}>
          Equivalente neto en USD:
        </span>
        <strong style={{ fontSize: '1.25rem', color: '#10b981' }}>
          $
          {convertedUsd.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}{' '}
          USD
        </strong>
      </div>

      <div className={styles.ratesList}>
        {FX_RATES.map((rate) => (
          <div key={rate.pair} className={styles.rateRow}>
            <span>
              <strong>{rate.pair}</strong> · {rate.name}
            </span>
            <span>
              1 USD ={' '}
              <strong>
                {rate.unitsPerUsd.toLocaleString('en-US', {
                  minimumFractionDigits: rate.currency === 'COP' ? 0 : 2,
                })}{' '}
                {rate.currency}
              </strong>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
