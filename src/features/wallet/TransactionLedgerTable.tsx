'use client';

import { useMemo, useState } from 'react';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { DatePicker } from '@/components/ui/DatePicker';
import { useQuery } from '@tanstack/react-query';
import { fetchWalletTransfers } from './wallet-api';
import {
  formatDecimalNumber,
  formatMarketDateTime,
  formatUsd,
} from '@/lib/formatters';
import { useLocale } from '@/lib/i18n';
import { formatTransferStatus, getTransferStatusTone } from './wallet-labels';
import { LoadingState } from '@/components/ui/LoadingState';
import styles from './wallet.module.css';

type LedgerTypeFilter = 'ALL' | 'DEPOSIT' | 'WITHDRAWAL';

const TONE_BADGE_MAP = {
  success: styles.badgeSuccess,
  reserved: styles.badgeReserved,
  error: styles.badgeError,
} as const;

export function TransactionLedgerTable() {
  const { locale, tx } = useLocale();

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [filterType, setFilterType] = useState<LedgerTypeFilter>('ALL');
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
  const transactions = useMemo(() => query.data?.items ?? [], [query.data]);
  const counts = useMemo(() => {
    let deposits = 0;
    let withdrawals = 0;
    for (const row of transactions) {
      if (row.tx_type === 'DEPOSIT') deposits += 1;
      else if (row.tx_type === 'WITHDRAWAL') withdrawals += 1;
    }
    return {
      all: transactions.length,
      deposit: deposits,
      withdrawal: withdrawals,
    };
  }, [transactions]);

  const distinctStatuses = useMemo(
    () => Array.from(new Set(transactions.map((row) => row.status))),
    [transactions],
  );
  const activeStatus =
    statusFilter === 'ALL' || distinctStatuses.includes(statusFilter)
      ? statusFilter
      : 'ALL';

  function formatConcept(concept: string) {
    if (locale !== 'en') return concept;
    if (concept === 'Depósito de fondos (ACH)') return 'Funds deposit (ACH)';
    if (concept === 'Retiro de fondos (ACH)') return 'Funds withdrawal (ACH)';
    return concept;
  }

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filtered = transactions.filter((row) => {
    if (invalid) return false;
    if (filterType !== 'ALL' && row.tx_type !== filterType) return false;
    if (activeStatus !== 'ALL' && row.status !== activeStatus) return false;
    if (normalizedQuery) {
      const refMatch = row.external_ref.toLowerCase().includes(normalizedQuery);
      const conceptMatch = formatConcept(row.concept)
        .toLowerCase()
        .includes(normalizedQuery);
      if (!refMatch && !conceptMatch) return false;
    }
    return true;
  });

  return (
    <section className={styles.card} aria-labelledby="ledger-heading">
      <div className={styles.cardHeader}>
        <div>
          <h2 id="ledger-heading" className={styles.cardTitle}>
            {tx(
              'Historial de depósitos y retiros',
              'Deposit & withdrawal history',
            )}
          </h2>
          <p className={styles.cardSubtitle}>
            {tx(
              'Movimientos registrados en tu cuenta de inversión en USD.',
              'Movements recorded in your USD brokerage account.',
            )}
          </p>
        </div>
      </div>

      <div className={styles.ledgerToolbar}>
        <div className={styles.filterRow}>
          {(
            [
              {
                id: 'ALL',
                label: `${tx('Todos', 'All')} (${counts.all})`,
              },
              {
                id: 'DEPOSIT',
                label: `${tx('Depósitos', 'Deposits')} (${counts.deposit})`,
              },
              {
                id: 'WITHDRAWAL',
                label: `${tx('Retiros', 'Withdrawals')} (${counts.withdrawal})`,
              },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              aria-pressed={filterType === tab.id}
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

        {transactions.length > 0 && (
          <div className={styles.ledgerFilterFields}>
            <p className={styles.ledgerFilterNote}>
              {tx(
                'Búsqueda y estado: filtran los movimientos de esta página.',
                'Search and status filter transactions on this page.',
              )}
            </p>
            <label className={styles.fieldGroup}>
              <span className={styles.fieldLabel}>
                {tx(
                  'Buscar por referencia o concepto',
                  'Search ref or concept',
                )}
              </span>
              <input
                type="search"
                className={styles.input}
                placeholder={tx('Ej. ACH, ref…', 'E.g. ACH, ref…')}
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </label>

            <div className={styles.fieldGroup}>
              <label
                htmlFor="ledger-status-filter"
                className={styles.fieldLabel}
              >
                {tx('Estado', 'Status')}
              </label>
              <CustomSelect
                id="ledger-status-filter"
                value={activeStatus}
                onChange={setStatusFilter}
                options={[
                  {
                    value: 'ALL',
                    label: tx('Todos los estados', 'All statuses'),
                  },
                  ...distinctStatuses.map((status) => ({
                    value: status,
                    label: formatTransferStatus(status, locale),
                  })),
                ]}
              />
            </div>
          </div>
        )}
      </div>

      <div className={styles.ledgerDateControls}>
        <label className={styles.fieldGroup}>
          {tx('Desde', 'From')}
          <DatePicker
            id="ledger-from"
            label={tx('Desde', 'From')}
            value={from}
            max={to || undefined}
            onChange={(value) => {
              setFrom(value);
              setCursors(['']);
            }}
          />
        </label>
        <label className={styles.fieldGroup}>
          {tx('Hasta', 'To')}
          <DatePicker
            id="ledger-to"
            label={tx('Hasta', 'To')}
            value={to}
            min={from || undefined}
            onChange={(value) => {
              setTo(value);
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
          {tx('Limpiar fechas', 'Clear dates')}
        </button>
      </div>
      <p className={styles.ledgerDateNote}>
        {tx(
          'Fechas de registro en hora de Colombia (UTC−5), ambos días incluidos.',
          'Registration dates in Colombia time (UTC−5), both dates included.',
        )}
      </p>
      {invalid && (
        <p role="alert" className={styles.errorText}>
          {tx(
            'Desde no puede ser posterior a Hasta.',
            'From cannot be after To.',
          )}
        </p>
      )}
      {query.isFetching && (
        <LoadingState
          mode="compact"
          label={tx('Consultando movimientos…', 'Loading transactions…')}
        />
      )}
      {query.isError && (
        <p role="alert" className={styles.errorText}>
          {tx(
            'No se pudo consultar el historial.',
            'Could not load transaction history.',
          )}
          <button
            type="button"
            onClick={() => {
              void query.refetch();
            }}
          >
            {tx('Reintentar', 'Retry')}
          </button>
        </p>
      )}
      <div className={`${styles.tableWrap} ${styles.ledgerTableWrap}`}>
        <table className={`${styles.table} ${styles.ledgerTable}`} role="table">
          <thead>
            <tr>
              <th>{tx('Fecha', 'Date')}</th>
              <th>{tx('Concepto', 'Description')}</th>
              <th>{tx('Divisa orig.', 'Orig. currency')}</th>
              <th>{tx('Monto USD', 'Amount USD')}</th>
              <th>{tx('Comisión', 'Fee')}</th>
              <th>{tx('Saldo posterior', 'Balance after')}</th>
              <th>{tx('Estado', 'Status')}</th>
            </tr>
          </thead>
          <tbody>
            {query.isPending ||
            invalid ||
            query.isError ? null : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className={styles.emptyCell}>
                  {tx(
                    'No existen movimientos para el filtro seleccionado.',
                    'No transactions found for the selected filter.',
                  )}
                </td>
              </tr>
            ) : (
              filtered.map((row) => {
                const isPositive = row.amount_usd >= 0;
                const tone = getTransferStatusTone(row.status);
                const formattedDate = formatMarketDateTime(
                  row.created_at,
                  locale,
                );

                return (
                  <tr key={row.id}>
                    <td
                      className={styles.dateCell}
                      data-label={tx('Fecha', 'Date')}
                    >
                      {formattedDate === '—' ? row.created_at : formattedDate}
                    </td>
                    <td
                      className={styles.conceptCell}
                      data-label={tx('Concepto', 'Description')}
                    >
                      <strong>{formatConcept(row.concept)}</strong>
                      <div className={styles.txRef} title={row.external_ref}>
                        {row.external_ref ? `${row.external_ref} · ` : ''}
                        {tx('Operación en', 'Currency:')}{' '}
                        {row.original_currency}
                      </div>
                    </td>
                    <td
                      className={styles.tabularNum}
                      data-label={tx('Divisa original', 'Original currency')}
                    >
                      {formatDecimalNumber(row.original_amount, locale, 2)}{' '}
                      {row.original_currency}
                    </td>
                    <td
                      className={styles.ledgerAmountCell}
                      data-label={tx('Monto USD', 'Amount USD')}
                    >
                      <strong
                        className={
                          isPositive
                            ? styles.amountPositive
                            : styles.amountNegative
                        }
                      >
                        {isPositive ? '+' : '-'}
                        {formatUsd(Math.abs(row.amount_usd))}
                      </strong>
                    </td>
                    <td
                      className={styles.tabularNum}
                      data-label={tx('Comisión', 'Fee')}
                    >
                      {row.fee_usd === null ? '—' : formatUsd(row.fee_usd)}
                    </td>
                    <td
                      className={styles.tabularNum}
                      data-label={tx('Saldo posterior', 'Balance after')}
                    >
                      {row.balance_after_usd === null
                        ? '—'
                        : formatUsd(row.balance_after_usd)}
                    </td>
                    <td
                      className={styles.ledgerStatusCell}
                      data-label={tx('Estado', 'Status')}
                    >
                      <span
                        className={`${styles.statusBadge} ${TONE_BADGE_MAP[tone]}`}
                      >
                        {formatTransferStatus(row.status, locale)}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <nav
        className={styles.ledgerPagination}
        aria-label={tx('Páginas de movimientos', 'Transaction pages')}
      >
        <button
          type="button"
          className={styles.btnCompact}
          disabled={invalid || query.isFetching || cursors.length === 1}
          onClick={() => setCursors((previous) => previous.slice(0, -1))}
        >
          {tx('Anterior', 'Previous')}
        </button>
        <span>
          {tx(
            `Página ${cursors.length} · Máximo 10 movimientos`,
            `Page ${cursors.length} · Up to 10 transactions`,
          )}
        </span>
        <button
          type="button"
          className={styles.btnCompact}
          disabled={invalid || query.isFetching || !query.data?.next_cursor}
          onClick={() => {
            const next = query.data?.next_cursor;
            if (next) setCursors((previous) => [...previous, next]);
          }}
        >
          {tx('Siguiente', 'Next')}
        </button>
      </nav>
    </section>
  );
}
