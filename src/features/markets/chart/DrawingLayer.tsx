'use client';
import { useId } from 'react';
import type { CSSProperties } from 'react';
import { formatChartTime, pricePrecision, type ChartBar } from './chart-data';
import type { DrawingFrame } from './use-financial-chart';
import styles from './drawings.module.css';

export function DrawingLayer({
  frame,
  selectedId,
  bars,
  locale,
  daily,
}: {
  frame: DrawingFrame | null;
  selectedId: string | null;
  bars: ChartBar[];
  locale: string;
  daily: boolean;
}) {
  const clip = useId();
  if (!frame || frame.width < 1) return null;
  const { plot } = frame;
  const active = frame.shapes.find((s) => s.drawing.id === selectedId);
  const numeric = new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'es-CO', {
    maximumFractionDigits: pricePrecision(bars),
  });
  const dates =
    active?.handles.map((p, i) => ({
      x: p[0],
      y: p[1],
      point:
        active.drawing.kind === 'polygon'
          ? active.drawing.vertices![i]!
          : i === 0
            ? active.drawing.a
            : active.drawing.b,
    })) ?? [];
  const visibleDates = dates.filter(
    (p) => p.x >= plot.left && p.x <= plot.right,
  );
  // Extremes stay readable even for polygons with many vertices.
  const dateTags =
    visibleDates.length > 2
      ? [
          visibleDates.reduce((a, b) => (a.x < b.x ? a : b)),
          visibleDates.reduce((a, b) => (a.x > b.x ? a : b)),
        ]
      : visibleDates;
  const shapes = [
    ...frame.shapes.filter((shape) => shape.drawing.id !== selectedId),
    ...frame.shapes.filter((shape) => shape.drawing.id === selectedId),
    ...(frame.draft ? [frame.draft] : []),
  ];
  return (
    <svg
      className={styles.layer}
      width={frame.width}
      height={frame.height}
      viewBox={`0 0 ${frame.width} ${frame.height}`}
      aria-hidden="true"
      data-drawing-layer="true"
    >
      <defs>
        <clipPath id={clip}>
          <rect
            x={plot.left}
            y={plot.top}
            width={Math.max(0, plot.right - plot.left)}
            height={Math.max(0, plot.bottom - plot.top)}
          />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clip})`}>
        {active &&
          dateTags.map((p, i) => (
            <line
              key={`guide-${i}`}
              x1={p.x}
              x2={p.x}
              y1={plot.top}
              y2={plot.bottom}
              className={styles.guide}
            />
          ))}
        {shapes.map(({ drawing, points, handles }) => {
          const selected =
            drawing.id === selectedId || drawing === frame.draft?.drawing;
          const area =
            drawing.kind === 'rectangle' || drawing.kind === 'polygon';
          const color = `var(--color-drawing-${drawing.style.color})`;
          const a = handles[0]!,
            b = handles.at(-1)!;
          const delta = drawing.b.price - drawing.a.price;
          const text =
            drawing.kind === 'measure'
              ? `${numeric.format(delta)} · ${drawing.a.price === 0 ? '—' : numeric.format((delta / drawing.a.price) * 100) + '%'} · ${Math.abs(drawing.b.index - drawing.a.index)} ${locale === 'en' ? 'bars' : 'barras'}`
              : drawing.text;
          return (
            <g
              key={drawing.id}
              data-drawing-id={drawing.id}
              data-kind={drawing.kind}
              data-selected={selected}
              style={{ '--drawing-color': color } as CSSProperties}
            >
              {area ? (
                <polygon
                  points={points.map((p) => p.join(',')).join(' ')}
                  fill={color}
                  fillOpacity={drawing.style.opacity}
                  stroke={color}
                  strokeWidth={drawing.style.width}
                  strokeDasharray={
                    drawing.style.dash === 'solid'
                      ? undefined
                      : drawing.style.dash === 'dotted'
                        ? '2 5'
                        : '8 5'
                  }
                />
              ) : (
                <polyline
                  points={points.map((p) => p.join(',')).join(' ')}
                  fill="none"
                  stroke={color}
                  strokeWidth={drawing.style.width}
                  strokeDasharray={
                    drawing.style.dash === 'solid'
                      ? undefined
                      : drawing.style.dash === 'dotted'
                        ? '2 5'
                        : '8 5'
                  }
                />
              )}
              {drawing.kind === 'measure' && (
                <path
                  d={`M${a[0]},${a[1]} H${b[0]} V${b[1]}`}
                  className={styles.guide}
                />
              )}
              {text && (
                <text
                  x={(a[0] + b[0]) / 2}
                  y={(a[1] + b[1]) / 2 - 12}
                  textAnchor="middle"
                  className={styles.annotation}
                >
                  {text}
                </text>
              )}
              {selected &&
                handles.map((p, i) => (
                  <circle
                    key={i}
                    data-handle={i}
                    cx={p[0]}
                    cy={p[1]}
                    r={5}
                    className={styles.handle}
                  />
                ))}
            </g>
          );
        })}
      </g>
      {active &&
        dateTags.map((p, i) => {
          const bar = bars[p.point.index];
          const text = bar
            ? formatChartTime(
                bar.time,
                locale,
                !daily,
                plot.right - plot.left < 320,
              )
            : '';
          const width = Math.min(plot.right - plot.left, daily ? 132 : 185);
          const close =
            dateTags.length === 2 &&
            Math.abs(dateTags[0]!.x - dateTags[1]!.x) < width;
          const left = Math.max(
            plot.left,
            Math.min(
              plot.right - width,
              close ? (i === 0 ? p.x - width : p.x) : p.x - width / 2,
            ),
          );
          return (
            <g key={`date-${i}`} data-anchor-date={p.point.index}>
              <rect
                x={left}
                y={frame.height - 50 - (close && i === 1 ? 24 : 0)}
                width={width}
                height={22}
                rx={4}
                className={styles.tag}
              />
              <text
                x={left + width / 2}
                y={frame.height - 35 - (close && i === 1 ? 24 : 0)}
                textAnchor="middle"
                className={styles.tagText}
              >
                {text}
              </text>
            </g>
          );
        })}
      {active &&
        dates
          .slice(0, 2)
          .filter((p) => p.y >= plot.top && p.y <= plot.bottom)
          .map((p, i) => (
            <g key={`price-${i}`}>
              <rect
                x={plot.right + 3}
                y={p.y - 11}
                width={78}
                height={22}
                rx={4}
                className={styles.tag}
              />
              <text x={plot.right + 7} y={p.y + 4} className={styles.tagText}>
                {numeric.format(p.point.price)}
              </text>
            </g>
          ))}
    </svg>
  );
}
