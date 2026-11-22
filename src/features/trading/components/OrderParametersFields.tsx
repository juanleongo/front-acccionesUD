'use client';

import { CustomSelect } from '@/components/ui/CustomSelect';
import { useLocale } from '@/lib/i18n';
import type { OrderInput } from '../trading-api';
import styles from '../trading.module.css';

export function OrderParametersFields({
  draft,
  onUpdate,
  onSwitchTrailMode,
}: {
  draft: OrderInput;
  onUpdate: (changes: Partial<OrderInput>) => void;
  onSwitchTrailMode: (mode: 'price' | 'percent') => void;
}) {
  const { tx } = useLocale();
  return (
    <>
      {(draft.type === 'limit' || draft.type === 'stop_limit') && (
        <label className={styles.fieldGroup}>
          <span className={styles.fieldLabel}>
            {tx('Precio límite (USD)', 'Limit price (USD)')}
          </span>
          <input
            className={`${styles.input} ${styles.tabularNum}`}
            type="number"
            required
            min="0.0001"
            step="0.0001"
            value={draft.limit_price ?? ''}
            onChange={(e) => onUpdate({ limit_price: e.target.value })}
          />
        </label>
      )}

      {(draft.type === 'stop' || draft.type === 'stop_limit') && (
        <label className={styles.fieldGroup}>
          <span className={styles.fieldLabel}>
            {tx('Precio de activación stop (USD)', 'Stop trigger price (USD)')}
          </span>
          <input
            className={`${styles.input} ${styles.tabularNum}`}
            type="number"
            required
            min="0.0001"
            step="0.0001"
            value={draft.stop_price ?? ''}
            onChange={(e) => onUpdate({ stop_price: e.target.value })}
          />
        </label>
      )}

      {draft.type === 'trailing_stop' && (
        <>
          <div className={styles.fieldGroup}>
            <label htmlFor="order-trailing-mode" className={styles.fieldLabel}>
              {tx('Distancia del trailing', 'Trailing distance type')}
            </label>
            <CustomSelect
              id="order-trailing-mode"
              value={draft.trail_price !== undefined ? 'price' : 'percent'}
              onChange={(val) => onSwitchTrailMode(val as 'price' | 'percent')}
              options={[
                { value: 'percent', label: tx('Porcentaje', 'Percentage') },
                { value: 'price', label: 'USD' },
              ]}
            />
          </div>

          <label className={styles.fieldGroup}>
            <span className={styles.fieldLabel}>
              {tx('Distancia', 'Distance')}
            </span>
            <input
              className={`${styles.input} ${styles.tabularNum}`}
              type="number"
              required
              min={draft.trail_price !== undefined ? '0.0001' : '0.1'}
              max={draft.trail_price !== undefined ? undefined : '50'}
              step="0.0001"
              value={draft.trail_price ?? draft.trail_percent ?? ''}
              onChange={(e) =>
                onUpdate(
                  draft.trail_price !== undefined
                    ? { trail_price: e.target.value }
                    : { trail_percent: e.target.value },
                )
              }
            />
          </label>
        </>
      )}

      {draft.order_class === 'bracket' && (
        <>
          <label className={styles.fieldGroup}>
            <span className={styles.fieldLabel}>Take profit (USD)</span>
            <input
              className={`${styles.input} ${styles.tabularNum}`}
              required
              type="number"
              min="0.0001"
              step="0.0001"
              value={draft.take_profit?.limit_price ?? ''}
              onChange={(e) =>
                onUpdate({ take_profit: { limit_price: e.target.value } })
              }
            />
          </label>

          <label className={styles.fieldGroup}>
            <span className={styles.fieldLabel}>Stop loss (USD)</span>
            <input
              className={`${styles.input} ${styles.tabularNum}`}
              required
              type="number"
              min="0.0001"
              step="0.0001"
              value={draft.stop_loss?.stop_price ?? ''}
              onChange={(e) =>
                onUpdate({ stop_loss: { stop_price: e.target.value } })
              }
            />
          </label>
        </>
      )}
    </>
  );
}
