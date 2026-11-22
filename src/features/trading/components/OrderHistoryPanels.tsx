'use client';

import { formatMarketDateTime, formatUsd } from '@/lib/formatters';
import { useLocale } from '@/lib/i18n';
import type { OrderDetail } from '../trading-api';
import { formatOrderCause, formatOrderStatus } from '../trading-labels';
import styles from '../trading.module.css';

export function OrderHistoryPanels({ order }: { order: OrderDetail }) {
  const { locale, tx } = useLocale();
  return (
    <>
      <details className={styles.detailsAccordion}>
        <summary className={styles.detailsSummary}>
          <span>
            {tx('Ejecuciones', 'Executions')} ({order.executions.length})
          </span>
        </summary>
        <div className={styles.detailsList}>
          {order.executions.length === 0 ? (
            <div className={styles.detailsItem}>
              {tx(
                'Sin ejecuciones registradas aún.',
                'No executions recorded yet.',
              )}
            </div>
          ) : (
            order.executions.map((item) => (
              <div
                key={item.alpaca_execution_id}
                className={styles.detailsItem}
              >
                <strong className={styles.tabularNum}>
                  {item.qty} {tx('acciones a', 'shares at')}{' '}
                  {formatUsd(item.price, {
                    withCode: true,
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 4,
                  })}
                </strong>
                <span className={styles.tabularNum}>
                  {formatMarketDateTime(item.executed_at, locale)}
                </span>
              </div>
            ))
          )}
        </div>
      </details>

      <details className={styles.detailsAccordion}>
        <summary className={styles.detailsSummary}>
          <span>
            {tx('Historial de estados', 'Status history')} (
            {order.events.length})
          </span>
        </summary>
        <div className={styles.detailsList}>
          {order.events.length === 0 ? (
            <div className={styles.detailsItem}>
              {tx('Sin movimientos en el historial.', 'No events in history.')}
            </div>
          ) : (
            order.events.map((event) => (
              <div key={event.id} className={styles.detailsItem}>
                <span>
                  <strong>
                    {formatOrderStatus(event.to_status, false, locale)}
                  </strong>{' '}
                  · {formatOrderCause(event.cause, locale)}
                </span>
                <span className={styles.tabularNum}>
                  {formatMarketDateTime(event.at, locale)}
                </span>
              </div>
            ))
          )}
        </div>
      </details>
    </>
  );
}
