'use client';

import { formatUsd } from '@/lib/formatters';
import { useLocale } from '@/lib/i18n';
import { multiplyOrderValues, orderBasePrice } from '../order-estimate';
import type { OrderInput, Preview } from '../trading-api';
import styles from '../order-guidance.module.css';

export function OrderCostBreakdown({
  draft,
  estimate,
}: {
  draft: OrderInput;
  estimate: Preview;
}) {
  const { tx } = useLocale();
  const base = orderBasePrice(draft, estimate.reference_price);
  const gross = multiplyOrderValues(draft.qty, base);
  return (
    <>
      <dl className={styles.breakdown}>
        <div>
          <dt>
            {tx('Precio usado por acción', 'Calculation price per share')}
          </dt>
          <dd>
            {formatUsd(base, { withCode: true, maximumFractionDigits: 4 })}
          </dd>
        </div>
        <div>
          <dt>
            {draft.qty} × {tx('precio por acción', 'price per share')}
          </dt>
          <dd>{gross == null ? '—' : formatUsd(gross, { withCode: true })}</dd>
        </div>
        <div>
          <dt>{tx('Comisión estimada', 'Estimated commission')}</dt>
          <dd>
            {formatUsd(estimate.reference_commission, { withCode: true })}
          </dd>
        </div>
        <div className={styles.total}>
          <dt>
            {draft.side === 'buy'
              ? tx('Total de compra estimado', 'Estimated buy total')
              : tx(
                  'Venta estimada antes de comisión',
                  'Estimated sale before commission',
                )}
          </dt>
          <dd>{formatUsd(estimate.estimated_amount, { withCode: true })}</dd>
        </div>
      </dl>
      <p className={styles.hint}>
        {draft.side === 'buy'
          ? tx(
              'El total ya incluye la comisión estimada.',
              'The total already includes the estimated commission.',
            )
          : tx(
              'La comisión se muestra por separado; aún no se ha descontado del importe de venta.',
              'Commission is shown separately and has not been deducted from the sale amount.',
            )}
      </p>
    </>
  );
}
