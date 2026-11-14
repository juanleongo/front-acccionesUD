'use client';

import { ORDER_TYPE_META, type OrderType } from './trading-mock';
import styles from './trading.module.css';

const ORDER_TYPES: OrderType[] = [
  'market',
  'limit',
  'stop_loss',
  'take_profit',
];

export function OrderTypeSelector({
  value,
  onChange,
}: {
  value: OrderType;
  onChange: (type: OrderType) => void;
}) {
  return (
    <div
      className={styles.orderTypesGrid}
      role="radiogroup"
      aria-label="Modalidad de orden"
    >
      {ORDER_TYPES.map((type) => {
        const meta = ORDER_TYPE_META[type];
        const active = value === type;
        return (
          <button
            key={type}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(type)}
            className={`${styles.orderTypeCard} ${active ? styles.orderTypeCardActive : ''}`}
          >
            <div className={styles.orderTypeTop}>
              <span className={styles.orderTypeTitle}>{meta.shortLabel}</span>
              <span className={styles.orderTypeBadge}>{meta.badge}</span>
            </div>
            <span className={styles.orderTypeDesc}>{meta.description}</span>
          </button>
        );
      })}
    </div>
  );
}
