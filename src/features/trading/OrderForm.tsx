'use client';
import { useRef, useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ApiError } from '@/lib/api';
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
        `Orden registrada: ${result.id}. Estado: ${result.status}${result.fully_filled ? ' · Ejecución completa' : ''}.`,
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
      <h2 className={styles.cardTitle}>
        {editing ? 'Corregir orden devuelta' : 'Comprar y vender'}
      </h2>
      <p className={styles.cardSubtitle}>
        Órdenes en USD · Alpaca sandbox. La vista previa es una estimación; la
        ejecución depende del mercado.
      </p>
      <form onSubmit={handleSubmit}>
        <fieldset className={styles.orderFields} disabled={busy}>
          {!editing && (
            <>
              <label className={styles.fieldGroup}>
                Bolsa de valores
                <select
                  className={styles.select}
                  value={exchange}
                  disabled={markets.isPending || markets.isError}
                  onChange={(e) => {
                    setExchange(e.target.value);
                    setSearch('');
                    setPage(1);
                    update({ symbol: '' });
                  }}
                >
                  <option value="">Todas las bolsas</option>
                  {markets.data?.map((market) => (
                    <option key={market.code} value={market.code}>
                      {market.name} ({market.code})
                    </option>
                  ))}
                </select>
              </label>
              {markets.isError && (
                <p role="alert">
                  No se pudieron cargar las bolsas.{' '}
                  <button
                    type="button"
                    className={styles.btnSecondary}
                    onClick={() => {
                      void markets.refetch();
                    }}
                  >
                    Reintentar
                  </button>
                </p>
              )}
              <label className={styles.fieldGroup}>
                Explorar por letra
                <select
                  className={styles.select}
                  value={letter}
                  disabled={Boolean(search.trim())}
                  onChange={(e) => {
                    setLetter(e.target.value);
                    setPage(1);
                    update({ symbol: '' });
                  }}
                >
                  {'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
                    .split('')
                    .map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                </select>
              </label>
              <label className={styles.fieldGroup}>
                Buscar acción por nombre o símbolo
                <input
                  className={styles.input}
                  value={search}
                  maxLength={50}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                    update({ symbol: '' });
                  }}
                />
              </label>
              <p className={styles.cardSubtitle}>
                Solo instrumentos negociables. Sin búsqueda, se muestran
                coincidencias de la letra seleccionada en el símbolo o nombre.
              </p>
              {assets.isFetching && <p role="status">Cargando acciones…</p>}
              {!assets.isFetching && assets.data?.total === 0 && (
                <p>No hay acciones para estos filtros.</p>
              )}
              {assets.isError && (
                <p role="alert">No se pudieron consultar los instrumentos.</p>
              )}
              <label className={styles.fieldGroup}>
                Instrumento
                <select
                  className={styles.select}
                  required
                  disabled={assets.isFetching || assets.isError}
                  value={draft.symbol}
                  onChange={(e) => update({ symbol: e.target.value })}
                >
                  <option value="">Selecciona un instrumento</option>
                  {draft.symbol &&
                    !assets.data?.results.some(
                      (a) => a.symbol === draft.symbol,
                    ) && <option value={draft.symbol}>{draft.symbol}</option>}
                  {assets.data?.results.map((asset) => (
                    <option key={asset.symbol} value={asset.symbol}>
                      {asset.symbol} · {asset.name} ({asset.exchange})
                    </option>
                  ))}
                </select>
              </label>
              <div className={styles.actionsRow}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  disabled={page === 1 || assets.isFetching}
                  onClick={() => setPage(page - 1)}
                >
                  Anterior
                </button>
                <span>
                  Página {page} · {assets.data?.total ?? 0} resultados
                </span>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  disabled={
                    assets.isFetching ||
                    !assets.data ||
                    page * assets.data.page_size >= assets.data.total
                  }
                  onClick={() => setPage(page + 1)}
                >
                  Siguiente
                </button>
              </div>
            </>
          )}
          {editing && (
            <p>
              {draft.symbol} · {draft.side === 'buy' ? 'Compra' : 'Venta'}
            </p>
          )}
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
              onChange={(e) => changeType(e.target.value as OrderInput['type'])}
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
                  time_in_force: e.target.value as OrderInput['time_in_force'],
                })
              }
            >
              <option value="day">DAY · Durante la sesión</option>
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
          {(draft.type === 'limit' || draft.type === 'stop_limit') && (
            <label className={styles.fieldGroup}>
              Precio límite (USD)
              <input
                className={styles.input}
                type="number"
                required
                min="0.0001"
                step="0.0001"
                value={draft.limit_price ?? ''}
                onChange={(e) => update({ limit_price: e.target.value })}
              />
            </label>
          )}
          {(draft.type === 'stop' || draft.type === 'stop_limit') && (
            <label className={styles.fieldGroup}>
              Precio de activación stop (USD)
              <input
                className={styles.input}
                type="number"
                required
                min="0.0001"
                step="0.0001"
                value={draft.stop_price ?? ''}
                onChange={(e) => update({ stop_price: e.target.value })}
              />
            </label>
          )}
          {draft.type === 'trailing_stop' && (
            <>
              <label className={styles.fieldGroup}>
                Distancia del trailing
                <select
                  className={styles.select}
                  value={draft.trail_price !== undefined ? 'price' : 'percent'}
                  onChange={(e) => {
                    const {
                      trail_price: _p,
                      trail_percent: _t,
                      ...rest
                    } = draft;
                    void _p;
                    void _t;
                    setDraft({
                      ...rest,
                      ...(e.target.value === 'price'
                        ? { trail_price: '' }
                        : { trail_percent: '' }),
                    });
                    setPreview(null);
                  }}
                >
                  <option value="percent">Porcentaje</option>
                  <option value="price">USD</option>
                </select>
              </label>
              <label className={styles.fieldGroup}>
                Distancia
                <input
                  className={styles.input}
                  type="number"
                  required
                  min={draft.trail_price !== undefined ? '0.0001' : '0.1'}
                  max={draft.trail_price !== undefined ? undefined : '50'}
                  step="0.0001"
                  value={draft.trail_price ?? draft.trail_percent ?? ''}
                  onChange={(e) =>
                    update(
                      draft.trail_price !== undefined
                        ? { trail_price: e.target.value }
                        : { trail_percent: e.target.value },
                    )
                  }
                />
              </label>
            </>
          )}
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
          {draft.order_class === 'bracket' && (
            <>
              <label className={styles.fieldGroup}>
                Take profit (USD)
                <input
                  className={styles.input}
                  required
                  type="number"
                  min="0.0001"
                  step="0.0001"
                  value={draft.take_profit?.limit_price ?? ''}
                  onChange={(e) =>
                    update({ take_profit: { limit_price: e.target.value } })
                  }
                />
              </label>
              <label className={styles.fieldGroup}>
                Stop loss (USD)
                <input
                  className={styles.input}
                  required
                  type="number"
                  min="0.0001"
                  step="0.0001"
                  value={draft.stop_loss?.stop_price ?? ''}
                  onChange={(e) =>
                    update({ stop_loss: { stop_price: e.target.value } })
                  }
                />
              </label>
            </>
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
            <div
              className={styles.orderPreview}
              aria-label="Vista previa de la orden"
            >
              <p>Precio de referencia: ${preview.reference_price} USD</p>
              <p>Importe estimado: ${preview.estimated_amount} USD</p>
              <p>
                Comisión de referencia estimada: ${preview.reference_commission}{' '}
                USD
              </p>
              <p>
                Poder de compra disponible: ${preview.available_buying_power}{' '}
                USD
              </p>
              <p>
                Mercado {preview.market_open ? 'abierto' : 'cerrado'}
                {preview.scheduled_for
                  ? ` · Programada: ${new Date(preview.scheduled_for).toLocaleString('es-CO')}`
                  : ''}
              </p>
              {preview.authorization_method === 'acknowledgement' && (
                <label className={styles.checkRow}>
                  <input
                    type="checkbox"
                    required
                    checked={ack}
                    onChange={(e) => setAck(e.target.checked)}
                  />
                  Autorizo expresamente esta operación de monto elevado
                </label>
              )}
              {preview.authorization_method === 'totp' && (
                <label className={styles.fieldGroup}>
                  Código MFA
                  <input
                    className={styles.input}
                    required
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    autoComplete="one-time-code"
                    value={totp}
                    onChange={(e) => setTotp(e.target.value)}
                  />
                </label>
              )}
              <p>Confirma los datos antes de enviar la orden.</p>
            </div>
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
        <p role="alert" className={styles.apiError}>
          {error}
        </p>
      )}
      {notice && <p role="status">{notice}</p>}
    </section>
  );
}
