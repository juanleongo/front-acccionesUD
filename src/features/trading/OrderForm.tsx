'use client';

import { useRef, useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ApiError } from '@/lib/api';
import { InstrumentSelector } from './components/InstrumentSelector';
import { OrderParametersFields } from './components/OrderParametersFields';
import { OrderPreviewCard } from './components/OrderPreviewCard';
import {
  previewOrder,
  submitOrder,
  orderAction,
  resubmitBody,
  searchAssets,
  listTradingMarkets,
  type OrderInput,
  type OrderDetail,
  type Preview,
} from './trading-api';
import { formatOrderStatus } from './trading-labels';
import styles from './trading.module.css';

export const orderTypeLabels = {
  market: 'Mercado',
  limit: 'Límite / take profit simple',
  stop: 'Stop loss',
  stop_limit: 'Stop-limit',
  trailing_stop: 'Trailing stop',
};

export function OrderForm({
  initialSymbol,
  editing,
  onOrderCreated,
  onStopEditing,
}: {
  initialSymbol?: string | undefined;
  editing?: OrderDetail | undefined;
  onOrderCreated: (order: OrderDetail) => void;
  onStopEditing?: () => void;
}) {
  const [draft, setDraft] = useState<OrderInput>(() =>
    editing
      ? {
          symbol: editing.symbol,
          side: editing.side,
          qty: editing.qty,
          type: editing.type,
          order_class: editing.order_class,
          time_in_force: editing.time_in_force,
          ...(editing.limit_price ? { limit_price: editing.limit_price } : {}),
          ...(editing.stop_price ? { stop_price: editing.stop_price } : {}),
          ...(editing.trail_price ? { trail_price: editing.trail_price } : {}),
          ...(editing.trail_percent
            ? { trail_percent: editing.trail_percent }
            : {}),
          ...(editing.order_class === 'bracket'
            ? {
                take_profit: {
                  limit_price:
                    editing.legs.find((l) => l.role === 'take_profit')?.price ??
                    '',
                },
                stop_loss: {
                  stop_price:
                    editing.legs.find((l) => l.role === 'stop_loss')?.price ??
                    '',
                },
              }
            : {}),
          schedule_if_closed: Boolean(editing.scheduled_for),
        }
      : {
          symbol: initialSymbol ?? '',
          side: 'buy',
          qty: '1',
          type: 'market',
          order_class: 'simple',
          time_in_force: 'day',
          schedule_if_closed: false,
        },
  );
  const [search, setSearch] = useState(initialSymbol ?? '');
  const [exchange, setExchange] = useState('');
  const [letter, setLetter] = useState('A');
  const markets = useQuery({
    queryKey: ['trading-markets'],
    queryFn: ({ signal }) => listTradingMarkets(signal),
    enabled: !editing,
    retry: false,
  });
  const query = search.trim() || letter;
  const [page, setPage] = useState(1);
  const assets = useQuery({
    queryKey: ['trading-assets', query, exchange, page],
    queryFn: ({ signal }) => searchAssets(query, page, signal, exchange),
    enabled: !editing,
    retry: false,
  });
  const [preview, setPreview] = useState<Preview | null>(null);
  const [ack, setAck] = useState(false);
  const [totp, setTotp] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const flight = useRef(false);
  const attempt = useRef<{ fingerprint: string; key: string } | null>(null);

  function update(changes: Partial<OrderInput>) {
    setDraft((previous) => ({ ...previous, ...changes }));
    setPreview(null);
    setAck(false);
    setTotp('');
    setError('');
    setNotice('');
  }

  function changeType(type: OrderInput['type']) {
    const {
      limit_price: _l,
      stop_price: _s,
      trail_price: _t,
      trail_percent: _p,
      take_profit: _tp,
      stop_loss: _sl,
      ...base
    } = draft;
    void _l;
    void _s;
    void _t;
    void _p;
    void _tp;
    void _sl;
    setDraft({ ...base, type, order_class: 'simple', time_in_force: 'day' });
    setPreview(null);
    setAck(false);
    setTotp('');
  }

  function switchTrailMode(mode: 'price' | 'percent') {
    const { trail_price: _p, trail_percent: _t, ...rest } = draft;
    void _p;
    void _t;
    setDraft({
      ...rest,
      ...(mode === 'price' ? { trail_price: '' } : { trail_percent: '' }),
    });
    setPreview(null);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (flight.current) return;
    if (!draft.symbol) {
      setError('Selecciona un instrumento.');
      return;
    }
    flight.current = true;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      if (!preview) {
        setPreview(await previewOrder(draft));
        return;
      }
      if (preview.authorization_method === 'acknowledgement' && !ack) {
        setError('Confirma la autorización por monto elevado.');
        return;
      }
      if (preview.authorization_method === 'totp' && !/^\d{6}$/.test(totp)) {
        setError('Ingresa el código MFA de seis dígitos.');
        return;
      }
      const body = {
        ...draft,
        confirmed: true,
        high_amount_acknowledged: ack,
        ...(totp ? { totp_code: totp } : {}),
      };
      const fingerprint = JSON.stringify({
        ...draft,
        high_amount_acknowledged: ack,
      });
      if (attempt.current?.fingerprint !== fingerprint)
        attempt.current = { fingerprint, key: crypto.randomUUID() };
      const result = editing
        ? await orderAction(editing.id, 'resubmit', resubmitBody(body))
        : await submitOrder(body, attempt.current.key);
      setNotice(
        `Orden registrada correctamente. Estado: ${formatOrderStatus(result.status, result.fully_filled)} (${result.status}).`,
      );
      setPreview(null);
      setTotp('');
      setAck(false);
      attempt.current = null;
      onOrderCreated(result);
    } catch (cause) {
      setError(
        cause instanceof ApiError && cause.metadata.timeout
          ? preview
            ? 'El servidor no confirmó el resultado en 60 segundos. Consulta el historial antes de volver a enviar. Reintentar sin cambiar los datos reutiliza la clave de la orden para evitar duplicados.'
            : 'La vista previa no respondió en 60 segundos. Esta consulta no envía órdenes. Puedes volver a consultar la vista previa.'
          : cause instanceof Error
            ? cause.message
            : 'No se pudo procesar la orden.',
      );
    } finally {
      flight.current = false;
      setBusy(false);
    }
  }

  return (
    <section className={styles.card}>
      <div className={styles.cardHeader}>
        <div>
          <h2 className={styles.cardTitle}>
            {editing ? 'Corregir orden devuelta' : 'Comprar y vender'}
          </h2>
          <p className={styles.cardSubtitle}>
            Operaciones bursátiles en USD · La vista previa es una estimación y
            la ejecución depende del mercado.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <fieldset className={styles.orderFields} disabled={busy}>
          {!editing ? (
            <InstrumentSelector
              exchange={exchange}
              letter={letter}
              search={search}
              page={page}
              symbol={draft.symbol}
              markets={markets.data ?? []}
              marketsPending={markets.isPending}
              marketsError={markets.isError}
              assets={assets.data?.results ?? []}
              total={assets.data?.total ?? 0}
              pageSize={assets.data?.page_size ?? 20}
              isError={assets.isError}
              isFetching={assets.isFetching}
              onExchangeChange={(nextExchange) => {
                setExchange(nextExchange);
                setSearch('');
                setPage(1);
                update({ symbol: '' });
              }}
              onRetryMarkets={() => {
                void markets.refetch();
              }}
              onLetterChange={(nextLetter) => {
                setLetter(nextLetter);
                setPage(1);
                update({ symbol: '' });
              }}
              onSearchChange={(nextSearch) => {
                setSearch(nextSearch);
                setPage(1);
                update({ symbol: '' });
              }}
              onPageChange={setPage}
              onSymbolChange={(nextSymbol) => update({ symbol: nextSymbol })}
            />
          ) : (
            <div className={styles.editingBanner}>
              <span>
                Editando orden: {draft.symbol} ·{' '}
                {draft.side === 'buy' ? 'Compra' : 'Venta'}
              </span>
            </div>
          )}

          <div className={styles.fieldGrid}>
            <label className={styles.fieldGroup}>
              Operación
              <select
                className={styles.select}
                disabled={Boolean(editing) || draft.order_class === 'bracket'}
                value={draft.side}
                onChange={(e) =>
                  update({ side: e.target.value as 'buy' | 'sell' })
                }
              >
                <option value="buy">Comprar</option>
                <option value="sell">Vender</option>
              </select>
            </label>

            <label className={styles.fieldGroup}>
              Tipo de orden
              <select
                className={styles.select}
                disabled={Boolean(editing)}
                value={draft.type}
                onChange={(e) =>
                  changeType(e.target.value as OrderInput['type'])
                }
              >
                {Object.entries(orderTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.fieldGroup}>
              Cantidad de acciones
              <input
                className={styles.input}
                required
                type="number"
                min={
                  draft.order_class === 'bracket' ||
                  draft.type === 'trailing_stop'
                    ? '1'
                    : '0.000000001'
                }
                step={
                  draft.order_class === 'bracket' ||
                  draft.type === 'trailing_stop'
                    ? '1'
                    : '0.000000001'
                }
                value={draft.qty}
                onChange={(e) => update({ qty: e.target.value })}
              />
            </label>

            <label className={styles.fieldGroup}>
              Vigencia
              <select
                className={styles.select}
                value={draft.time_in_force}
                onChange={(e) =>
                  update({
                    time_in_force: e.target
                      .value as OrderInput['time_in_force'],
                  })
                }
              >
                <option value="day">Día · Durante la sesión</option>
                <option value="gtc">GTC · Hasta cancelación</option>
                {draft.type !== 'trailing_stop' &&
                  draft.order_class !== 'bracket' && (
                    <>
                      <option value="ioc">IOC · Inmediata o cancelar</option>
                      <option value="fok">FOK · Completa o cancelar</option>
                    </>
                  )}
              </select>
            </label>

            <OrderParametersFields
              draft={draft}
              onUpdate={update}
              onSwitchTrailMode={switchTrailMode}
            />
          </div>

          {!editing && (draft.type === 'market' || draft.type === 'limit') && (
            <label className={styles.checkRow}>
              <input
                type="checkbox"
                checked={draft.order_class === 'bracket'}
                onChange={(e) => {
                  const { take_profit: _tp, stop_loss: _sl, ...base } = draft;
                  void _tp;
                  void _sl;
                  setDraft({
                    ...base,
                    side: e.target.checked ? 'buy' : base.side,
                    order_class: e.target.checked ? 'bracket' : 'simple',
                    time_in_force: 'day',
                    ...(e.target.checked
                      ? {
                          take_profit: { limit_price: '' },
                          stop_loss: { stop_price: '' },
                        }
                      : {}),
                  });
                  setPreview(null);
                  setAck(false);
                  setTotp('');
                }}
              />
              Compra bracket: take profit y stop loss
            </label>
          )}

          <label className={styles.checkRow}>
            <input
              type="checkbox"
              disabled={Boolean(editing)}
              checked={draft.schedule_if_closed}
              onChange={(e) => update({ schedule_if_closed: e.target.checked })}
            />
            Programar para la próxima apertura si el mercado está cerrado
          </label>

          {preview && (
            <OrderPreviewCard
              preview={preview}
              ack={ack}
              totp={totp}
              onAckChange={setAck}
              onTotpChange={setTotp}
            />
          )}

          <div className={styles.actionsRow}>
            <button type="submit" className={styles.btnPrimary}>
              {busy
                ? 'Procesando…'
                : preview
                  ? editing
                    ? 'Confirmar corrección y reenviar'
                    : 'Confirmar y enviar orden'
                  : 'Consultar vista previa'}
            </button>
            {preview && (
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => {
                  setPreview(null);
                  setAck(false);
                  setTotp('');
                }}
              >
                Volver a revisar
              </button>
            )}
            {editing && (
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={onStopEditing}
              >
                Salir de la corrección
              </button>
            )}
          </div>
        </fieldset>
      </form>

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
