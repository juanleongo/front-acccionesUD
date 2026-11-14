'use client';

import type { WalletBalance } from './wallet-mock';
import styles from './wallet.module.css';

export function BalanceSummaryCard({
  balance,
  onOpenDeposit,
  onOpenWithdrawal,
}: {
  balance: WalletBalance;
  onOpenDeposit: () => void;
  onOpenWithdrawal: () => void;
}) {
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
            Segregación contable entre efectivo disponible y capital reservado
            en órdenes límite abiertas.
          </p>
        </div>
      </div>

      <div className={styles.balanceKpis}>
        <div className={`${styles.kpiBox} ${styles.kpiBoxHighlight}`}>
          <span className={styles.kpiLabel}>Saldo Disponible</span>
          <strong className={`${styles.kpiValue} ${styles.kpiValueGreen}`}>
            $
            {balance.available_balance_usd.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </strong>
          <span className={styles.kpiHint}>Libre para órdenes o retiros</span>
        </div>

        <div className={`${styles.kpiBox} ${styles.kpiBoxReserved}`}>
          <span className={styles.kpiLabel}>Saldo Reservado</span>
          <strong className={`${styles.kpiValue} ${styles.kpiValueAmber}`}>
            $
            {balance.reserved_balance_usd.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </strong>
          <span className={styles.kpiHint}>Bloqueado en órdenes abiertas</span>
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

      <div className={styles.segregationNote}>
        🔒 <strong>Regla de Segregación Inviolable:</strong> El saldo reservado
        respalda tus órdenes Limit / Stop vigentes y no puede ser retirado hasta
        que la orden sea ejecutada o cancelada.
      </div>

      <div className={styles.actionsRow}>
        <button
          type="button"
          className={styles.btnPrimary}
          onClick={onOpenDeposit}
        >
          + Depositar Fondos (COP / EUR / GBP / USD)
        </button>
        <button
          type="button"
          className={styles.btnSecondary}
          onClick={onOpenWithdrawal}
        >
          ↗ Retirar Fondos (USD)
        </button>
      </div>
    </section>
  );
}
