'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchWalletTransfers } from './wallet-api';
import {
  formatTransferStatus,
  formatUsd,
  getTransferStatusTone,
} from './wallet-labels';
import styles from './wallet.module.css';

const TONE_BADGE_MAP = {
  success: styles.badgeSuccess,
  reserved: styles.badgeReserved,
  error: styles.badgeError,
} as const;

export function TransactionLedgerTable() {
  const [filterType, setFilterType] = useState('ALL');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [cursors, setCursors] = useState(['']);
  const invalid = Boolean(from && to && from > to);
  const query = useQuery({
    queryKey: ['wallet', 'transfers', filterType, from, to, cursors.at(-1)],
    queryFn: ({ signal }) =>
      fetchWalletTransfers(signal, {
        from,
        to,
        direction:
          filterType === 'DEPOSIT'
            ? 'INCOMING'
            : filterType === 'WITHDRAWAL'
              ? 'OUTGOING'
              : '',
        cursor: cursors.at(-1) ?? '',
      }),
    enabled: !invalid,
    retry: false,
  });
  const filtered = invalid ? [] : (query.data?.items ?? []);

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
            { id: 'ALL', label: 'Todos' },
            { id: 'DEPOSIT', label: 'Depósitos' },
            { id: 'WITHDRAWAL', label: 'Retiros' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setFilterType(tab.id);
              setCursors(['']);
            }}
            className={`${styles.filterPill} ${filterType === tab.id ? styles.filterPillActive : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className={styles.filterRow}>
        <label className={styles.fieldGroup}>
          Desde
          <input
            type="date"
            className={styles.input}
            value={from}
            max={to || undefined}
            onChange={(e) => {
              setFrom(e.target.value);
              setCursors(['']);
            }}
          />
        </label>
        <label className={styles.fieldGroup}>
          Hasta
          <input
            type="date"
            className={styles.input}
            value={to}
            min={from || undefined}
            onChange={(e) => {
              setTo(e.target.value);
              setCursors(['']);
            }}
          />
        </label>
        <button
          type="button"
          className={styles.btnCompact}
          disabled={!from && !to}
          onClick={() => {
            setFrom('');
            setTo('');
            setCursors(['']);
          }}
        >
          Limpiar fechas
        </button>
      </div>
      <p className={styles.cardSubtitle}>
        Fechas de registro en hora de Colombia (UTC−5), ambos días incluidos.
      </p>
      {invalid && (
        <p role="alert" className={styles.errorText}>
          Desde no puede ser posterior a Hasta.
        </p>
      )}
      {query.isFetching && <p role="status">Consultando movimientos…</p>}
      {query.isError && (
        <p role="alert" className={styles.errorText}>
          No se pudo consultar el historial.{' '}
          <button
            type="button"
            onClick={() => {
              void query.refetch();
            }}
          >
            Reintentar
          </button>
        </p>
      )}
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
                  {query.isFetching
                    ? 'Cargando…'
                    : query.isError || invalid
                      ? 'Sin datos disponibles para esta consulta.'
                      : 'No existen movimientos para el filtro seleccionado.'}
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
      <div className={styles.filterRow}>
        <button
          type="button"
          className={styles.btnCompact}
          disabled={invalid || query.isFetching || cursors.length === 1}
          onClick={() => setCursors((previous) => previous.slice(0, -1))}
        >
          Anterior
        </button>
        <span>Página {cursors.length} · Máximo 10 movimientos</span>
        <button
          type="button"
          className={styles.btnCompact}
          disabled={invalid || query.isFetching || !query.data?.next_cursor}
          onClick={() => {
            const next = query.data?.next_cursor;
            if (next) setCursors((previous) => [...previous, next]);
          }}
        >
          Siguiente
        </button>
      </div>
    </section>
  );
}
