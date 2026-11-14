'use client';

import { useState } from 'react';
import type { LedgerTransaction, LedgerTxType } from './wallet-mock';
import styles from './wallet.module.css';

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
            Libro Mayor Contable (Cash Ledger)
          </h2>
          <p className={styles.cardSubtitle}>
            Registro auditable de depósitos, retiros, reservas de órdenes y
            liquidaciones en USD.
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
              <th>Concepto / Referencia</th>
              <th>Divisa Orig.</th>
              <th>Monto USD</th>
              <th>Comisión</th>
              <th>Saldo Posterior</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  style={{
                    textAlign: 'center',
                    padding: '2rem',
                    color: 'var(--color-text-muted)',
                  }}
                >
                  No existen movimientos para el filtro seleccionado.
                </td>
              </tr>
            ) : (
              filtered.map((tx) => {
                const isPositive = tx.amount_usd >= 0;
                return (
                  <tr key={tx.id}>
                    <td
                      style={{
                        fontSize: '0.78rem',
                        color: 'var(--color-text-muted)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {tx.created_at}
                    </td>
                    <td>
                      <strong>{tx.concept}</strong>
                      <div
                        style={{
                          fontSize: '0.72rem',
                          color: 'var(--color-text-subtle)',
                        }}
                      >
                        Ref: {tx.external_ref}
                      </div>
                    </td>
                    <td>
                      {tx.original_amount.toLocaleString('en-US')}{' '}
                      {tx.original_currency}
                    </td>
                    <td>
                      <strong
                        style={{
                          color: isPositive ? '#10b981' : '#ef4444',
                        }}
                      >
                        {isPositive ? '+' : '-'}$
                        {Math.abs(tx.amount_usd).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                        })}
                      </strong>
                    </td>
                    <td>${tx.fee_usd.toFixed(2)}</td>
                    <td>
                      $
                      {tx.balance_after_usd.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td>
                      <span
                        className={
                          tx.status === 'RESERVADO'
                            ? styles.badgeReserved
                            : styles.badgeSuccess
                        }
                      >
                        {tx.status}
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
