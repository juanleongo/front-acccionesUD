'use client';

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
  return (
    <>
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
            onChange={(e) => onUpdate({ limit_price: e.target.value })}
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
            onChange={(e) => onUpdate({ stop_price: e.target.value })}
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
              onChange={(e) =>
                onSwitchTrailMode(e.target.value as 'price' | 'percent')
              }
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
            Take profit (USD)
            <input
              className={styles.input}
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
            Stop loss (USD)
            <input
              className={styles.input}
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
