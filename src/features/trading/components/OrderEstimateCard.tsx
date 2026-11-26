'use client';

import { useQuery } from '@tanstack/react-query';
import { LoadingState } from '@/components/ui/LoadingState';
import { QUERY_STALE_TIMES, queryKeys } from '@/lib/api';
import { useLocale } from '@/lib/i18n';
import { estimateInput } from '../order-estimate';
import { estimateOrder, type OrderInput } from '../trading-api';
import { OrderCostBreakdown } from './OrderCostBreakdown';
import styles from '../order-guidance.module.css';

export function OrderEstimateCard({
  draft,
  valid,
}: {
  draft: OrderInput;
  valid: boolean;
}) {
  const { tx } = useLocale();
  const input = estimateInput(draft);
  const estimate = useQuery({
    queryKey: queryKeys.orders.estimate(input),
    queryFn: ({ signal }) => estimateOrder(input, signal),
    enabled: valid,
    staleTime: QUERY_STALE_TIMES.realtime,
    refetchInterval: 30_000,
    retry: false,
  });
  return (
    <section
      className={styles.estimate}
      aria-label={tx('Estimación automática', 'Automatic estimate')}
    >
      <div className={styles.header}>
        <h3 className={styles.title}>
          {tx('Antes de enviar', 'Before you submit')}
        </h3>
        {valid && (
          <button
            type="button"
            className={styles.refresh}
            disabled={estimate.isFetching}
            onClick={() => {
              void estimate.refetch();
            }}
          >
            {tx('Recalcular', 'Recalculate')}
          </button>
        )}
      </div>
      {!valid ? (
        <p className={styles.hint}>
          {tx(
            'Selecciona un instrumento y completa una cantidad y precios válidos para calcular el importe.',
            'Select an instrument and enter a valid quantity and prices to calculate the amount.',
          )}
        </p>
      ) : estimate.isPending ? (
        <LoadingState
          mode="compact"
          label={tx('Calculando estimación…', 'Calculating estimate…')}
        />
      ) : estimate.isError ? (
        <p className={styles.warning}>
          {tx(
            'No pudimos calcular el importe. Puedes recalcular o consultar la vista previa para revisar el motivo.',
            'Could not calculate the amount. Recalculate or request a preview to review the reason.',
          )}
        </p>
      ) : estimate.data ? (
        <OrderCostBreakdown draft={input} estimate={estimate.data} />
      ) : null}
      <p className={styles.hint}>
        {tx(
          'Esta consulta no envía órdenes. La vista previa vuelve a comprobar los importes antes de confirmar.',
          'This calculation places no orders. Preview checks the amounts again before confirmation.',
        )}
      </p>
    </section>
  );
}
