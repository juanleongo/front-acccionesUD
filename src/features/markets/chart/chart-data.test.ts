import { expect, it } from 'vitest';
import type { UTCTimestamp } from 'lightweight-charts';
import {
  normalizeBars,
  sessionDate,
  formatChartTime,
  pricePrecision,
  latestRange,
} from './chart-data';
const bar = {
  time: Date.parse('2026-11-19T05:00:00Z'),
  open: 3.475,
  high: 3.5,
  low: 3.4,
  close: 3.475,
  price: 3.475,
  volume: 20,
};
it('preserves doji OHLCV and deduplicates only identical records in ascending order', () => {
  const earlier = { ...bar, time: bar.time - 60000 };
  const normalized = normalizeBars([bar, earlier, bar], '1Min');
  expect(normalized).toHaveLength(2);
  expect(normalized[1]).toMatchObject({
    open: bar.open,
    high: bar.high,
    low: bar.low,
    close: bar.close,
    volume: 20,
    time: bar.time / 1000,
  });
});
it('rejects invalid or conflicting data instead of adjusting prices', () => {
  expect(() => normalizeBars([{ ...bar, high: 1 }], '1Min')).toThrow();
  expect(() => normalizeBars([{ ...bar, close: NaN }], '1Min')).toThrow();
  expect(() => normalizeBars([bar, { ...bar, close: 3.48 }], '1Min')).toThrow();
});
it('preserves trading dates through DST and UTC date-only bars', () => {
  expect(sessionDate(Date.parse('2026-07-10T04:00:00Z'))).toBe('2026-07-10');
  expect(sessionDate(Date.parse('2026-11-19T05:00:00Z'))).toBe('2026-11-19');
  expect(sessionDate(Date.parse('2026-11-19T00:00:00Z'))).toBe('2026-11-19');
  expect(
    formatChartTime(
      (Date.parse('2026-07-10T14:00:00Z') / 1000) as UTCTimestamp,
      'en',
      true,
    ),
  ).toContain('10:00');
  expect(
    formatChartTime(
      (Date.parse('2026-11-19T14:00:00Z') / 1000) as UTCTimestamp,
      'en',
      true,
    ),
  ).toContain('09:00');
});
it('retains small-price precision and an actual sixty-bar viewport', () => {
  expect(pricePrecision(normalizeBars([bar], '1Day'))).toBe(3);
  expect(
    pricePrecision(
      normalizeBars(
        [
          {
            ...bar,
            open: 0.00001234,
            low: 0.00001,
            high: 0.00002,
            close: 0.00001234,
          },
        ],
        '1Day',
      ),
    ),
  ).toBe(8);
  const range = latestRange(1100, 60);
  expect(range.to - range.from).toBe(60);
  expect(range.to).toBe(1099.5);
});
