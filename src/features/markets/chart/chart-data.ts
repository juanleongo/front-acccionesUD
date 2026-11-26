import type { Candle, CandleFrame } from '../history';

export type Time =
  string | number | { year: number; month: number; day: number };

export type ChartMode = 'candles' | 'line' | 'area';
export type ChartBar = Omit<Candle, 'time'> & { time: Time; timestamp: number };
const marketDay = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/New_York',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

// Alpaca daily bars denote a trading date, not an intraday observation.
// Accept UTC date-only midnight as that date; otherwise resolve NY midnight with DST.
export function sessionDate(timestamp: number): string {
  const date = new Date(timestamp);
  if (date.getUTCHours() === 0 && date.getUTCMinutes() === 0)
    return date.toISOString().slice(0, 10);
  const parts = marketDay.formatToParts(date);
  const part = (name: string) => parts.find((p) => p.type === name)!.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}
export function timeKey(time: Time): string {
  if (typeof time !== 'object') return String(time);
  return `${time.year}-${String(time.month).padStart(2, '0')}-${String(time.day).padStart(2, '0')}`;
}
export function normalizeBars(
  input: readonly Candle[],
  frame: CandleFrame,
): ChartBar[] {
  const unique = new Map<string, ChartBar>();
  for (const bar of [...input].sort((a, b) => a.time - b.time)) {
    if (
      ![bar.time, bar.open, bar.high, bar.low, bar.close].every(
        Number.isFinite,
      ) ||
      bar.low > Math.min(bar.open, bar.close) ||
      bar.high < Math.max(bar.open, bar.close) ||
      bar.low > bar.high ||
      (bar.volume !== undefined &&
        (!Number.isFinite(bar.volume) || bar.volume < 0))
    )
      throw new Error('Invalid OHLCV');
    const time: Time =
      frame === '1Day' ? sessionDate(bar.time) : bar.time / 1000;
    const next = { ...bar, timestamp: bar.time, time };
    const key = timeKey(time);
    const prev = unique.get(key);
    if (
      prev &&
      ['open', 'high', 'low', 'close', 'volume'].some(
        (field) =>
          prev[field as keyof ChartBar] !== next[field as keyof ChartBar],
      )
    )
      throw new Error('Conflicting duplicate bar');
    unique.set(key, next);
  }
  return [...unique.values()];
}
export function pricePrecision(bars: readonly ChartBar[]): number {
  // Retain meaningful provider precision (up to the project's existing 8 decimals).
  let precision = 2;
  for (const bar of bars)
    for (const value of [bar.open, bar.high, bar.low, bar.close]) {
      const decimals =
        value.toFixed(8).replace(/0+$/, '').split('.')[1]?.length ?? 0;
      precision = Math.max(precision, decimals);
    }
  return precision;
}
export function formatChartTime(
  time: Time,
  locale: string,
  intraday: boolean,
  compact = false,
): string {
  let date: Date;
  let timeZone = 'America/New_York';
  if (typeof time === 'number') date = new Date(time * 1000);
  else {
    const day = typeof time === 'string' ? time : timeKey(time);
    date = new Date(`${day}T12:00:00Z`);
    timeZone = 'UTC';
  }
  return new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'es-CO', {
    timeZone,
    ...(compact ? {} : { year: 'numeric' as const }),
    month: 'short',
    day: 'numeric',
    ...(intraday
      ? ({ hour: '2-digit', minute: '2-digit', hour12: false } as const)
      : {}),
  }).format(date);
}
export function latestRange(length: number, count: number) {
  return {
    from: Math.max(-0.5, length - count - 0.5),
    to: Math.max(0.5, length - 0.5),
  };
}
