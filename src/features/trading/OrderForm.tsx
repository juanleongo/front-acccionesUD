'use client';

import { useRef, useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { ApiError, QUERY_STALE_TIMES, queryKeys } from '@/lib/api';
import { useLocale } from '@/lib/i18n';
import { InstrumentSelector } from './components/InstrumentSelector';
import { OrderParametersFields } from './components/OrderParametersFields';
import { OrderPreviewCard } from './components/OrderPreviewCard';
import { InstrumentQuoteCard } from './components/InstrumentQuoteCard';
import { OrderEstimateCard } from './components/OrderEstimateCard';
import { OrderBudgetCalculator } from './components/OrderBudgetCalculator';
import { isOrderWithinBudget, type OrderBudget } from './order-budget';
import { estimateInput } from './order-estimate';
import { getOrderTypeHelp } from './order-type-help';
import guidance from './order-guidance.module.css';
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
import {
  formatOrderStatus,
  getOrderTypeLabels,
  orderTypeLabels,
} from './trading-labels';
import styles from './trading.module.css';

export { getOrderTypeLabels, orderTypeLabels };

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
  const { locale, tx } = useLocale();
  const typeLabels = getOrderTypeLabels(locale);
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
    queryKey: queryKeys.markets.list(),
    queryFn: ({ signal }) => listTradingMarkets(signal),
    staleTime: QUERY_STALE_TIMES.catalog,
    enabled: !editing,
    retry: false,
  });
  const query = search.trim() || letter;
  const [page, setPage] = useState(1);
  const assets = useQuery({
    queryKey: queryKeys.instruments.search(query, exchange, page),
    queryFn: ({ signal }) => searchAssets(query, page, signal, exchange),
    staleTime: QUERY_STALE_TIMES.catalog,
    enabled: !editing,
    retry: false,
  });
  const [budgetCap, setBudgetCap] = useState<
    (OrderBudget & { input: string }) | null
  >(null);
  const activeBudget =
    budgetCap?.input === JSON.stringify(estimateInput(draft))
      ? budgetCap
      : null;
  const [amountEntry, setAmountEntry] = useState(false);
  const [estimateTouched, setEstimateTouched] = useState(Boolean(editing));
  const [preview, setPreview] = useState<Preview | null>(null);
  const [ack, setAck] = useState(false);
  const [totp, setTotp] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const flight = useRef(false);
  const attempt = useRef<{ fingerprint: string; key: string } | null>(null);

  function resetReview() {
    setPreview(null);
    setAck(false);
    setTotp('');
    setError('');
    setNotice('');
  }

  function update(changes: Partial<OrderInput>) {
    if ('symbol' in changes || 'side' in changes) {
      setAmountEntry(false);
      setEstimateTouched(false);
    } else if (
      'qty' in changes ||
      'limit_price' in changes ||
      'stop_price' in changes ||
      'trail_price' in changes ||
      'trail_percent' in changes
    )
      setEstimateTouched(true);
    setDraft((previous) => ({ ...previous, ...changes }));
    resetReview();
  }

  function changeType(type: OrderInput['type']) {
    setEstimateTouched(true);
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
    resetReview();
  }

  function switchTrailMode(mode: 'price' | 'percent') {
    const { trail_price: _p, trail_percent: _t, ...rest } = draft;
    void _p;
    void _t;
    setDraft({
      ...rest,
      ...(mode === 'price' ? { trail_price: '' } : { trail_percent: '' }),
    });
    resetReview();
  }

  function validateOrderDraft(): string | null {
    if (!draft.symbol)
      return tx('Selecciona un instrumento.', 'Select an instrument.');
    const qtyNum = Number(draft.qty);
    if (!draft.qty.trim() || !Number.isFinite(qtyNum) || qtyNum <= 0) {
      return tx(
        'Ingresa una cantidad válida de acciones mayor a cero.',
        'Enter a valid share quantity greater than zero.',
      );
    }
    const wholeRequired =
      draft.order_class === 'bracket' || draft.type === 'trailing_stop';
    if (wholeRequired && (!Number.isInteger(qtyNum) || qtyNum < 1)) {
      return tx(
        'Las órdenes bracket y trailing stop requieren una cantidad entera mínima de 1 acción.',
        'Bracket and trailing stop orders require an integer quantity of at least 1 share.',
      );
    }
    if (draft.type === 'limit' || draft.type === 'stop_limit') {
      const limitNum = Number(draft.limit_price);
      if (
        !draft.limit_price?.trim() ||
        !Number.isFinite(limitNum) ||
        limitNum <= 0
      ) {
        return tx(
          'Ingresa un precio límite válido mayor a cero.',
          'Enter a valid limit price greater than zero.',
        );
      }
    }
    if (draft.type === 'stop' || draft.type === 'stop_limit') {
      const stopNum = Number(draft.stop_price);
      if (
        !draft.stop_price?.trim() ||
        !Number.isFinite(stopNum) ||
        stopNum <= 0
      ) {
        return tx(
          'Ingresa un precio de activación stop válido mayor a cero.',
          'Enter a valid stop trigger price greater than zero.',
        );
      }
    }
    if (draft.type === 'trailing_stop') {
      if (draft.trail_price !== undefined) {
        const trailNum = Number(draft.trail_price);
        if (
          !draft.trail_price.trim() ||
          !Number.isFinite(trailNum) ||
          trailNum <= 0
        ) {
          return tx(
            'Ingresa una distancia en USD válida mayor a cero.',
            'Enter a valid USD trailing distance greater than zero.',
          );
        }
      } else {
        const pctNum = Number(draft.trail_percent);
        if (
          !draft.trail_percent?.trim() ||
          !Number.isFinite(pctNum) ||
          pctNum < 0.1 ||
          pctNum > 50
        ) {
          return tx(
            'Ingresa un porcentaje de trailing válido entre 0.1% y 50%.',
            'Enter a valid trailing percentage between 0.1% and 50%.',
          );
        }
      }
    }
    if (draft.order_class === 'bracket') {
      const tp = Number(draft.take_profit?.limit_price);
      const sl = Number(draft.stop_loss?.stop_price);
      if (
        !draft.take_profit?.limit_price?.trim() ||
        !Number.isFinite(tp) ||
        tp <= 0 ||
        !draft.stop_loss?.stop_price?.trim() ||
        !Number.isFinite(sl) ||
        sl <= 0
      ) {
        return tx(
          'Ingresa precios válidos de take profit y stop loss mayores a cero.',
          'Enter valid take profit and stop loss prices greater than zero.',
        );
      }
    }
    return null;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (flight.current || (amountEntry && !activeBudget)) return;
    const validationError = validateOrderDraft();
    if (validationError) {
      setError(validationError);
      return;
    }
    flight.current = true;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      if (!preview) {
        const next = await previewOrder(draft);
        if (activeBudget && !isOrderWithinBudget(draft, next, activeBudget)) {
          setError(
            tx(
              'La compra supera el monto elegido. Vuelve a calcular la cantidad antes de confirmar.',
              'The purchase exceeds the chosen amount. Recalculate the quantity before confirming.',
            ),
          );
          return;
        }
        setPreview(next);
        return;
      }
      if (preview.authorization_method === 'acknowledgement' && !ack) {
        setError(
          tx(
            'Confirma la autorización por monto elevado.',
            'Confirm high-amount transaction authorization.',
          ),
        );
        return;
      }
      if (preview.authorization_method === 'totp' && !/^\d{6}$/.test(totp)) {
        setError(
          tx(
            'Ingresa el código MFA de seis dígitos.',
            'Enter the six-digit MFA code.',
          ),
        );
        return;
      }
      if (activeBudget) {
        const checked = await previewOrder(draft);
        if (!isOrderWithinBudget(draft, checked, activeBudget)) {
          setPreview(null);
          setError(
            tx(
              'Los costos cambiaron y superan el presupuesto. Vuelve a calcular la cantidad.',
              'Costs changed and exceed your budget. Recalculate the quantity.',
            ),
          );
          return;
        }
        if (
          checked.estimated_amount !== preview.estimated_amount ||
          checked.reference_commission !== preview.reference_commission ||
          checked.authorization_method !== preview.authorization_method
        ) {
          setPreview(checked);
          setAck(false);
          setTotp('');
          setNotice(
            tx(
              'Los costos se actualizaron. Revisa el nuevo total y confirma de nuevo.',
              'Costs were updated. Review the new total and confirm again.',
            ),
          );
          return;
        }
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
        tx(
          `Orden registrada correctamente. Estado: ${formatOrderStatus(result.status, result.fully_filled, locale)} (${result.status}).`,
          `Order placed successfully. Status: ${formatOrderStatus(result.status, result.fully_filled, locale)} (${result.status}).`,
        ),
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
            ? tx(
                'El servidor no confirmó el resultado en 60 segundos. Consulta el historial antes de volver a enviar. Reintentar sin cambiar los datos reutiliza la clave de la orden para evitar duplicados.',
                'The server did not confirm within 60 seconds. Check order history before retrying. Retrying unchanged reuses the same idempotency key to avoid duplicates.',
              )
            : tx(
                'La vista previa no respondió en 60 segundos. Esta consulta no envía órdenes. Puedes volver a consultar la vista previa.',
                'The preview did not respond within 60 seconds. No order was placed. You may request a preview again.',
              )
          : cause instanceof Error
            ? cause.message
            : tx(
                'No se pudo procesar la orden.',
                'Could not process the order.',
              ),
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
            {editing
              ? tx('Corregir orden devuelta', 'Fix returned order')
              : tx('Comprar y vender', 'Buy & sell')}
          </h2>
          <p className={styles.cardSubtitle}>
            {tx(
              'Operaciones bursátiles en USD · La vista previa es una estimación y la ejecución depende del mercado.',
              'US equity trading in USD · Preview is an estimate and execution depends on market conditions.',
            )}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate>
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
                {tx('Editando orden:', 'Editing order:')} {draft.symbol} ·{' '}
                {draft.side === 'buy'
                  ? tx('Compra', 'Buy')
                  : tx('Venta', 'Sell')}
              </span>
            </div>
          )}

          {draft.symbol && (
            <InstrumentQuoteCard
              key={`quote-${draft.symbol}`}
              symbol={draft.symbol}
            />
          )}

          {!editing && draft.symbol && draft.side === 'buy' && (
            <OrderBudgetCalculator
              key={`budget-${draft.symbol}`}
              symbol={draft.symbol}
              scheduleIfClosed={draft.schedule_if_closed}
              onOpenChange={(value) => {
                setAmountEntry(value);
                resetReview();
              }}
              onReset={() => {
                setDraft((previous) =>
                  budgetCap?.input === JSON.stringify(estimateInput(previous))
                    ? { ...previous, qty: '' }
                    : previous,
                );
                setBudgetCap(null);
                resetReview();
              }}
              onApply={(input, budget) => {
                setDraft(input);
                setEstimateTouched(true);
                resetReview();
                setBudgetCap({
                  input: JSON.stringify(estimateInput(input)),
                  ...budget,
                });
              }}
            />
          )}

          {!amountEntry && (
            <>
              <div className={styles.fieldGrid}>
                <div className={styles.fieldGroup}>
                  <label htmlFor="order-side" className={styles.fieldLabel}>
                    {tx('Operación', 'Side')}
                  </label>
                  <CustomSelect
                    id="order-side"
                    disabled={
                      Boolean(editing) || draft.order_class === 'bracket'
                    }
                    value={draft.side}
                    onChange={(val) => update({ side: val as 'buy' | 'sell' })}
                    options={[
                      { value: 'buy', label: tx('Comprar', 'Buy') },
                      { value: 'sell', label: tx('Vender', 'Sell') },
                    ]}
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label htmlFor="order-type" className={styles.fieldLabel}>
                    {tx('Tipo de orden', 'Order type')}
                  </label>
                  <CustomSelect
                    id="order-type"
                    disabled={Boolean(editing)}
                    value={draft.type}
                    onChange={(val) => changeType(val as OrderInput['type'])}
                    options={Object.entries(typeLabels).map(
                      ([value, label]) => ({
                        value,
                        label,
                      }),
                    )}
                    describedBy="order-type-help"
                  />
                </div>

                <label className={styles.fieldGroup}>
                  <span id="order-quantity-label" className={styles.fieldLabel}>
                    {tx('Cantidad de acciones', 'Share quantity')}
                  </span>
                  <input
                    className={`${styles.input} ${styles.tabularNum}`}
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
                    aria-describedby="order-quantity-help"
                    aria-labelledby="order-quantity-label"
                  />
                  <span id="order-quantity-help" className={styles.fieldHint}>
                    {tx(
                      'Es el número de acciones, no el importe en dólares. 1 significa una acción.',
                      'This is the number of shares, not a dollar amount. 1 means one share.',
                    )}
                  </span>
                </label>

                <div className={styles.fieldGroup}>
                  <label htmlFor="order-tif" className={styles.fieldLabel}>
                    {tx('Vigencia', 'Time in force')}
                  </label>
                  <CustomSelect
                    id="order-tif"
                    value={draft.time_in_force}
                    onChange={(val) =>
                      update({
                        time_in_force: val as OrderInput['time_in_force'],
                      })
                    }
                    options={[
                      {
                        value: 'day',
                        label: tx(
                          'Día · Durante la sesión',
                          'DAY · Trading session',
                        ),
                      },
                      {
                        value: 'gtc',
                        label: tx(
                          'GTC · Hasta cancelación',
                          'GTC · Good til canceled',
                        ),
                      },
                      ...(draft.type !== 'trailing_stop' &&
                      draft.order_class !== 'bracket'
                        ? [
                            {
                              value: 'ioc',
                              label: tx(
                                'IOC · Inmediata o cancelar',
                                'IOC · Immediate or cancel',
                              ),
                            },
                            {
                              value: 'fok',
                              label: tx(
                                'FOK · Completa o cancelar',
                                'FOK · Fill or kill',
                              ),
                            },
                          ]
                        : []),
                    ]}
                  />
                </div>

                <OrderParametersFields
                  draft={draft}
                  onUpdate={update}
                  onSwitchTrailMode={switchTrailMode}
                />
              </div>

              <p id="order-type-help" className={guidance.help}>
                {getOrderTypeHelp(draft.type, draft.side, locale)}
              </p>

              {!editing &&
                (draft.type === 'market' || draft.type === 'limit') && (
                  <label className={styles.checkRow}>
                    <input
                      type="checkbox"
                      checked={draft.order_class === 'bracket'}
                      aria-label={tx(
                        'Compra bracket: take profit y stop loss',
                        'Bracket buy: take profit & stop loss',
                      )}
                      aria-describedby="order-bracket-help"
                      onChange={(e) => {
                        const {
                          take_profit: _tp,
                          stop_loss: _sl,
                          ...base
                        } = draft;
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
                        resetReview();
                      }}
                    />
                    <span className={guidance.checkText}>
                      <span>
                        {tx(
                          'Compra bracket: take profit y stop loss',
                          'Bracket buy: take profit & stop loss',
                        )}
                      </span>
                      <span
                        id="order-bracket-help"
                        className={guidance.checkHint}
                      >
                        {tx(
                          'Añade una salida con objetivo de beneficio y otra que se activa para limitar pérdidas. El stop no garantiza el precio de venta.',
                          'Adds a profit-target exit and a stop-triggered exit to limit losses. A stop does not guarantee the sale price.',
                        )}
                      </span>
                    </span>
                  </label>
                )}
            </>
          )}

          {(!amountEntry || activeBudget) && (
            <label className={styles.checkRow}>
              <input
                type="checkbox"
                disabled={Boolean(editing)}
                checked={draft.schedule_if_closed}
                aria-label={tx(
                  'Programar para la próxima apertura si el mercado está cerrado',
                  'Schedule for next market open if market is closed',
                )}
                aria-describedby="order-schedule-help"
                onChange={(e) => {
                  const next = {
                    ...draft,
                    schedule_if_closed: e.target.checked,
                  };
                  setDraft(next);
                  if (activeBudget)
                    setBudgetCap({
                      ...activeBudget,
                      input: JSON.stringify(estimateInput(next)),
                    });
                  resetReview();
                }}
              />
              <span className={guidance.checkText}>
                <span>
                  {tx(
                    'Programar para la próxima apertura si el mercado está cerrado',
                    'Schedule for next market open if market is closed',
                  )}
                </span>
                <span id="order-schedule-help" className={guidance.checkHint}>
                  {tx(
                    'Si no hay sesión disponible, solicita la siguiente apertura. No reserva la cotización ni fija el precio.',
                    'When the market is closed, request the next open. This does not lock in the quote or execution price.',
                  )}
                </span>
              </span>
            </label>
          )}

          {!amountEntry && !preview && !busy && !notice && (
            <OrderEstimateCard
              draft={draft}
              valid={estimateTouched && validateOrderDraft() === null}
            />
          )}

          {preview && (
            <OrderPreviewCard
              preview={preview}
              draft={draft}
              ack={ack}
              totp={totp}
              onAckChange={setAck}
              onTotpChange={setTotp}
            />
          )}

          {(!amountEntry || activeBudget) && (
            <div className={styles.actionsRow}>
              <button type="submit" className={styles.btnPrimary}>
                {busy
                  ? tx('Procesando…', 'Processing…')
                  : preview
                    ? editing
                      ? tx(
                          'Confirmar corrección y reenviar',
                          'Confirm changes & resubmit',
                        )
                      : tx('Confirmar y enviar orden', 'Confirm & submit order')
                    : tx('Consultar vista previa', 'Preview order')}
              </button>
              {preview && (
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={resetReview}
                >
                  {tx('Volver a revisar', 'Edit order')}
                </button>
              )}
              {editing && (
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={onStopEditing}
                >
                  {tx('Salir de la corrección', 'Exit editing')}
                </button>
              )}
            </div>
          )}
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
