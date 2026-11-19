'use client';
import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getOrder, orderAction, type OrderDetail } from './trading-api';
import styles from './trading.module.css';
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
  const [action, setAction] = useState<
    'cancel' | 'accept' | 'reject' | 'resume' | null
  >(null);
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
      setNotice(`Solicitud procesada. Estado: ${result.status}.`);
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
  return (
    <section className={styles.card} aria-label="Detalle de orden">
      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>Detalle de orden</h2>
        <button
          type="button"
          disabled={busy}
          className={styles.btnSecondary}
          onClick={onClose}
        >
          Cerrar detalle
        </button>
      </div>
      {query.isPending && <p role="status">Consultando orden…</p>}
      {query.isError && (
        <p role="alert">
          No se pudo consultar el detalle.{' '}
          <button
            type="button"
            onClick={() => {
              void query.refetch();
            }}
          >
            Reintentar
          </button>
        </p>
      )}
      {order && (
        <>
          <p>
            {order.symbol} · {order.side === 'buy' ? 'Compra' : 'Venta'} ·{' '}
            {order.qty} acciones · {order.status}
          </p>
          <p>Referencia: {order.id}</p>
          <p>
            Ejecutadas: {order.filled_qty} · Precio promedio:{' '}
            {order.filled_avg_price ?? 'No disponible'} USD
          </p>
          <p>
            Causa: {order.status_cause ?? '—'} · Proveedor:{' '}
            {order.provider_status ?? '—'}
          </p>
          {order.scheduled_for && (
            <p>
              Programada para{' '}
              {new Date(order.scheduled_for).toLocaleString('es-CO')}
            </p>
          )}
          <p>
            Límite: {order.limit_price ?? '—'} · Stop: {order.stop_price ?? '—'}{' '}
            · Trailing:{' '}
            {order.trail_price
              ? `${order.trail_price} USD`
              : order.trail_percent
                ? `${order.trail_percent}%`
                : '—'}{' '}
            · Vigencia: {order.time_in_force.toUpperCase()}
          </p>
          {order.legs.map((leg) => (
            <p key={leg.role}>
              {leg.role}: ${leg.price} · {leg.provider_status ?? 'Pendiente'}
            </p>
          ))}
          {order.review_comments.map((comment) => (
            <p key={comment.id}>
              Comentario del comisionista: {comment.comment}
            </p>
          ))}
          {pending && (
            <div className={styles.orderPreview}>
              <p>
                Reautorización: precio anterior ${pending.previous_price} →
                nuevo ${pending.updated_price} USD
              </p>
              <p>Vence: {new Date(pending.deadline).toLocaleString('es-CO')}</p>
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
            <form
              className={styles.orderPreview}
              onSubmit={(event) => {
                event.preventDefault();
                void confirm();
              }}
            >
              <fieldset disabled={busy} className={styles.orderFields}>
                <p>
                  ¿Confirmas{' '}
                  {action === 'cancel'
                    ? 'la solicitud de cancelación'
                    : action === 'resume'
                      ? 'la reanudación'
                      : action === 'accept'
                        ? 'la aceptación del nuevo precio'
                        : 'el rechazo del nuevo precio'}
                  ?
                </p>
                {action === 'cancel' && (
                  <>
                    <label className={styles.fieldGroup}>
                      Motivo
                      <select
                        className={styles.select}
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                      >
                        <option value="no_longer_needed">
                          Ya no la necesito
                        </option>
                        <option value="price_changed">Cambió el precio</option>
                        <option value="input_error">Error en los datos</option>
                        <option value="other">Otro motivo</option>
                      </select>
                    </label>
                    {reason === 'other' && (
                      <label className={styles.fieldGroup}>
                        Describe el motivo
                        <input
                          className={styles.input}
                          required
                          maxLength={500}
                          value={reasonText}
                          onChange={(e) => setReasonText(e.target.value)}
                        />
                      </label>
                    )}
                  </>
                )}
                <div className={styles.actionsRow}>
                  <button type="submit" className={styles.btnPrimary}>
                    {busy ? 'Procesando…' : 'Confirmar acción'}
                  </button>
                  <button
                    type="button"
                    className={styles.btnSecondary}
                    onClick={() => setAction(null)}
                  >
                    Volver
                  </button>
                </div>
              </fieldset>
            </form>
          )}
          <details>
            <summary>Ejecuciones ({order.executions.length})</summary>
            {order.executions.map((item) => (
              <p key={item.alpaca_execution_id}>
                {item.qty} acciones a ${item.price} ·{' '}
                {new Date(item.executed_at).toLocaleString('es-CO')}
              </p>
            ))}
          </details>
          <details>
            <summary>Historial de estados ({order.events.length})</summary>
            {order.events.map((event) => (
              <p key={event.id}>
                {new Date(event.at).toLocaleString('es-CO')} · {event.to_status}{' '}
                · {event.cause}
              </p>
            ))}
          </details>
        </>
      )}
      {error && (
        <p role="alert" className={styles.apiError}>
          {error}
        </p>
      )}
      {notice && <p role="status">{notice}</p>}
    </section>
  );
}
