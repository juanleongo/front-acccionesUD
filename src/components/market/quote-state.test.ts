import { expect, it } from 'vitest';
import { quoteState } from './quote-state';
import type { PublicMarketAsset } from '@/lib/market-explorer';
const asset: PublicMarketAsset = {
  symbol: 'AAPL',
  name: 'Apple',
  exchange: 'NASDAQ',
  tradable: true,
  price: 150,
  change_ratio: 0.02,
  as_of: '2026-11-25T21:00:00Z',
  feed: 'iex',
  is_delayed: false,
  is_stale: true,
};
it('explains a closed session without changing or refreshing the provider timestamp', () => {
  expect(quoteState(asset, false)).toBe('closed');
  expect(asset.as_of).toBe('2026-11-25T21:00:00Z');
  expect(asset.is_stale).toBe(true);
});
it('retains stale warnings for open/unknown sessions and clears them only for a fresh provider result', () => {
  expect(quoteState(asset, true)).toBe('stale');
  expect(quoteState(asset, null)).toBe('stale');
  expect(quoteState({ ...asset, is_stale: false }, true)).toBe('recent');
  expect(quoteState({ ...asset, is_stale: false }, true, true)).toBe('cached');
  expect(
    quoteState({ ...asset, is_stale: false, is_delayed: true }, true),
  ).toBe('delayed');
});
it('does not label unavailable prices or missing timestamps as a valid closed-session quote', () => {
  expect(quoteState({ ...asset, price: null }, false)).toBe('missing');
  expect(quoteState({ ...asset, as_of: null }, false)).toBe('missing');
});
