'use client';

import type { WalletBalance } from './wallet-mock';
import styles from './wallet.module.css';

export function BalanceSummaryCard({ balance }: { balance: WalletBalance }) {
  const totalWalletCash =
    balance.available_balance_usd + balance.reserved_balance_usd;
  const totalEquity = totalWalletCash + balance.invested_equity_usd;

  return (
    <section className={styles.card} aria-labelledby="balance-summary-heading">
      <div className={styles.cardHeader}>
        <div>
          <h2 id="balance-summary-heading" className={styles.cardTitle}>
            Billetera y Custodia Patrimonial (USD)
          </h2>
          <p className={styles.cardSubtitle}>
            Efectivo y patrimonio reportados por la cuenta de inversión.
          </p>
        </div>
      </div>

      <div className={styles.balanceKpis}>
        <div className={`${styles.kpiBox} ${styles.kpiBoxHighlight}`}>
          <span className={styles.kpiLabel}>Efectivo retirable</span>
          <strong className={`${styles.kpiValue} ${styles.kpiValueGreen}`}>
            $
            {balance.available_balance_usd.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </strong>
          <span className={styles.kpiHint}>
            Disponible para solicitar retiros
          </span>
        </div>

        <div className={`${styles.kpiBox} ${styles.kpiBoxReserved}`}>
          <span className={styles.kpiLabel}>Efectivo no retirable</span>
          <strong className={`${styles.kpiValue} ${styles.kpiValueAmber}`}>
            $
            {balance.reserved_balance_usd.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </strong>
          <span className={styles.kpiHint}>
            Diferencia entre efectivo total y retirable
          </span>
        </div>

        <div className={styles.kpiBox}>
          <span className={styles.kpiLabel}>Patrimonio Total</span>
          <strong className={styles.kpiValue}>
            $
            {totalEquity.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </strong>
          <span className={styles.kpiHint}>
            Efectivo + ${balance.invested_equity_usd.toLocaleString('en-US')}{' '}
            invertido
          </span>
        </div>
      </div>
    </section>
  );
}
