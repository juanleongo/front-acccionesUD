'use client';

import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LoadingState } from '@/components/ui/LoadingState';
import {
  OrderActionConfirmForm,
  type OrderPendingAction,
} from './components/OrderActionConfirmForm';
import { OrderHistoryPanels } from './components/OrderHistoryPanels';
import { getOrder, orderAction, type OrderDetail } from './trading-api';
import {
  formatOrderCause,
  formatOrderStatus,
  formatTimeInForce,
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

const LEG_LABELS = {
  take_profit: 'Take profit',
  stop_loss: 'Stop loss',
} as const;

export function OrderDetails({
  id,
  onUpdated,
  onEdit,
  onClose,
}: {
  id: string;
  onUpdated: () => void;
  onEdit: (order: OrderDetail) => void;
  onClose: () => void;
}) {
  const query = useQuery({
    queryKey: ['order-detail', id],
    queryFn: ({ signal }) => getOrder(id, signal),
    retry: false,
    refetchInterval: 15000,
  });
  const [action, setAction] = useState<OrderPendingAction | null>(null);
  const [reason, setReason] = useState('no_longer_needed');
  const [reasonText, setReasonText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const flight = useRef(false);

  async function confirm() {
    if (!action || flight.current) return;
    flight.current = true;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const result = await orderAction(
        id,
        action === 'accept' || action === 'reject' ? 'reauthorization' : action,
        action === 'cancel'
          ? {
              reason,
              ...(reason === 'other' ? { reason_text: reasonText } : {}),
              confirmed: true,
            }
          : action === 'resume'
            ? undefined
            : { decision: action },
      );
      setNotice(
        `Solicitud procesada correctamente. Estado: ${formatOrderStatus(result.status, result.fully_filled)} (${result.status}).`,
      );
      setAction(null);
      await query.refetch();
      onUpdated();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'No se pudo procesar la solicitud.',
      );
    } finally {
      flight.current = false;
      setBusy(false);
    }
  }

  const order = query.data;
  const pending = order?.reauthorizations.find(
    (item) => item.decision === null,
  );
  const tone = order
    ? getOrderStatusTone(order.status, order.fully_filled)
    : 'cancelled';

  return (
    <section className={styles.card} aria-label="Detalle de orden">
      <div className={styles.cardHeader}>
        <div>
          <h2 className={styles.cardTitle}>
            Detalle de orden{order ? ` · ${order.symbol}` : ''}
          </h2>
          {order && (
            <p className={styles.cardSubtitle}>
              {order.side === 'buy' ? 'Compra' : 'Venta'} de {order.qty}{' '}
              acciones · {formatTimeInForce(order.time_in_force)}
            </p>
          )}
        </div>
        <div className={styles.actionsRow}>
          {order && (
            <span className={`${styles.statusBadge} ${TONE_CLASS_MAP[tone]}`}>
              {formatOrderStatus(order.status, order.fully_filled)}
            </span>
          )}
          <button
            type="button"
            disabled={busy}
            className={styles.btnCompact}
            onClick={onClose}
          >
            Cerrar detalle
          </button>
        </div>
      </div>

      {query.isPending && (
        <LoadingState mode="compact" label="Consultando orden…" />
      )}

      {query.isError && (
        <div role="alert" className={styles.alertError}>
          <span>No se pudo consultar el detalle.</span>
          <button
            type="button"
            className={styles.btnCompact}
            onClick={() => {
              void query.refetch();
            }}
          >
            Reintentar
          </button>
        </div>
      )}

      {order && (
        <>
          <div className={styles.detailGrid}>
            <div className={styles.detailTile}>
              <span className={styles.detailTileLabel}>Ejecutadas</span>
              <span className={styles.detailTileValue}>
                {order.filled_qty} / {order.qty} acciones
              </span>
            </div>
            <div className={styles.detailTile}>
              <span className={styles.detailTileLabel}>Precio promedio</span>
              <span className={styles.detailTileValue}>
                {order.filled_avg_price
                  ? `$${order.filled_avg_price} USD`
                  : 'No disponible'}
              </span>
            </div>
            <div className={styles.detailTile}>
              <span className={styles.detailTileLabel}>Condiciones</span>
              <span className={styles.detailTileValue}>
                {order.limit_price
                  ? `Límite $${order.limit_price}`
                  : order.stop_price
                    ? `Stop $${order.stop_price}`
                    : order.trail_price
                      ? `Trailing $${order.trail_price}`
                      : order.trail_percent
                        ? `Trailing ${order.trail_percent}%`
                        : 'Ejecución a mercado'}
              </span>
            </div>
            <div className={styles.detailTile}>
              <span className={styles.detailTileLabel}>Estado operativo</span>
              <span className={styles.detailTileValue}>
                {formatOrderCause(order.status_cause ?? order.provider_status)}
              </span>
            </div>
            {order.scheduled_for && (
              <div className={styles.detailTile}>
                <span className={styles.detailTileLabel}>Programada para</span>
                <span className={styles.detailTileValue}>
                  {new Date(order.scheduled_for).toLocaleString('es-CO')}
                </span>
              </div>
            )}
          </div>

          {order.legs.length > 0 && (
            <div className={styles.detailGrid}>
              {order.legs.map((leg) => (
                <div key={leg.role} className={styles.detailTile}>
                  <span className={styles.detailTileLabel}>
                    {LEG_LABELS[leg.role]}
                  </span>
                  <span className={styles.detailTileValue}>
                    ${leg.price} USD ·{' '}
                    {leg.provider_status
                      ? formatOrderCause(leg.provider_status)
                      : 'Pendiente'}
                  </span>
                </div>
              ))}
            </div>
          )}

          {order.review_comments.map((comment) => (
            <div key={comment.id} className={styles.commentBox}>
              <strong>Comentario del comisionista:</strong> {comment.comment}
            </div>
          ))}

          {pending && (
            <div className={styles.orderPreview}>
              <div className={styles.previewHeader}>
                <h3 className={styles.previewTitle}>
                  Reautorización por cambio de precio
                </h3>
              </div>
              <p className={styles.cardSubtitle}>
                Reautorización: precio anterior ${pending.previous_price} →
                nuevo ${pending.updated_price} USD
              </p>
              <p className={styles.previewNote}>
                Vence: {new Date(pending.deadline).toLocaleString('es-CO')}
              </p>
            </div>
          )}

          <div className={styles.actionsRow}>
            {!order.fully_filled &&
              !['CANCELED', 'REJECTED', 'EXPIRED', 'FAILED'].includes(
                order.status,
              ) && (
                <button
                  type="button"
                  disabled={busy}
                  className={styles.btnDanger}
                  onClick={() => setAction('cancel')}
                >
                  Cancelar orden
                </button>
              )}
            {order.status === 'HELD' && pending && (
              <>
                <button
                  type="button"
                  disabled={busy}
                  className={styles.btnPrimary}
                  onClick={() => setAction('accept')}
                >
                  Aceptar nuevo precio
                </button>
                <button
                  type="button"
                  disabled={busy}
                  className={styles.btnSecondary}
                  onClick={() => setAction('reject')}
                >
                  Rechazar nuevo precio
                </button>
              </>
            )}
            {order.status === 'PENDING' && order.returned_for_changes && (
              <button
                type="button"
                disabled={busy}
                className={styles.btnSecondary}
                onClick={() => onEdit(order)}
              >
                Corregir y reenviar
              </button>
            )}
            {order.status === 'IN_REVIEW' &&
              order.status_cause === 'schedule_change' && (
                <button
                  type="button"
                  disabled={busy}
                  className={styles.btnPrimary}
                  onClick={() => setAction('resume')}
                >
                  Reanudar orden
                </button>
              )}
          </div>

          {action && (
            <OrderActionConfirmForm
              action={action}
              busy={busy}
              reason={reason}
              reasonText={reasonText}
              onReasonChange={setReason}
              onReasonTextChange={setReasonText}
              onConfirm={confirm}
              onCancel={() => setAction(null)}
            />
          )}

          <OrderHistoryPanels order={order} />
        </>
      )}

      {error && (
        <p role="alert" className={styles.alertError}>
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className={styles.alertBanner}>
          {notice}
        </p>
      )}
    </section>
  );
}
