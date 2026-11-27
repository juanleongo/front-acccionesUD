'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LoadingState } from '@/components/ui/LoadingState';
import { formatUsd } from '@/lib/formatters';
import { useLocale } from '@/lib/i18n';
import {
  automaticBudgetPrice,
  budgetQuantity,
  isOrderWithinBudget,
  withinBudget,
  type BudgetMode,
  type OrderBudget,
} from '../order-budget';
import { OrderCostBreakdown } from './OrderCostBreakdown';
import {
  getInstrumentDetails,
  previewOrder,
  type OrderInput,
  type Preview,
} from '../trading-api';
import styles from '../order-guidance.module.css';

export function OrderBudgetCalculator({
  symbol,
  scheduleIfClosed,
  onApply,
  onReset,
  onOpenChange,
}: {
  symbol: string;
  scheduleIfClosed: boolean;
  onApply: (input: OrderInput, budget: OrderBudget) => void;
  onReset: () => void;
  onOpenChange: (open: boolean) => void;
}) {
  const { tx } = useLocale();
  const [open, setOpen] = useState(false);
  const details = useQuery({
    enabled: open,
    queryKey: ['trading', 'instrument-details', symbol],
    queryFn: ({ signal }) => getInstrumentDetails(symbol, signal),
    staleTime: 300_000,
    retry: false,
  });
  const [budget, setBudget] = useState('100');
  const [mode, setMode] = useState<BudgetMode>('total');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{
    draft: OrderInput;
    preview: Preview;
  } | null>(null);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  function resetCalculation() {
    setResult(null);
    setError('');
    onReset();
  }
  async function calculate() {
    if (busy || !details.data?.tradable) return;
    setError('');
    setResult(null);
    if (!/^\d+(?:\.\d{1,2})?$/.test(budget) || Number(budget) <= 0) {
      setError(
        tx(
          'Ingresa un monto mayor a cero, con un máximo de dos decimales.',
          'Enter an amount greater than zero, with up to two decimal places.',
        ),
      );
      return;
    }
    setBusy(true);
    const request = new AbortController();
    controller.current = request;
    try {
      const reference = await previewOrder(
        {
          symbol,
          side: 'buy',
          qty: '1',
          type: 'market',
          order_class: 'simple',
          time_in_force: 'day',
          schedule_if_closed: scheduleIfClosed,
        },
        request.signal,
      );
      const limit = automaticBudgetPrice(reference.reference_price);
      if (!limit) {
        setError(
          tx(
            'No hay un precio disponible para calcular la compra. Vuelve a consultar en unos momentos.',
            'No price is available to calculate the purchase. Try again shortly.',
          ),
        );
        return;
      }
      const input: OrderInput = {
        symbol,
        side: 'buy',
        qty: '1',
        type: 'limit',
        order_class: 'simple',
        time_in_force: 'day',
        limit_price: limit,
        schedule_if_closed: scheduleIfClosed,
      };
      const selection: OrderBudget = { amount: budget, mode };
      const unitCost =
        mode === 'total'
          ? withinBudget(reference.reference_price, limit) &&
            withinBudget(limit, reference.reference_price)
            ? reference.estimated_amount
            : (await previewOrder(input, request.signal)).estimated_amount
          : limit;
      let quantity = budgetQuantity(
        budget,
        unitCost,
        details.data.fractionable,
      );
      if (!quantity) {
        setError(
          tx(
            'El monto no alcanza para la cantidad mínima de este instrumento. Prueba con otro monto.',
            'The amount is below the minimum quantity for this instrument. Try another amount.',
          ),
        );
        return;
      }
      let calculated = { ...input, qty: quantity };
      let verified = await previewOrder(calculated, request.signal);
      request.signal.throwIfAborted();
      if (!isOrderWithinBudget(calculated, verified, selection)) {
        setError(
          tx(
            'Los costos cambiaron. Vuelve a calcular antes de continuar.',
            'Costs changed. Calculate again before continuing.',
          ),
        );
        return;
      }
      // A one-share quote rounds to cents. Refine once using the larger
      // quoted quantity so low-priced shares do not leave most of the budget unused.
      const refined =
        mode === 'total'
          ? budgetQuantity(
              budget,
              verified.estimated_amount,
              details.data.fractionable,
              quantity,
            )
          : quantity;
      if (refined && refined !== quantity) {
        quantity = refined;
        calculated = { ...input, qty: quantity };
        verified = await previewOrder(calculated, request.signal);
        request.signal.throwIfAborted();
        if (!isOrderWithinBudget(calculated, verified, selection)) {
          setError(
            tx(
              'Los costos cambiaron. Vuelve a calcular antes de continuar.',
              'Costs changed. Calculate again before continuing.',
            ),
          );
          return;
        }
      }
      onApply(calculated, selection);
      setResult({ draft: calculated, preview: verified });
    } catch {
      if (request.signal.aborted) return;
      setError(
        tx(
          'No pudimos calcular la compra. Comprueba que tu cuenta esté habilitada y vuelve a intentarlo. No se ha enviado ninguna orden.',
          'Could not calculate the purchase. Check your account is enabled and try again. No order has been placed.',
        ),
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <details
      className={styles.estimate}
      onToggle={(event) => {
        const value = event.currentTarget.open;
        if (!value) controller.current?.abort();
        setOpen(value);
        onOpenChange(value);
      }}
    >
      <summary className={styles.title}>
        {tx('Calcular una compra por monto', 'Calculate a purchase by amount')}
      </summary>
      {open && (
        <>
          <p className={styles.hint}>
            {tx(
              'Ingresa cuánto quieres comprar y elige cómo aplicar la comisión. Calculamos automáticamente la cantidad de acciones con el precio consultado.',
              'Enter how much you want to buy and choose how to apply commission. We calculate the share quantity automatically using the consulted price.',
            )}
          </p>
          {details.isPending ? (
            <LoadingState
              mode="compact"
              label={tx('Consultando instrumento…', 'Checking instrument…')}
            />
          ) : details.isError ? (
            <p className={styles.warning}>
              {tx(
                'No pudimos comprobar si admite fracciones.',
                'Could not check fractional availability.',
              )}{' '}
              <button
                type="button"
                className={styles.refresh}
                onClick={() => void details.refetch()}
              >
                {tx('Reintentar', 'Retry')}
              </button>
            </p>
          ) : (
            <>
              <p className={styles.hint}>
                {details.data?.fractionable
                  ? tx(
                      'Este instrumento admite fracciones de acción.',
                      'This instrument supports fractional shares.',
                    )
                  : tx(
                      'Este instrumento solo admite acciones enteras.',
                      'This instrument supports whole shares only.',
                    )}
              </p>
              <fieldset className={styles.budgetModes} disabled={busy}>
                <legend className={styles.title}>
                  {tx(
                    '¿Cómo quieres aplicar el monto?',
                    'How should the amount be applied?',
                  )}
                </legend>
                {(['total', 'shares'] as const).map((option) => (
                  <label
                    key={option}
                    className={`${styles.budgetMode} ${mode === option ? styles.budgetModeSelected : ''}`}
                  >
                    <input
                      type="radio"
                      name="order-budget-mode"
                      value={option}
                      checked={mode === option}
                      onChange={() => {
                        setMode(option);
                        resetCalculation();
                      }}
                    />
                    <span>
                      <strong>
                        {option === 'total'
                          ? tx(
                              'Incluir comisión en el monto',
                              'Include commission in the amount',
                            )
                          : tx(
                              'Sumar comisión al monto',
                              'Add commission to the amount',
                            )}
                      </strong>
                      <small>
                        {option === 'total'
                          ? tx(
                              'El monto cubre las acciones y la comisión estimada.',
                              'The amount covers shares and estimated commission.',
                            )
                          : tx(
                              'El monto se destina a las acciones. La comisión se suma al total.',
                              'The amount goes toward shares. Commission is added to the total.',
                            )}
                      </small>
                    </span>
                  </label>
                ))}
              </fieldset>
              <div className={styles.amountField}>
                <label className={styles.hint} htmlFor="order-budget">
                  {mode === 'total'
                    ? tx('Presupuesto total (USD)', 'Total budget (USD)')
                    : tx('Monto en acciones (USD)', 'Share amount (USD)')}
                  <input
                    id="order-budget"
                    inputMode="decimal"
                    className={styles.budgetInput}
                    value={budget}
                    onChange={(e) => {
                      setBudget(e.target.value);
                      resetCalculation();
                    }}
                    disabled={busy}
                  />
                </label>
              </div>
              <button
                type="button"
                className={styles.refresh}
                disabled={busy || !details.data?.tradable}
                onClick={() => void calculate()}
              >
                {busy
                  ? tx('Calculando…', 'Calculating…')
                  : tx('Calcular compra', 'Calculate purchase')}
              </button>
            </>
          )}
          {error && (
            <p role="alert" className={styles.warning}>
              {error}
            </p>
          )}
          {result && (
            <section
              className={styles.budgetResult}
              aria-label={tx('Desglose del cálculo', 'Calculation breakdown')}
            >
              <p role="status" className={styles.hint}>
                {tx(
                  `${result.draft.qty} acciones · Total estimado ${formatUsd(result.preview.estimated_amount, { withCode: true })}, incluida la comisión. Revisa y confirma abajo.`,
                  `${result.draft.qty} shares · Estimated total ${formatUsd(result.preview.estimated_amount, { withCode: true })}, including commission. Review and confirm below.`,
                )}
              </p>
              <OrderCostBreakdown
                draft={result.draft}
                estimate={result.preview}
              />
            </section>
          )}
          <p className={styles.hint}>
            {tx(
              'La cantidad se redondea hacia abajo: el valor en acciones puede ser ligeramente menor al monto indicado. El total usa la comisión informada por el servidor.',
              'Quantity is rounded down: share value may be slightly below the entered amount. The total uses the commission reported by the server.',
            )}
          </p>
          <p className={styles.hint}>
            {tx(
              'Calcular no realiza la compra. Revisa el total y confirma después. La orden puede quedar pendiente si cambia el precio o la bolsa está cerrada.',
              'Calculation does not buy shares. Review the total and confirm afterwards. The order may remain pending if the price changes or the exchange is closed.',
            )}
          </p>
        </>
      )}
    </details>
  );
}
