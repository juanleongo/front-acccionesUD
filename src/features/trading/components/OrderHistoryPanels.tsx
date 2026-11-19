'use client';

import type { OrderDetail } from '../trading-api';
import { formatOrderCause, formatOrderStatus } from '../trading-labels';
import styles from '../trading.module.css';

export function OrderHistoryPanels({ order }: { order: OrderDetail }) {
  return (
    <>
      <details className={styles.detailsAccordion}>
        <summary className={styles.detailsSummary}>
          Ejecuciones ({order.executions.length})
        </summary>
        <div className={styles.detailsList}>
          {order.executions.length === 0 ? (
            <div className={styles.detailsItem}>
              Sin ejecuciones registradas aún.
            </div>
          ) : (
            order.executions.map((item) => (
              <div
                key={item.alpaca_execution_id}
                className={styles.detailsItem}
              >
                <strong>
                  {item.qty} acciones a ${item.price} USD
                </strong>
                <span>
                  {new Date(item.executed_at).toLocaleString('es-CO')}
                </span>
              </div>
            ))
          )}
        </div>
      </details>

      <details className={styles.detailsAccordion}>
        <summary className={styles.detailsSummary}>
          Historial de estados ({order.events.length})
        </summary>
        <div className={styles.detailsList}>
          {order.events.length === 0 ? (
            <div className={styles.detailsItem}>
              Sin movimientos en el historial.
            </div>
          ) : (
            order.events.map((event) => (
              <div key={event.id} className={styles.detailsItem}>
                <span>
                  <strong>{formatOrderStatus(event.to_status)}</strong> ·{' '}
                  {formatOrderCause(event.cause)}
                </span>
                <span>{new Date(event.at).toLocaleString('es-CO')}</span>
              </div>
            ))
          )}
        </div>
      </details>
    </>
  );
}
