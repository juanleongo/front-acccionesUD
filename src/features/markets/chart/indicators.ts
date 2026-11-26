export type Indicator = 'none' | 'sma' | 'ema' | 'bollinger' | 'rsi' | 'macd';
export type NullableSeries = (number | null)[];

export function sma(values: readonly number[], period: number): NullableSeries {
  if (!Number.isInteger(period) || period < 1)
    throw new Error('Invalid period');
  let sum = 0;
  return values.map((value, index) => {
    sum += value;
    if (index >= period) sum -= values[index - period]!;
    return index + 1 < period ? null : sum / period;
  });
}
export function ema(values: readonly number[], period: number): NullableSeries {
  const seed = sma(values, period);
  let previous: number | null = null;
  return values.map((value, index) => {
    if (index < period - 1) return null;
    previous =
      previous === null
        ? seed[index]!
        : value * (2 / (period + 1)) + previous * (1 - 2 / (period + 1));
    return previous;
  });
}
export function bollinger(values: readonly number[], period = 20) {
  const middle = sma(values, period);
  const deviation = middle.map((mean, index) =>
    mean === null
      ? null
      : Math.sqrt(
          values
            .slice(index - period + 1, index + 1)
            .reduce((sum, value) => sum + (value - mean) ** 2, 0) / period,
        ) * 2,
  );
  return {
    middle,
    upper: middle.map((v, i) => (v === null ? null : v + deviation[i]!)),
    lower: middle.map((v, i) => (v === null ? null : v - deviation[i]!)),
  };
}
export function rsi(values: readonly number[], period = 14): NullableSeries {
  let gain = 0,
    loss = 0;
  return values.map((value, index) => {
    if (index === 0) return null;
    const delta = value - values[index - 1]!;
    if (index <= period) {
      gain += Math.max(0, delta) / period;
      loss += Math.max(0, -delta) / period;
    } else {
      gain = (gain * (period - 1) + Math.max(0, delta)) / period;
      loss = (loss * (period - 1) + Math.max(0, -delta)) / period;
    }
    if (index < period) return null;
    return loss === 0 ? (gain === 0 ? 50 : 100) : 100 - 100 / (1 + gain / loss);
  });
}
export function macd(values: readonly number[]) {
  const fast = ema(values, 12),
    slow = ema(values, 26);
  const line = values.map((_, i) =>
    fast[i] == null || slow[i] == null ? null : fast[i]! - slow[i]!,
  );
  const signalSeed = ema(
    line.filter((v): v is number => v !== null),
    9,
  );
  let next = 0;
  const signal = line.map((v) => (v === null ? null : signalSeed[next++]!));
  return {
    line,
    signal,
    histogram: line.map((v, i) =>
      v === null || signal[i] == null ? null : v - signal[i]!,
    ),
  };
}
