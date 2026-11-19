'use client';

import { formatUsd } from './wallet-labels';
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
            Billetera y custodia patrimonial (USD)
          </h2>
          <p className={styles.cardSubtitle}>
            Efectivo y patrimonio reportados por tu cuenta de inversión.
          </p>
        </div>
      </div>

      <div className={styles.balanceKpis}>
        <div className={`${styles.kpiBox} ${styles.kpiBoxHighlight}`}>
          <span className={styles.kpiLabel}>Efectivo retirable</span>
          <strong className={`${styles.kpiValue} ${styles.kpiValueGreen}`}>
            ${formatUsd(balance.available_balance_usd)}
          </strong>
          <span className={styles.kpiHint}>
            Disponible para solicitar retiros
          </span>
        </div>

        <div className={`${styles.kpiBox} ${styles.kpiBoxReserved}`}>
          <span className={styles.kpiLabel}>Efectivo no retirable</span>
          <strong className={`${styles.kpiValue} ${styles.kpiValueAmber}`}>
            ${formatUsd(balance.reserved_balance_usd)}
          </strong>
          <span className={styles.kpiHint}>
            Diferencia entre efectivo total y retirable
          </span>
        </div>

        <div className={styles.kpiBox}>
          <span className={styles.kpiLabel}>Patrimonio total</span>
          <strong className={styles.kpiValue}>${formatUsd(totalEquity)}</strong>
          <span className={styles.kpiHint}>
            Efectivo + ${formatUsd(balance.invested_equity_usd)} invertido
          </span>
        </div>
      </div>
    </section>
  );
}
