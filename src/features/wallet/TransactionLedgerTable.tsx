'use client';

import { useState } from 'react';
import {
  formatTransferStatus,
  formatUsd,
  getTransferStatusTone,
} from './wallet-labels';
import type { LedgerTransaction, LedgerTxType } from './wallet-mock';
import styles from './wallet.module.css';

const TONE_BADGE_MAP = {
  success: styles.badgeSuccess,
  reserved: styles.badgeReserved,
  error: styles.badgeError,
} as const;

export function TransactionLedgerTable({
  transactions,
}: {
  transactions: LedgerTransaction[];
}) {
  const [filterType, setFilterType] = useState<'ALL' | LedgerTxType>('ALL');

  const filtered = transactions.filter((tx) => {
    if (filterType === 'ALL') return true;
    return tx.tx_type === filterType;
  });

  return (
    <section className={styles.card} aria-labelledby="ledger-heading">
      <div className={styles.cardHeader}>
        <div>
          <h2 id="ledger-heading" className={styles.cardTitle}>
            Historial de depósitos y retiros
          </h2>
          <p className={styles.cardSubtitle}>
            Movimientos registrados en tu cuenta de inversión en USD.
          </p>
        </div>
      </div>

      <div className={styles.filterRow}>
        {(
          [
            { id: 'ALL', label: `Todos (${transactions.length})` },
            { id: 'DEPOSIT', label: 'Depósitos' },
            { id: 'WITHDRAWAL', label: 'Retiros' },
            { id: 'ORDER_RESERVATION', label: 'Reservas' },
            { id: 'TRADE_SETTLEMENT', label: 'Liquidaciones' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilterType(tab.id)}
            className={`${styles.filterPill} ${filterType === tab.id ? styles.filterPillActive : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Concepto</th>
              <th>Divisa orig.</th>
              <th>Monto USD</th>
              <th>Comisión</th>
              <th>Saldo posterior</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className={styles.emptyCell}>
                  No existen movimientos para el filtro seleccionado.
                </td>
              </tr>
            ) : (
              filtered.map((tx) => {
                const isPositive = tx.amount_usd >= 0;
                const tone = getTransferStatusTone(tx.status);

                return (
                  <tr key={tx.id}>
                    <td className={styles.dateCell}>{tx.created_at}</td>
                    <td>
                      <strong>{tx.concept}</strong>
                      <div className={styles.txRef}>
                        Operación en {tx.original_currency}
                      </div>
                    </td>
                    <td className={styles.tabularNum}>
                      {tx.original_amount.toLocaleString('en-US')}{' '}
                      {tx.original_currency}
                    </td>
                    <td>
                      <strong
                        className={
                          isPositive
                            ? styles.amountPositive
                            : styles.amountNegative
                        }
                      >
                        {isPositive ? '+' : '-'}$
                        {formatUsd(Math.abs(tx.amount_usd))}
                      </strong>
                    </td>
                    <td className={styles.tabularNum}>
                      {tx.fee_usd === null ? '—' : `$${formatUsd(tx.fee_usd)}`}
                    </td>
                    <td className={styles.tabularNum}>
                      {tx.balance_after_usd === null
                        ? '—'
                        : `$${formatUsd(tx.balance_after_usd)}`}
                    </td>
                    <td>
                      <span
                        className={`${styles.statusBadge} ${TONE_BADGE_MAP[tone]}`}
                      >
                        {formatTransferStatus(tx.status)}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
