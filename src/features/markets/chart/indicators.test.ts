import { expect, it } from 'vitest';
import { sma, ema, rsi, macd, bollinger } from './indicators';
it('leaves warmup gaps and uses a seeded exponential average', () => {
  expect(sma([1, 2, 3, 4, 5], 3)).toEqual([null, null, 2, 3, 4]);
  expect(ema([1, 2, 3, 6], 3)).toEqual([null, null, 2, 4]);
  expect(sma([2], 3)).toEqual([null]);
});
it('handles rising, falling and unchanged RSI without division errors', () => {
  expect(rsi(Array.from({ length: 20 }, (_, i) => i)).at(-1)).toBe(100);
  expect(rsi(Array.from({ length: 20 }, (_, i) => 20 - i)).at(-1)).toBe(0);
  expect(rsi(Array(20).fill(5)).at(-1)).toBe(50);
  expect(rsi([1, 2])).toEqual([null, null]);
});
it('keeps constant-price Bollinger bands and MACD flat after their warmup', () => {
  const values = Array(60).fill(10);
  const b = bollinger(values);
  expect(b.upper.at(-1)).toBe(10);
  expect(b.lower.at(-1)).toBe(10);
  const m = macd(values);
  expect(m.signal[32]).toBeNull();
  expect(m.signal[33]).toBe(0);
  expect(m.histogram.at(-1)).toBe(0);
});
