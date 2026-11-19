'use client';

import type { ApiOrder } from './trading-api';
import { orderTypeLabels } from './OrderForm';
import {
  formatOrderCause,
  formatOrderStatus,
  getOrderStatusTone,
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
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Instrumento</th>
            <th>Operación / tipo</th>
            <th>Cantidad / ejecutada</th>
            <th>Estado</th>
            <th>Precio ejecutado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {orders.length === 0 && (
            <tr>
              <td colSpan={6} className={styles.emptyCell}>
                No hay órdenes para este filtro.
              </td>
            </tr>
          )}
          {orders.map((order) => {
            const tone = getOrderStatusTone(order.status, order.fully_filled);
            const causeText = order.status_cause ?? order.provider_status;

            return (
              <tr key={order.id}>
                <td>
                  <strong>{order.symbol}</strong>
                  <small className={styles.subtleLine}>
                    {new Date(order.created_at).toLocaleString('es-CO')}
                  </small>
                </td>
                <td>
                  {order.side === 'buy' ? 'Compra' : 'Venta'} ·{' '}
                  {orderTypeLabels[order.type]}
                  {order.order_class === 'bracket' ? ' · Bracket' : ''}
                </td>
                <td className={styles.tabularNum}>
                  {order.qty} / {order.filled_qty}
                </td>
                <td>
                  <span
                    className={`${styles.statusBadge} ${TONE_CLASS_MAP[tone]}`}
                  >
                    {formatOrderStatus(order.status, order.fully_filled)}
                  </span>
                  {causeText && (
                    <small className={styles.subtleLine}>
                      {formatOrderCause(causeText)}
                    </small>
                  )}
                </td>
                <td className={styles.tabularNum}>
                  {order.filled_avg_price
                    ? `$${order.filled_avg_price} USD`
                    : '—'}
                </td>
                <td>
                  <button
                    type="button"
                    className={styles.btnCompact}
                    onClick={() => onSelect(order.id)}
                  >
                    Detalle y acciones
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
