'use client';
import { useMemo, useState } from 'react';
import type { LogicalRange } from 'lightweight-charts';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { useLocale } from '@/lib/i18n';
import type { Candle, CandleFrame } from '../history';
import { latestRange, normalizeBars, type ChartMode } from './chart-data';
import { useFinancialChart } from './use-financial-chart';
import styles from '../price.module.css';

export function FinancialChart({
  points,
  mode,
  timeframe,
  datasetKey,
  label,
  currency,
}: {
  points: Candle[];
  mode: ChartMode;
  timeframe: CandleFrame;
  datasetKey: string;
  label: string;
  currency: string | null;
}) {
  const { locale, tx } = useLocale();
  const [range, setRange] = useState<LogicalRange | null>(null);
  const normalized = useMemo(() => {
    try {
      return { bars: normalizeBars(points, timeframe), error: false };
    } catch {
      return { bars: [], error: true };
    }
  }, [points, timeframe]);
  const { bars } = normalized;
  const { chart, container, context } = useFinancialChart({
    bars,
    mode,
    locale,
    daily: timeframe === '1Day',
    datasetKey,
    onRange: setRange,
  });
  const count = range ? Math.max(1, Math.round(range.to - range.from)) : 60;
  const first = range
    ? Math.max(0, Math.ceil(range.from))
    : Math.max(0, bars.length - 60);
  const last = range
    ? Math.min(bars.length - 1, Math.floor(range.to))
    : bars.length - 1;
  const presets = [10, 30, 60, 100, 120, 240];
  const setWindow = (from: number, size: number) => {
    const bounded = Math.max(
      -0.5,
      Math.min(Math.max(-0.5, bars.length - size - 0.5), from),
    );
    chart.current
      ?.timeScale()
      .setVisibleLogicalRange({ from: bounded, to: bounded + size });
    chart.current?.priceScale('right').applyOptions({ autoScale: true });
  };
  return (
    <div className={styles.financialChart} data-chart-mode={mode}>
      <div className={styles.chartTools}>
        {mode === 'candles' && (
          <>
            <div className={styles.candleControlGroup}>
              <label htmlFor="candle-visible-size">
                {tx('Velas visibles', 'Visible candles')}
              </label>
              <div className={styles.candleSelectWrap}>
                <CustomSelect
                  id="candle-visible-size"
                  compact
                  value={presets.includes(count) ? String(count) : 'custom'}
                  options={[
                    ...presets.map((value) => ({
                      value: String(value),
                      label: String(value),
                    })),
                    ...(!presets.includes(count)
                      ? [
                          {
                            value: 'custom',
                            label: `${tx('Zoom', 'Zoom')} (${count})`,
                          },
                        ]
                      : []),
                  ]}
                  onChange={(value) => {
                    if (value !== 'custom')
                      setWindow(
                        (range?.to ?? bars.length - 0.5) - Number(value),
                        Number(value),
                      );
                  }}
                />
              </div>
            </div>
            <button
              className={styles.candleNavBtn}
              type="button"
              disabled={first <= 0}
              onClick={() => setWindow((range?.from ?? 0) - count, count)}
            >
              {tx('← Velas anteriores', '← Earlier candles')}
            </button>
            <button
              className={styles.candleNavBtn}
              type="button"
              disabled={last >= bars.length - 1}
              onClick={() => setWindow((range?.from ?? 0) + count, count)}
            >
              {tx('Velas siguientes →', 'Next candles →')}
            </button>
          </>
        )}
        <button
          className={styles.candleNavBtn}
          type="button"
          onClick={() => {
            chart.current?.timeScale().fitContent();
            chart.current
              ?.priceScale('right')
              .applyOptions({ autoScale: true });
          }}
        >
          {tx('Ajustar al contenido', 'Fit content')}
        </button>
        <button
          className={styles.candleNavBtn}
          type="button"
          onClick={() =>
            chart.current
              ?.timeScale()
              .setVisibleLogicalRange(latestRange(bars.length, count))
          }
        >
          {tx('Más recientes', 'Latest')}
        </button>
        <button
          className={styles.candleNavBtn}
          type="button"
          onClick={() => {
            chart.current
              ?.timeScale()
              .setVisibleLogicalRange(latestRange(bars.length, 60));
            chart.current
              ?.priceScale('right')
              .applyOptions({ autoScale: true });
          }}
        >
          {tx('Restablecer vista', 'Reset view')}
        </button>
      </div>
      <div
        className={styles.chartReadout}
        aria-label={tx('Lectura del gráfico', 'Chart readout')}
      >
        <span className={styles.chartReadoutLabel}>
          {tx('Histórico', 'Historical')} · {currency}
        </span>
        <div ref={context} role="status" aria-live="off" />
      </div>
      {normalized.error && (
        <p className={styles.plotAlert} role="alert">
          {tx(
            'El histórico contiene datos inválidos o contradictorios. No se puede representar con precisión.',
            'The history contains invalid or conflicting data and cannot be plotted accurately.',
          )}
        </p>
      )}
      <div
        ref={container}
        tabIndex={0}
        className={styles.chartCanvas}
        role="img"
        aria-label={label}
      />
      <div className={styles.chartHelp}>
        <span>
          {tx('Mostrando', 'Showing')}{' '}
          {Math.max(0, Math.min(bars.length, first + 1))}–
          {Math.max(0, last + 1)} {tx('de', 'of')} {bars.length} ·{' '}
          {tx(
            'Rueda: zoom · Arrastrar: desplazar · Flechas: explorar',
            'Scroll: zoom · Drag: pan · Arrows: inspect',
          )}
        </span>
        <a href="https://www.tradingview.com/" target="_blank" rel="noreferrer">
          TradingView Lightweight Charts™ · Copyright (с) 2025 TradingView, Inc.
        </a>
      </div>
    </div>
  );
}
