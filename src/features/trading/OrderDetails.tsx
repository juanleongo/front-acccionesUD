'use client';

import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LoadingState } from '@/components/ui/LoadingState';
import { QUERY_STALE_TIMES, queryKeys } from '@/lib/api';
import { formatMarketDateTime } from '@/lib/formatters';
import { useLocale } from '@/lib/i18n';
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
  const { locale, tx } = useLocale();
  const query = useQuery({
    queryKey: queryKeys.orders.detail(id),
    queryFn: ({ signal }) => getOrder(id, signal),
    staleTime: QUERY_STALE_TIMES.realtime,
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
        tx(
          `Solicitud procesada correctamente. Estado: ${formatOrderStatus(result.status, result.fully_filled, locale)} (${result.status}).`,
          `Request processed successfully. Status: ${formatOrderStatus(result.status, result.fully_filled, locale)} (${result.status}).`,
        ),
      );
      setAction(null);
      await query.refetch();
      onUpdated();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : tx(
              'No se pudo procesar la solicitud.',
              'Could not process the request.',
            ),
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
    <section
      className={styles.card}
      aria-label={tx('Detalle de orden', 'Order details')}
    >
      <div className={styles.cardHeader}>
        <div>
          <h2 className={styles.cardTitle}>
            {tx('Detalle de orden', 'Order details')}
            {order ? ` · ${order.symbol}` : ''}
          </h2>
          {order && (
            <p className={styles.cardSubtitle}>
              {order.side === 'buy'
                ? tx('Compra de', 'Buy')
                : tx('Venta de', 'Sell')}{' '}
              {order.qty} {tx('acciones', 'shares')} ·{' '}
              {formatTimeInForce(order.time_in_force, locale)}
            </p>
          )}
        </div>
        <div className={styles.actionsRow}>
          {order && (
            <span className={`${styles.statusBadge} ${TONE_CLASS_MAP[tone]}`}>
              {formatOrderStatus(order.status, order.fully_filled, locale)}
            </span>
          )}
          <button
            type="button"
            disabled={busy}
            className={styles.btnCompact}
            onClick={onClose}
          >
            {tx('Cerrar detalle', 'Close details')}
          </button>
        </div>
      </div>

      {query.isPending && (
        <LoadingState
          mode="compact"
          label={tx('Consultando orden…', 'Loading order…')}
        />
      )}

      {query.isError && (
        <div role="alert" className={styles.alertError}>
          <span>
            {tx(
              'No se pudo consultar el detalle.',
              'Could not load order details.',
            )}
          </span>
          <button
            type="button"
            className={styles.btnCompact}
            onClick={() => {
              void query.refetch();
            }}
          >
            {tx('Reintentar', 'Retry')}
          </button>
        </div>
      )}

      {order && (
        <>
          <div className={styles.detailGrid}>
            <div className={styles.detailTile}>
              <span className={styles.detailTileLabel}>
                {tx('Ejecutadas', 'Filled')}
              </span>
              <span className={styles.detailTileValue}>
                {order.filled_qty} / {order.qty} {tx('acciones', 'shares')}
              </span>
            </div>
            <div className={styles.detailTile}>
              <span className={styles.detailTileLabel}>
                {tx('Precio promedio', 'Average fill price')}
              </span>
              <span className={styles.detailTileValue}>
                {order.filled_avg_price
                  ? `$${order.filled_avg_price} USD`
                  : tx('No disponible', 'Not available')}
              </span>
            </div>
            <div className={styles.detailTile}>
              <span className={styles.detailTileLabel}>
                {tx('Condiciones', 'Conditions')}
              </span>
              <span className={styles.detailTileValue}>
                {order.limit_price
                  ? `${tx('Límite', 'Limit')} $${order.limit_price}`
                  : order.stop_price
                    ? `Stop $${order.stop_price}`
                    : order.trail_price
                      ? `Trailing $${order.trail_price}`
                      : order.trail_percent
                        ? `Trailing ${order.trail_percent}%`
                        : tx('Ejecución a mercado', 'Market execution')}
              </span>
            </div>
            <div className={styles.detailTile}>
              <span className={styles.detailTileLabel}>
                {tx('Estado operativo', 'Operational status')}
              </span>
              <span className={styles.detailTileValue}>
                {formatOrderCause(
                  order.status_cause ?? order.provider_status,
                  locale,
                )}
              </span>
            </div>
            {order.scheduled_for && (
              <div className={styles.detailTile}>
                <span className={styles.detailTileLabel}>
                  {tx('Programada para', 'Scheduled for')}
                </span>
                <span className={styles.detailTileValue}>
                  {formatMarketDateTime(order.scheduled_for, locale)}
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
                      ? formatOrderCause(leg.provider_status, locale)
                      : tx('Pendiente', 'Pending')}
                  </span>
                </div>
              ))}
            </div>
          )}

          {order.review_comments.map((comment) => (
            <div key={comment.id} className={styles.commentBox}>
              <strong>
                {tx('Comentario del comisionista:', 'Broker note:')}
              </strong>{' '}
              {comment.comment}
            </div>
          ))}

          {pending && (
            <div className={styles.orderPreview}>
              <div className={styles.previewHeader}>
                <h3 className={styles.previewTitle}>
                  {tx(
                    'Reautorización por cambio de precio',
                    'Price change reauthorization',
                  )}
                </h3>
              </div>
              <p className={styles.cardSubtitle}>
                {tx(
                  `Reautorización: precio anterior $${pending.previous_price} → nuevo $${pending.updated_price} USD`,
                  `Reauthorization: previous price $${pending.previous_price} → updated $${pending.updated_price} USD`,
                )}
              </p>
              <p className={`${styles.previewNote} ${styles.tabularNum}`}>
                {tx('Vence:', 'Expires:')}{' '}
                {formatMarketDateTime(pending.deadline, locale)}
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
                  {tx('Cancelar orden', 'Cancel order')}
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
                  {tx('Aceptar nuevo precio', 'Accept updated price')}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  className={styles.btnSecondary}
                  onClick={() => setAction('reject')}
                >
                  {tx('Rechazar nuevo precio', 'Reject updated price')}
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
                {tx('Corregir y reenviar', 'Edit & resubmit')}
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
                  {tx('Reanudar orden', 'Resume order')}
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
