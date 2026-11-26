import type { EChartsCoreOption } from 'echarts/core';
import {
  formatChartTime,
  pricePrecision,
  timeKey,
  type ChartBar,
  type ChartMode,
} from './chart-data';
import { sma, ema, bollinger, rsi, macd, type Indicator } from './indicators';
export type { Drawing, DrawingPoint } from './drawing-model';
export type ViewRange = { from: number; to: number };
export function chartPalette(element: HTMLElement) {
  const css = getComputedStyle(element);
  const token = (name: string) => css.getPropertyValue(name).trim();
  return {
    text: token('--color-text-muted'),
    grid: token('--color-border-subtle'),
    border: token('--color-border'),
    background: token('--color-surface'),
    up: token('--color-chart-up'),
    down: token('--color-chart-down'),
    primary: token('--color-primary'),
    neutral: token('--color-text-muted'),
    font: token('--font-family-body'),
    upFill: token('--color-chart-up-fill'),
    downFill: token('--color-chart-down-fill'),
    transparent: token('--color-chart-transparent'),
  };
}
export function financialOption(
  element: HTMLElement,
  bars: readonly ChartBar[],
  mode: ChartMode,
  locale: string,
  daily: boolean,
  indicator: Indicator,
  volume: boolean,
  range: ViewRange,
): EChartsCoreOption {
  const c = chartPalette(element),
    precision = pricePrecision(bars);
  const numeric = new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'es-CO', {
    maximumFractionDigits: precision,
  });
  const values = bars.map((b) => b.close),
    times = bars.map((b) => timeKey(b.time));
  const color =
    values.length > 1 && values[0] !== values.at(-1)
      ? values.at(-1)! > values[0]!
        ? c.up
        : c.down
      : c.neutral;
  const byTime = new Map(bars.map((bar) => [timeKey(bar.time), bar]));
  const lower = indicator === 'rsi' || indicator === 'macd';
  const mainBottom = lower ? 46 : volume ? 33 : 15;
  const grid = [
    { left: 12, right: 85, top: 20, bottom: `${mainBottom}%` },
    ...(volume
      ? [
          {
            left: 12,
            right: 85,
            top: lower ? '57%' : '72%',
            height: lower ? '12%' : '14%',
          },
        ]
      : []),
    ...(lower
      ? [{ left: 12, right: 85, top: volume ? '73%' : '61%', bottom: '15%' }]
      : []),
  ];

  const axes = grid.map((_, index) => ({
    type: 'category',
    data: times,
    gridIndex: index,
    boundaryGap: mode === 'candles',
    axisLine: { lineStyle: { color: c.border } },
    axisTick: { show: false },
    axisLabel: {
      show: index === grid.length - 1,
      color: c.text,
      hideOverlap: true,
      formatter: (value: string) => {
        const bar = byTime.get(value);
        return bar ? formatChartTime(bar.time, locale, !daily) : '';
      },
    },
    axisPointer: {
      label: {
        show: true,
        formatter: (info: { value: string | number }) => {
          const bar =
            typeof info.value === 'number'
              ? bars[info.value]
              : byTime.get(info.value);
          return bar ? formatChartTime(bar.time, locale, !daily) : '';
        },
      },
    },
  }));
  const series: Record<string, unknown>[] = [
    {
      id: 'price',
      name: daily ? 'OHLC' : 'OHLC · ET',
      type: mode === 'candles' ? 'candlestick' : 'line',
      xAxisIndex: 0,
      yAxisIndex: 0,
      data:
        mode === 'candles'
          ? bars.map((b) => [b.open, b.close, b.low, b.high])
          : values,
      symbol: 'none',
      smooth: false,
      connectNulls: false,
      itemStyle: {
        color: mode === 'candles' ? c.up : color,
        color0: c.down,
        borderColor: c.up,
        borderColor0: c.down,
      },
      lineStyle: { color, width: 2 },
      ...(mode === 'area' ? { areaStyle: { color, opacity: 0.16 } } : {}),
    },
  ];
  const addLine = (
    id: string,
    name: string,
    data: (number | null)[],
    axis = 0,
    dashed = false,
  ) =>
    series.push({
      id,
      name,
      type: 'line',
      data,
      xAxisIndex: axis,
      yAxisIndex: axis,
      symbol: 'none',
      connectNulls: false,
      smooth: false,
      lineStyle: {
        width: 1.5,
        color: c.primary,
        type: dashed ? 'dashed' : 'solid',
      },
      itemStyle: { color: c.primary },
    });
  if (indicator === 'sma') addLine('sma', 'SMA 20', sma(values, 20));
  if (indicator === 'ema') addLine('ema', 'EMA 20', ema(values, 20));
  if (indicator === 'bollinger') {
    const b = bollinger(values);
    addLine('bb-mid', 'BB 20', b.middle);
    addLine('bb-up', 'BB +2σ', b.upper, 0, true);
    addLine('bb-low', 'BB −2σ', b.lower, 0, true);
  }
  if (volume)
    series.push({
      id: 'volume',
      name: locale === 'en' ? 'Volume' : 'Volumen',
      type: 'bar',
      xAxisIndex: 1,
      yAxisIndex: 1,
      data: bars.map((b) =>
        b.volume === undefined
          ? null
          : {
              value: b.volume,
              itemStyle: {
                color: b.close >= b.open ? c.up : c.down,
                opacity: 0.55,
              },
            },
      ),
    });
  if (indicator === 'rsi')
    addLine('rsi', 'RSI 14', rsi(values), grid.length - 1);
  if (indicator === 'macd') {
    const m = macd(values);
    addLine('macd', 'MACD 12/26', m.line, grid.length - 1);
    addLine(
      'signal',
      locale === 'en' ? 'Signal 9' : 'Señal 9',
      m.signal,
      grid.length - 1,
      true,
    );
    series.push({
      id: 'histogram',
      name: 'MACD Δ',
      type: 'bar',
      xAxisIndex: grid.length - 1,
      yAxisIndex: grid.length - 1,
      data: m.histogram.map((v) =>
        v === null
          ? null
          : { value: v, itemStyle: { color: v >= 0 ? c.up : c.down } },
      ),
    });
  }
  return {
    animation: false,
    backgroundColor: c.background,
    textStyle: { fontFamily: c.font, color: c.text },
    grid,
    xAxis: axes,
    yAxis: grid.map((_, index) => ({
      type: 'value',
      gridIndex: index,
      position: 'right',
      scale: true,
      splitNumber: index === 0 ? 5 : 2,
      ...(volume && index === 1 ? { min: 0 } : {}),
      ...(indicator === 'rsi' && index === grid.length - 1
        ? { min: 0, max: 100 }
        : {}),
      splitLine: {
        show: index === 0,
        lineStyle: { color: c.grid, type: 'dashed' },
      },
      axisLabel: {
        color: c.text,
        fontSize: 11,
        hideOverlap: true,
        formatter: (v: number) => numeric.format(v),
      },
      axisPointer: { label: { precision } },
    })),
    tooltip: {
      trigger: 'axis',
      confine: true,
      formatter: (params: unknown) => {
        const entries = (Array.isArray(params) ? params : [params]) as {
          dataIndex?: number;
          seriesId?: string;
          seriesName?: string;
          value?: unknown;
        }[];
        const bar = bars[entries[0]?.dataIndex ?? -1];
        if (!bar) return '';
        const en = locale === 'en';
        const lines = [
          formatChartTime(bar.time, locale, !daily) + (daily ? '' : ' ET'),
          `${en ? 'Open' : 'Apertura'}  ${numeric.format(bar.open)}   ${en ? 'High' : 'Máximo'}  ${numeric.format(bar.high)}`,
          `${en ? 'Low' : 'Mínimo'}  ${numeric.format(bar.low)}   ${en ? 'Close' : 'Cierre'}  ${numeric.format(bar.close)}`,
        ];
        if (bar.volume !== undefined)
          lines.push(
            `${en ? 'Volume' : 'Volumen'}  ${numeric.format(bar.volume)}`,
          );
        for (const entry of entries)
          if (
            entry.seriesId !== 'price' &&
            entry.seriesId !== 'volume' &&
            typeof entry.value === 'number'
          )
            lines.push(`${entry.seriesName}  ${numeric.format(entry.value)}`);
        return lines.join('\n');
      },
      renderMode: 'richText',
      backgroundColor: c.background,
      borderColor: c.border,
      textStyle: { color: c.text },
      axisPointer: {
        type: 'cross',
        label: { backgroundColor: c.background, color: c.text },
        lineStyle: { color: c.text },
      },
    },
    axisPointer: { link: [{ xAxisIndex: 'all' }] },
    dataZoom: [
      {
        type: 'inside',
        xAxisIndex: grid.map((_, i) => i),
        filterMode: 'filter',
        startValue: Math.max(0, Math.ceil(range.from)),
        endValue: Math.min(bars.length - 1, Math.floor(range.to)),
        preventDefaultMouseMove: false,
        moveOnMouseMove: true,
      },
      {
        type: 'slider',
        xAxisIndex: grid.map((_, i) => i),
        bottom: 5,
        height: 20,
        borderColor: c.border,
        textStyle: { color: c.text },
        showDetail: false,
        brushSelect: false,
      },
    ],
    series,
  };
}
