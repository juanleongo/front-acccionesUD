'use client';

import { formatMarketDateTime, formatUsd } from '@/lib/formatters';
import { useLocale } from '@/lib/i18n';
import type { ApiOrder } from './trading-api';
import {
  formatOrderCause,
  formatOrderStatus,
  getOrderStatusTone,
  getOrderTypeLabels,
} from './trading-labels';
import styles from './trading.module.css';

const TONE_CLASS_MAP = {
  filled: styles.statusFilled,
  open: styles.statusOpen,
  queued: styles.statusQueued,
  reauth: styles.statusReauth,
  cancelled: styles.statusCancelled,
} as const;

export function ActiveOrdersTable({
  orders,
  onSelect,
}: {
  orders: ApiOrder[];
  onSelect: (id: string) => void;
}) {
  const { locale, tx } = useLocale();
  const typeLabels = getOrderTypeLabels(locale);

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>{tx('Instrumento', 'Symbol')}</th>
            <th>{tx('Operación / tipo', 'Side / type')}</th>
            <th>{tx('Cantidad / ejecutada', 'Qty / filled')}</th>
            <th>{tx('Estado', 'Status')}</th>
            <th>{tx('Precio ejecutado', 'Fill price')}</th>
            <th>{tx('Acciones', 'Actions')}</th>
          </tr>
        </thead>
        <tbody>
          {orders.length === 0 && (
            <tr>
              <td colSpan={6} className={styles.emptyCell}>
                {tx(
                  'No hay órdenes para este filtro.',
                  'No orders match this filter.',
                )}
              </td>
            </tr>
          )}
          {orders.map((order) => {
            const tone = getOrderStatusTone(order.status, order.fully_filled);
            const causeText = order.status_cause ?? order.provider_status;

            return (
              <tr key={order.id}>
                <td data-label={tx('Instrumento', 'Symbol')}>
                  <strong>{order.symbol}</strong>
                  <small
                    className={`${styles.subtleLine} ${styles.tabularNum}`}
                  >
                    {formatMarketDateTime(order.created_at, locale)}
                  </small>
                </td>
                <td data-label={tx('Operación / tipo', 'Side / type')}>
                  {order.side === 'buy'
                    ? tx('Compra', 'Buy')
                    : tx('Venta', 'Sell')}{' '}
                  · {typeLabels[order.type]}
                  {order.order_class === 'bracket' ? ' · Bracket' : ''}
                </td>
                <td
                  className={styles.tabularNum}
                  data-label={tx('Cantidad / ejecutada', 'Qty / filled')}
                >
                  {order.qty} / {order.filled_qty}
                </td>
                <td data-label={tx('Estado', 'Status')}>
                  <span
                    className={`${styles.statusBadge} ${TONE_CLASS_MAP[tone]}`}
                  >
                    {formatOrderStatus(
                      order.status,
                      order.fully_filled,
                      locale,
                    )}
                  </span>
                  {causeText && (
                    <small className={styles.subtleLine}>
                      {formatOrderCause(causeText, locale)}
                    </small>
                  )}
                </td>
                <td
                  className={styles.tabularNum}
                  data-label={tx('Precio ejecutado', 'Fill price')}
                >
                  {order.filled_avg_price
                    ? formatUsd(order.filled_avg_price, {
                        withCode: true,
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 4,
                      })
                    : '—'}
                </td>
                <td data-label={tx('Acciones', 'Actions')}>
                  <button
                    type="button"
                    className={styles.btnCompact}
                    onClick={() => onSelect(order.id)}
                  >
                    {tx('Detalle y acciones', 'Details & actions')}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
