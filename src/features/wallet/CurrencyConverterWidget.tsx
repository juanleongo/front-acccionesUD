'use client';

import { useState } from 'react';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { formatDecimalNumber, formatUsd } from '@/lib/formatters';
import { useLocale } from '@/lib/i18n';
import { formatCurrencyName } from './wallet-labels';
import { FX_RATES, convertToUsd, type CurrencyCode } from './wallet-mock';
import styles from './wallet.module.css';

export function CurrencyConverterWidget() {
  const { locale, tx } = useLocale();
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
            {tx(
              'Conversor Multi-Moneda → USD',
              'Multi-Currency Converter → USD',
            )}
          </h2>
          <p className={styles.cardSubtitle}>
            {tx(
              'Calcula tu depósito en divisa local antes de acreditar en dólares (moneda base).',
              'Estimate your local currency deposit before crediting in USD (base currency).',
            )}
          </p>
        </div>
      </div>

      <div className={styles.converterGrid}>
        <div className={styles.fieldGroup}>
          <label htmlFor="conv-currency" className={styles.fieldLabel}>
            {tx('Divisa de Origen', 'Source Currency')}
          </label>
          <CustomSelect
            id="conv-currency"
            value={sourceCurrency}
            onChange={(val) =>
              setSourceCurrency(val as Exclude<CurrencyCode, 'USD'>)
            }
            options={FX_RATES.map((rate) => ({
              value: rate.currency,
              label: `${rate.currency} · ${formatCurrencyName(rate.currency, locale, rate.name)}`,
            }))}
          />
        </div>

        <div className={styles.fieldGroup}>
          <label htmlFor="conv-amount" className={styles.fieldLabel}>
            {tx('Monto', 'Amount')} ({sourceCurrency})
          </label>
          <input
            id="conv-amount"
            type="number"
            min="0"
            step="any"
            className={`${styles.input} ${styles.tabularNum}`}
            value={amountText}
            onChange={(e) => setAmountText(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.conversionResult}>
        <span className={styles.converterLabel}>
          {tx('Equivalente neto en USD:', 'Net USD equivalent:')}
        </span>
        <strong className={styles.converterValue}>
          {formatUsd(convertedUsd, { withCode: true })}
        </strong>
      </div>

      <div className={styles.ratesList}>
        {FX_RATES.map((rate) => (
          <div key={rate.pair} className={styles.rateRow}>
            <span>
              <strong>{rate.pair}</strong> ·{' '}
              {formatCurrencyName(rate.currency, locale, rate.name)}
            </span>
            <span className={styles.tabularNum}>
              1 USD ={' '}
              <strong>
                {formatDecimalNumber(
                  rate.unitsPerUsd,
                  locale,
                  rate.currency === 'COP' ? 0 : 2,
                )}{' '}
                {rate.currency}
              </strong>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
