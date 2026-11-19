'use client';
import type { ApiOrder } from './trading-api';
import { orderTypeLabels } from './OrderForm';
import styles from './trading.module.css';
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
              <td colSpan={6}>No hay órdenes para este filtro.</td>
            </tr>
          )}
          {orders.map((order) => (
            <tr key={order.id}>
              <td>
                {order.symbol}
                <small className={styles.subtleLine}>
                  {new Date(order.created_at).toLocaleString('es-CO')}
                </small>
              </td>
              <td>
                {order.side === 'buy' ? 'Compra' : 'Venta'} ·{' '}
                {orderTypeLabels[order.type]}
                {order.order_class === 'bracket' ? ' · Bracket' : ''}
              </td>
              <td>
                {order.qty} / {order.filled_qty}
              </td>
              <td>
                {order.status}
                {order.fully_filled ? ' · Ejecutada completamente' : ''}
                <small className={styles.subtleLine}>
                  {order.provider_status ?? order.status_cause}
                </small>
              </td>
              <td>
                {order.filled_avg_price ? `$${order.filled_avg_price}` : '—'}
              </td>
              <td>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => onSelect(order.id)}
                >
                  Detalle y acciones
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
