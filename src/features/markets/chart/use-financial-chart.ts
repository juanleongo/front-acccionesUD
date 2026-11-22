'use client';
import { useEffect, useRef } from 'react';
import {
  createChart,
  CandlestickSeries,
  LineSeries,
  AreaSeries,
  type IChartApi,
  type ISeriesApi,
  type LogicalRange,
  type MouseEventParams,
} from 'lightweight-charts';
import styles from '../price.module.css';
import { chartOptions, seriesOptions } from './chart-options';
import {
  formatChartTime,
  latestRange,
  timeKey,
  type ChartBar,
  type ChartMode,
} from './chart-data';

export function useFinancialChart({
  bars,
  mode,
  locale,
  daily,
  datasetKey,
  onRange,
}: {
  bars: ChartBar[];
  mode: ChartMode;
  locale: string;
  daily: boolean;
  datasetKey: string;
  onRange: (range: LogicalRange | null) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const context = useRef<HTMLDivElement>(null);
  const chart = useRef<IChartApi | null>(null);
  const series = useRef<ISeriesApi<'Candlestick' | 'Line' | 'Area'> | null>(
    null,
  );
  const previous = useRef<{
    mode: ChartMode;
    bars: ChartBar[];
    key: string;
  } | null>(null);
  useEffect(() => {
    if (!container.current) return;
    const instance = createChart(container.current, { autoSize: true });
    chart.current = instance;
    return () => {
      instance.remove();
      chart.current = null;
      series.current = null;
      previous.current = null;
    };
  }, [container]);

  useEffect(() => {
    const instance = chart.current,
      host = container.current;
    if (!instance || !host) return;
    const old = previous.current;
    const viewport = instance.timeScale().getVisibleLogicalRange();
    const replaceSeries = !series.current || old?.mode !== mode;
    if (replaceSeries) {
      if (series.current) instance.removeSeries(series.current);
      series.current =
        mode === 'candles'
          ? instance.addSeries(CandlestickSeries)
          : mode === 'area'
            ? instance.addSeries(AreaSeries)
            : instance.addSeries(LineSeries);
    }
    const activeSeries = series.current!;
    const applyTheme = () => {
      const preservedRange = instance.timeScale().getVisibleLogicalRange();
      instance.applyOptions(chartOptions(host, locale, daily));
      activeSeries.applyOptions(seriesOptions(host, bars));
      if (preservedRange && bars.length)
        instance.timeScale().setVisibleLogicalRange(preservedRange);
    };
    applyTheme();
    if (replaceSeries || old?.bars !== bars) {
      activeSeries.setData(
        bars.map((bar) =>
          mode === 'candles'
            ? {
                time: bar.time,
                open: bar.open,
                high: bar.high,
                low: bar.low,
                close: bar.close,
              }
            : { time: bar.time, value: bar.close },
        ),
      );
      if (bars.length)
        instance
          .timeScale()
          .setVisibleLogicalRange(
            old?.key === datasetKey && viewport
              ? viewport
              : latestRange(bars.length, 60),
          );
    }
    previous.current = { mode, bars, key: datasetKey };
    const theme = new MutationObserver(applyTheme);
    theme.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    const indexes = new Map(
      bars.map((bar, index) => [timeKey(bar.time), index]),
    );
    const price = new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'es-CO', {
      maximumFractionDigits: 8,
    });
    const percent = new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'es-CO', {
      style: 'percent',
      maximumFractionDigits: 2,
      signDisplay: 'always',
    });
    const readout = context.current;
    let lastIndex = -2;
    const show = (index: number) => {
      if (!readout || index === lastIndex) return;
      lastIndex = index;
      const bar = bars[index];
      if (!bar) {
        readout.textContent = '';
        return;
      }
      const prev = bars[index - 1];
      const delta = prev ? bar.close - prev.close : null;
      const comparison =
        delta !== null && prev
          ? ` · Δ ${delta >= 0 ? '+' : ''}${price.format(delta)}${prev.close !== 0 ? ` (${percent.format(delta / prev.close)})` : ''} ${locale === 'en' ? 'vs previous close' : 'vs. cierre anterior'}`
          : '';
      const fields: HTMLElement[] = [];
      const date = document.createElement('span');
      date.className = styles.readoutTime!;
      date.textContent = `${formatChartTime(bar.time, locale, !daily)}${daily ? '' : ' ET'}`;
      fields.push(date);
      const values =
        mode === 'candles'
          ? ([
              [locale === 'en' ? 'Open' : 'Apertura', bar.open],
              [locale === 'en' ? 'High' : 'Máximo', bar.high],
              [locale === 'en' ? 'Low' : 'Mínimo', bar.low],
              [locale === 'en' ? 'Close' : 'Cierre', bar.close],
            ] as const)
          : ([[locale === 'en' ? 'Close' : 'Cierre', bar.close]] as const);
      for (const [label, value] of values) {
        const field = document.createElement('span');
        field.className = styles.readoutValue!;
        field.append(`${label} `);
        const number = document.createElement('b');
        number.textContent = price.format(value);
        field.append(number);
        fields.push(field);
      }
      const change = document.createElement('span');
      change.className = styles.readoutChange!;
      change.textContent = `${comparison.replace(/^ · /, '')}${bar.volume !== undefined ? ` · Vol. ${price.format(bar.volume)}` : ''}`;
      fields.push(change);
      readout.replaceChildren(...fields);
    };
    const crosshair = (event: MouseEventParams) =>
      show(
        event.time === undefined
          ? bars.length - 1
          : (indexes.get(timeKey(event.time)) ?? bars.length - 1),
      );
    const keyboard = (event: KeyboardEvent) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      const index = Math.max(
        0,
        Math.min(
          bars.length - 1,
          (lastIndex < 0 ? bars.length - 1 : lastIndex) +
            (event.key === 'ArrowLeft' ? -1 : 1),
        ),
      );
      const bar = bars[index];
      if (!bar) return;
      const visible = instance.timeScale().getVisibleLogicalRange();
      if (visible && (index < visible.from || index > visible.to)) {
        const width = visible.to - visible.from;
        const from = Math.max(-0.5, index - width / 2);
        instance.timeScale().setVisibleLogicalRange({ from, to: from + width });
      }
      instance.setCrosshairPosition(bar.close, bar.time, activeSeries);
      show(index);
    };
    host.addEventListener('keydown', keyboard);
    instance.subscribeCrosshairMove(crosshair);
    show(bars.length - 1);
    let frame = 0;
    const rangeChanged = (range: LogicalRange | null) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => onRange(range));
    };
    instance.timeScale().subscribeVisibleLogicalRangeChange(rangeChanged);
    rangeChanged(instance.timeScale().getVisibleLogicalRange());
    return () => {
      host.removeEventListener('keydown', keyboard);
      theme.disconnect();
      cancelAnimationFrame(frame);
      instance.unsubscribeCrosshairMove(crosshair);
      instance.timeScale().unsubscribeVisibleLogicalRangeChange(rangeChanged);
    };
  }, [bars, mode, locale, daily, datasetKey, container, context, onRange]);
  return { chart, container, context };
}
