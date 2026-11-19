'use client';
import { useState } from 'react';
import type { Candle } from './history';
import styles from './price.module.css';
const price = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 8 });
const time = new Intl.DateTimeFormat('es-CO', {
  timeZone: 'America/New_York',
  dateStyle: 'short',
  timeStyle: 'short',
});
export function CandleSeries({
  candles,
  currency,
  label,
}: {
  candles: Candle[];
  currency: string | null;
  label: string;
}) {
  const [size, setSize] = useState(60);
  const [offset, setOffset] = useState(0);
  const [hover, setHover] = useState<number | null>(null);
  const end = candles.length - offset;
  const start = Math.max(0, end - size);
  const visible = candles.slice(start, end);
  const low = Math.min(...visible.map((c) => c.low));
  const high = Math.max(...visible.map((c) => c.high));
  const range = high - low || Math.max(Math.abs(high) * 0.02, 0.01);
  const y = (value: number) =>
    195 - (170 * (value - low + range * 0.05)) / (range * 1.1);
  const step = 1000 / Math.max(visible.length, 1);
  const ticks = [high, (high + low) / 2, low];
  const current = visible[hover ?? visible.length - 1];
  function move(next: number) {
    setOffset(Math.max(0, Math.min(candles.length - 1, next)));
    setHover(null);
  }
  return (
    <div className={styles.candleChart}>
      <div className={styles.candleControls}>
        <label>
          Velas visibles{' '}
          <select
            value={size}
            onChange={(e) => {
              setSize(Number(e.target.value));
              setHover(null);
            }}
          >
            {[30, 60, 120, 240].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          disabled={start === 0}
          onClick={() => move(offset + size)}
        >
          ← Velas anteriores
        </button>
        <button
          type="button"
          disabled={offset === 0}
          onClick={() => move(offset - size)}
        >
          Velas siguientes →
        </button>
        <button type="button" disabled={offset === 0} onClick={() => move(0)}>
          Más recientes
        </button>
      </div>
      {current && (
        <div className={styles.ohlc} aria-live="off">
          {time.format(current.time)} ET · Apertura:{' '}
          {price.format(current.open)} · Máximo: {price.format(current.high)} ·
          Mínimo: {price.format(current.low)} · Cierre:{' '}
          {price.format(current.close)} {currency}
        </div>
      )}
      <div className={styles.series}>
        <div
          className={styles.canvas}
          tabIndex={0}
          role="group"
          aria-label="Explorar velas con las flechas izquierda y derecha"
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
              e.preventDefault();
              setHover(
                Math.max(
                  0,
                  Math.min(
                    visible.length - 1,
                    (hover ?? visible.length - 1) +
                      (e.key === 'ArrowLeft' ? -1 : 1),
                  ),
                ),
              );
            }
          }}
          onPointerLeave={() => setHover(null)}
          onPointerMove={(e) => {
            const box = e.currentTarget.getBoundingClientRect();
            setHover(
              Math.max(
                0,
                Math.min(
                  visible.length - 1,
                  Math.floor(
                    ((e.clientX - box.left) / box.width) * visible.length,
                  ),
                ),
              ),
            );
          }}
        >
          <svg
            role="img"
            aria-label={label}
            viewBox="0 0 1000 220"
            preserveAspectRatio="none"
          >
            {ticks.map((t, i) => (
              <line
                key={i}
                x1="0"
                x2="1000"
                y1={y(t)}
                y2={y(t)}
                stroke="var(--color-border)"
                vectorEffect="non-scaling-stroke"
              />
            ))}
            {visible.map((bar, i) => {
              const x = step * (i + 0.5);
              const color = bar.close >= bar.open ? '#10b981' : '#ef4444';
              return (
                <g key={bar.time} data-candle="true">
                  <title>
                    {time.format(bar.time)} · O {bar.open} H {bar.high} L{' '}
                    {bar.low} C {bar.close}
                  </title>
                  <line
                    x1={x}
                    x2={x}
                    y1={y(bar.high)}
                    y2={y(bar.low)}
                    stroke={color}
                    vectorEffect="non-scaling-stroke"
                  />
                  <rect
                    x={x - step * 0.32}
                    width={step * 0.64}
                    y={Math.min(y(bar.open), y(bar.close))}
                    height={Math.max(1, Math.abs(y(bar.open) - y(bar.close)))}
                    fill={color}
                  />
                </g>
              );
            })}
            {hover !== null && (
              <line
                x1={step * (hover + 0.5)}
                x2={step * (hover + 0.5)}
                y1="0"
                y2="220"
                stroke="var(--color-text-muted)"
                strokeDasharray="3 4"
                vectorEffect="non-scaling-stroke"
              />
            )}
          </svg>
        </div>
        <div aria-label="Escala de precios" className={styles.scale}>
          <small>{currency}</small>
          {ticks.map((t, i) => (
            <span key={i} style={{ top: (y(t) / 220) * 100 + '%' }}>
              {price.format(t)}
            </span>
          ))}
        </div>
      </div>
      <div className={styles.candleDates}>
        <span>{visible[0] && time.format(visible[0].time)}</span>
        <span>{visible.at(-1) && time.format(visible.at(-1)!.time)} ET</span>
      </div>
      <div className={styles.ohlc}>
        Verde: cierre igual o superior a apertura · Rojo: cierre inferior.
        Mostrando {start + 1}–{end} de {candles.length} velas.
      </div>
    </div>
  );
}
