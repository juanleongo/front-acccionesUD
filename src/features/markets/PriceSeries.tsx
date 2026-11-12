import { useId, useMemo, useState } from 'react';
import styles from './price.module.css';

type Point = { time: number; price: number };
const formatPrice = new Intl.NumberFormat('es-CO', {
  maximumFractionDigits: 8,
});
const formatTime = new Intl.DateTimeFormat('es-CO', {
  timeZone: 'America/New_York',
  dateStyle: 'medium',
  timeStyle: 'short',
});

export function PriceSeries({
  points,
  currency,
  label,
}: {
  points: Point[];
  currency: string | null;
  label: string;
}) {
  const id = useId();
  const [hover, setHover] = useState<number | null>(null);
  const { coords, line, ticks } = useMemo(() => {
    const first = points[0]!,
      last = points[points.length - 1]!;
    let low = first.price,
      high = first.price;
    for (const { price } of points) {
      low = Math.min(low, price);
      high = Math.max(high, price);
    }
    const y = (price: number) =>
      high === low ? 110 : 185 - (155 * (price - low)) / (high - low);
    const coords = points.map((p) => ({
      x:
        last.time === first.time
          ? 500
          : (1000 * (p.time - first.time)) / (last.time - first.time),
      y: y(p.price),
    }));
    const line = coords
      .map((p, i) => (i ? 'L' : 'M') + p.x.toFixed(2) + ' ' + p.y.toFixed(2))
      .join(' ');
    const ticks = (high === low ? [low] : [high, (high + low) / 2, low]).map(
      (price) => ({ price, y: y(price) }),
    );
    return { coords, line, ticks };
  }, [points]);
  function inspect(x: number) {
    let left = 0,
      right = coords.length - 1;
    while (left < right) {
      const mid = Math.floor((left + right) / 2);
      if (coords[mid]!.x < x) left = mid + 1;
      else right = mid;
    }
    setHover(
      left > 0 && x - coords[left - 1]!.x < coords[left]!.x - x
        ? left - 1
        : left,
    );
  }
  const point = hover === null ? undefined : points[hover];
  const marker = hover === null ? undefined : coords[hover];
  return (
    <div className={styles.series}>
      <div
        className={styles.canvas}
        onPointerLeave={() => setHover(null)}
        onPointerCancel={() => setHover(null)}
        onPointerMove={(event) => {
          const box = event.currentTarget.getBoundingClientRect();
          inspect(((event.clientX - box.left) / box.width) * 1000);
        }}
      >
        <svg
          role="img"
          aria-label={label}
          viewBox="0 0 1000 220"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity=".52" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
            </linearGradient>
          </defs>
          {ticks.map((t) => (
            <line
              key={t.y}
              x1="0"
              x2="1000"
              y1={t.y}
              y2={t.y}
              stroke="#ffffff22"
              vectorEffect="non-scaling-stroke"
            />
          ))}
          {coords.length > 1 && (
            <>
              <path
                d={line + ' L1000 220 L0 220 Z'}
                fill={'url(#' + id + ')'}
              />
              <path
                d={line}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                vectorEffect="non-scaling-stroke"
              />
            </>
          )}
          {marker && (
            <line
              x1={marker.x}
              x2={marker.x}
              y1="0"
              y2="220"
              stroke="#ddd"
              strokeDasharray="3 4"
              vectorEffect="non-scaling-stroke"
            />
          )}
        </svg>
        {(marker || coords.length === 1) && (
          <span
            className={styles.dot}
            style={{
              left: (marker ?? coords[0])!.x / 10 + '%',
              top: ((marker ?? coords[0])!.y / 220) * 100 + '%',
            }}
          />
        )}
        {marker && point && (
          <div
            role="tooltip"
            className={styles.tip}
            style={marker.x < 500 ? { right: 4 } : { left: 4 }}
          >
            <b>
              {formatPrice.format(point.price)} {currency}
            </b>
            <br />
            {formatTime.format(point.time)} · Nueva York
          </div>
        )}
      </div>
      <div aria-label="Escala de precios" className={styles.scale}>
        <small>{currency}</small>
        {ticks.map((t) => (
          <span key={t.y} style={{ top: (t.y / 220) * 100 + '%' }}>
            {formatPrice.format(t.price)}
          </span>
        ))}
      </div>
    </div>
  );
}
