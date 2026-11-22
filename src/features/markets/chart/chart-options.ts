import {
  ColorType,
  CrosshairMode,
  LineStyle,
  LineType,
  TickMarkType,
  type DeepPartial,
  type ChartOptions,
  type Time,
} from 'lightweight-charts';
import { formatChartTime, pricePrecision, type ChartBar } from './chart-data';

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
    neutral: token('--color-text-muted'),
    font: token('--font-family-body'),
    upFill: token('--color-chart-up-fill'),
    downFill: token('--color-chart-down-fill'),
    neutralFill: token('--color-chart-neutral-fill'),
    transparent: token('--color-chart-transparent'),
  };
}
export function chartOptions(
  element: HTMLElement,
  locale: string,
  daily: boolean,
): DeepPartial<ChartOptions> {
  const c = chartPalette(element);
  return {
    autoSize: true,
    layout: {
      background: { type: ColorType.Solid, color: c.background },
      textColor: c.text,
      fontFamily: c.font,
      fontSize: 13,
      attributionLogo: true,
    },
    grid: { vertLines: { visible: false }, horzLines: { color: c.grid } },
    crosshair: {
      mode: CrosshairMode.Normal,
      vertLine: { color: c.text, style: LineStyle.Dashed, width: 1 },
      horzLine: { color: c.text, style: LineStyle.Dashed, width: 1 },
    },
    rightPriceScale: {
      autoScale: true,
      borderColor: c.border,
      scaleMargins: { top: 0.1, bottom: 0.1 },
      minimumWidth: 64,
    },
    timeScale: {
      borderColor: c.border,
      timeVisible: !daily,
      secondsVisible: false,
      minBarSpacing: 0.1,
      rightOffset: 2,
      shiftVisibleRangeOnNewBar: false,
      tickMarkFormatter: (time: Time, type: TickMarkType) => {
        const date =
          typeof time === 'number'
            ? new Date(time * 1000)
            : new Date(
                `${typeof time === 'string' ? time : `${time.year}-${String(time.month).padStart(2, '0')}-${String(time.day).padStart(2, '0')}`}T12:00:00Z`,
              );
        const options: Intl.DateTimeFormatOptions = {
          timeZone: typeof time === 'number' ? 'America/New_York' : 'UTC',
        };
        if (type === TickMarkType.Year) options.year = 'numeric';
        else if (type === TickMarkType.Month) options.month = 'short';
        else if (type === TickMarkType.DayOfMonth) options.day = 'numeric';
        else {
          options.hour = '2-digit';
          options.minute = '2-digit';
          options.hour12 = false;
        }
        return new Intl.DateTimeFormat(
          locale === 'en' ? 'en-US' : 'es-CO',
          options,
        ).format(date);
      },
    },
    localization: {
      locale: locale === 'en' ? 'en-US' : 'es-CO',
      timeFormatter: (time: Time) => formatChartTime(time, locale, !daily),
    },
    handleScroll: {
      mouseWheel: true,
      pressedMouseMove: true,
      horzTouchDrag: true,
      vertTouchDrag: false,
    },
    handleScale: {
      mouseWheel: true,
      pinch: true,
      axisPressedMouseMove: true,
      axisDoubleClickReset: true,
    },
  };
}
export function seriesOptions(element: HTMLElement, bars: readonly ChartBar[]) {
  const c = chartPalette(element);
  const first = bars[0]?.close,
    last = bars.at(-1)?.close;
  const direction =
    first !== undefined && first !== 0 && last !== undefined && bars.length > 1
      ? Math.sign(last - first)
      : 0;
  const color = direction > 0 ? c.up : direction < 0 ? c.down : c.neutral;
  const precision = pricePrecision(bars);
  return {
    priceFormat: {
      type: 'price' as const,
      precision,
      minMove: 10 ** -precision,
    },
    priceLineVisible: true,
    lastValueVisible: true,
    lineWidth: 2 as const,
    lineType: LineType.Simple,
    color,
    lineColor: color,
    topColor:
      direction > 0 ? c.upFill : direction < 0 ? c.downFill : c.neutralFill,
    bottomColor: c.transparent,
    upColor: c.up,
    downColor: c.down,
    wickUpColor: c.up,
    wickDownColor: c.down,
    borderUpColor: c.up,
    borderDownColor: c.down,
    borderVisible: false,
    wickVisible: true,
  };
}
