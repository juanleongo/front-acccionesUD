'use client';

import { useState } from 'react';
import {
  ORDER_TYPE_META,
  type OrderRecord,
  type OrderStatus,
} from './trading-mock';
import styles from './trading.module.css';

const STATUS_LABELS: Record<
  OrderStatus,
  { text: string; className: string | undefined }
> = {
  FILLED: { text: 'Ejecutada', className: styles.statusFilled },
  OPEN: { text: 'Abierta', className: styles.statusOpen },
  QUEUED_OUT_OF_HOURS: {
    text: 'Encolada (Cierre)',
    className: styles.statusQueued,
  },
  REAUTHORIZATION_REQUIRED: {
    text: 'Requiere Reautorización',
    className: styles.statusReauth,
  },
  CANCELLED: { text: 'Cancelada', className: styles.statusCancelled },
};

export function ActiveOrdersTable({
  orders,
  onCancelOrder,
  onOpenReauthorize,
}: {
  orders: OrderRecord[];
  onCancelOrder: (orderId: string) => void;
  onOpenReauthorize: (order: OrderRecord) => void;
}) {
  const [filterSide, setFilterSide] = useState<'all' | 'buy' | 'sell'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | OrderStatus>('all');

  const filtered = orders.filter((order) => {
    if (filterSide !== 'all' && order.side !== filterSide) return false;
    if (filterStatus !== 'all' && order.status !== filterStatus) return false;
    return true;
  });

  return (
    <section className={styles.card} aria-labelledby="active-orders-heading">
      <div className={styles.cardHeader}>
        <div>
          <h2 id="active-orders-heading" className={styles.cardTitle}>
            Órdenes Activas y Encoladas
          </h2>
          <p className={styles.cardSubtitle}>
            Monitoreo de ciclo de vida: órdenes abiertas, encoladas fuera de
            horario y alertas de reautorización.
          </p>
        </div>
      </div>

      <div className={styles.filterRow}>
        <button
          type="button"
          onClick={() => setFilterSide('all')}
          className={`${styles.filterPill} ${filterSide === 'all' ? styles.filterPillActive : ''}`}
        >
          Todas ({orders.length})
        </button>
        <button
          type="button"
          onClick={() => setFilterSide('buy')}
          className={`${styles.filterPill} ${filterSide === 'buy' ? styles.filterPillActive : ''}`}
        >
          Compras
        </button>
        <button
          type="button"
          onClick={() => setFilterSide('sell')}
          className={`${styles.filterPill} ${filterSide === 'sell' ? styles.filterPillActive : ''}`}
        >
          Ventas
        </button>

        <select
          className={styles.select}
          style={{ width: 'auto', minHeight: '2.2rem', fontSize: '0.8rem' }}
          aria-label="Filtrar por estado de orden"
          value={filterStatus}
          onChange={(e) =>
            setFilterStatus(e.target.value as 'all' | OrderStatus)
          }
        >
          <option value="all">Todos los estados</option>
          <option value="OPEN">Abiertas</option>
          <option value="QUEUED_OUT_OF_HOURS">Encoladas (Fuera horario)</option>
          <option value="REAUTHORIZATION_REQUIRED">
            Requiere Reautorización
          </option>
          <option value="FILLED">Ejecutadas</option>
          <option value="CANCELLED">Canceladas</option>
        </select>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Símbolo</th>
              <th>Modalidad</th>
              <th>Sentido</th>
              <th>Cant.</th>
              <th>Precio Ref.</th>
              <th>Total (USD)</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  style={{
                    textAlign: 'center',
                    padding: '2rem',
                    color: 'var(--color-text-muted)',
                  }}
                >
                  No hay órdenes que coincidan con los filtros seleccionados.
                </td>
              </tr>
            ) : (
              filtered.map((order) => {
                const statusInfo = STATUS_LABELS[order.status];
                const refPrice =
                  order.execution_price_usd ??
                  order.limit_price_usd ??
                  order.stop_price_usd;
                const cancellable =
                  order.status === 'OPEN' ||
                  order.status === 'QUEUED_OUT_OF_HOURS' ||
                  order.status === 'REAUTHORIZATION_REQUIRED';

                return (
                  <tr key={order.id}>
                    <td>
                      <strong>{order.symbol}</strong>
                      <div
                        style={{
                          fontSize: '0.72rem',
                          color: 'var(--color-text-subtle)',
                        }}
                      >
                        {order.time_in_force} · {order.created_at}
                      </div>
                    </td>
                    <td>{ORDER_TYPE_META[order.order_type].shortLabel}</td>
                    <td>
                      <strong
                        style={{
                          color: order.side === 'buy' ? '#10b981' : '#ef4444',
                        }}
                      >
                        {order.side === 'buy' ? 'Compra' : 'Venta'}
                      </strong>
                    </td>
                    <td>{order.quantity}</td>
                    <td>
                      {refPrice !== null
                        ? `$${refPrice.toFixed(2)}`
                        : 'Mercado'}
                    </td>
                    <td>${order.total_usd.toFixed(2)}</td>
                    <td>
                      <span
                        className={`${styles.statusBadge} ${statusInfo.className}`}
                      >
                        {statusInfo.text}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        {order.status === 'REAUTHORIZATION_REQUIRED' && (
                          <button
                            type="button"
                            className={styles.btnWarning}
                            onClick={() => onOpenReauthorize(order)}
                          >
                            Reautorizar
                          </button>
                        )}
                        {cancellable && (
                          <button
                            type="button"
                            className={styles.btnDanger}
                            onClick={() => onCancelOrder(order.id)}
                          >
                            Cancelar
                          </button>
                        )}
                      </div>
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
