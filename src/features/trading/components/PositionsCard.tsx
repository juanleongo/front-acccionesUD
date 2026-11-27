'use client';

import { LoadingState } from '@/components/ui/LoadingState';
import { formatDecimalNumber, formatMarketDateTime } from '@/lib/formatters';
import { useLocale } from '@/lib/i18n';
import styles from '../trading.module.css';

export interface PositionRow {
  symbol: string;
  qty: string;
  reserved_qty: string;
  price: string;
}

export function PositionsCard({
  positions,
  positionsAsOf,
  isPending,
  isError,
}: {
  positions: PositionRow[];
  positionsAsOf: string | undefined;
  isPending: boolean;
  isError: boolean;
}) {
  const { locale, tx } = useLocale();
  return (
    <section className={styles.card}>
      <div className={styles.cardHeader}>
        <div>
          <h2 className={styles.cardTitle}>
            {tx('Tus posiciones', 'Your positions')}
          </h2>
          <p className={styles.cardSubtitle}>
            {tx(
              'Acciones disponibles para venta, descontando las reservas activas.',
              'Shares available to sell, excluding active holds.',
            )}
          </p>
        </div>
        {positionsAsOf && (
          <span className={styles.badgeTimestamp}>
            {tx('Actualizado:', 'Updated:')}{' '}
            {formatMarketDateTime(positionsAsOf, locale)}
          </span>
        )}
      </div>

      {isPending && (
        <LoadingState
          mode="compact"
          label={tx('Cargando posiciones…', 'Loading positions…')}
        />
      )}

      {isError && (
        <p role="alert" className={styles.alertError}>
          {tx(
            'No se pudieron consultar las posiciones.',
            'Could not load positions.',
          )}
        </p>
      )}

      {!isPending && !isError && (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{tx('Instrumento', 'Symbol')}</th>
                <th>{tx('Cantidad', 'Qty')}</th>
                <th>{tx('Reservada', 'Reserved')}</th>
                <th>{tx('Disponible', 'Available')}</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((position) => {
                const available = Math.max(
                  0,
                  Number(position.qty) - Number(position.reserved_qty),
                );
                return (
                  <tr key={position.symbol}>
                    <td data-label={tx('Instrumento', 'Symbol')}>
                      <strong>{position.symbol}</strong>
                    </td>
                    <td
                      className={styles.tabularNum}
                      data-label={tx('Cantidad', 'Qty')}
                    >
                      {position.qty}
                    </td>
                    <td
                      className={styles.tabularNum}
                      data-label={tx('Reservada', 'Reserved')}
                    >
                      {position.reserved_qty}
                    </td>
                    <td
                      className={styles.tabularNum}
                      data-label={tx('Disponible', 'Available')}
                    >
                      <strong>{formatDecimalNumber(available, locale)}</strong>
                    </td>
                  </tr>
                );
              })}
              {positions.length === 0 && (
                <tr>
                  <td colSpan={4} className={styles.emptyCell}>
                    {tx(
                      'Todavía no tienes posiciones registradas.',
                      'You do not have any positions yet.',
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
