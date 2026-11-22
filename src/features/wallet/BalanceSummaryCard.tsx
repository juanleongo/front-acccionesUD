'use client';

import { formatUsd } from '@/lib/formatters';
import { useLocale } from '@/lib/i18n';
import type { WalletBalance } from './wallet-mock';
import styles from './wallet.module.css';

export function BalanceSummaryCard({ balance }: { balance: WalletBalance }) {
  const { tx } = useLocale();
  const totalWalletCash =
    balance.available_balance_usd + balance.reserved_balance_usd;
  const totalEquity = totalWalletCash + balance.invested_equity_usd;

  return (
    <section className={styles.card} aria-labelledby="balance-summary-heading">
      <div className={styles.cardHeader}>
        <div>
          <h2 id="balance-summary-heading" className={styles.cardTitle}>
            {tx(
              'Billetera y custodia patrimonial (USD)',
              'Wallet & asset custody (USD)',
            )}
          </h2>
          <p className={styles.cardSubtitle}>
            {tx(
              'Efectivo y patrimonio reportados por tu cuenta de inversión.',
              'Cash and equity reported by your brokerage account.',
            )}
          </p>
        </div>
        {balance.buying_power_usd !== undefined && (
          <span className={`${styles.statusBadge} ${styles.badgeSuccess}`}>
            <span className={styles.tabularNum}>
              {tx('Poder de compra:', 'Buying power:')}{' '}
              {formatUsd(balance.buying_power_usd, { withCode: true })}
            </span>
          </span>
        )}
      </div>

      <div className={styles.balanceKpis}>
        <div className={`${styles.kpiBox} ${styles.kpiBoxHighlight}`}>
          <span className={styles.kpiLabel}>
            {tx('Efectivo retirable', 'Withdrawable cash')}
          </span>
          <strong className={`${styles.kpiValue} ${styles.kpiValueGreen}`}>
            {formatUsd(balance.available_balance_usd)}
          </strong>
          <span className={styles.kpiHint}>
            {tx(
              'Disponible para solicitar retiros (cash_withdrawable)',
              'Available for withdrawal requests (cash_withdrawable)',
            )}
          </span>
        </div>

        <div className={`${styles.kpiBox} ${styles.kpiBoxReserved}`}>
          <span className={styles.kpiLabel}>
            {tx('Efectivo no retirable', 'Non-withdrawable cash')}
          </span>
          <strong className={`${styles.kpiValue} ${styles.kpiValueAmber}`}>
            {formatUsd(balance.reserved_balance_usd)}
          </strong>
          <span className={styles.kpiHint}>
            {tx(
              'Diferencia entre efectivo total y retirable',
              'Difference between total cash and withdrawable cash',
            )}
          </span>
        </div>

        <div className={styles.kpiBox}>
          <span className={styles.kpiLabel}>
            {tx('Patrimonio total', 'Total equity')}
          </span>
          <strong className={styles.kpiValue}>{formatUsd(totalEquity)}</strong>
          <span className={`${styles.kpiHint} ${styles.tabularNum}`}>
            {tx(
              `Efectivo + ${formatUsd(balance.invested_equity_usd)} invertido`,
              `Cash + ${formatUsd(balance.invested_equity_usd)} invested`,
            )}
          </span>
        </div>
      </div>
    </section>
  );
}
