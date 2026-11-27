import type { PublicMarketAsset } from '@/lib/market-explorer';

/** Session context changes the label, never the quote timestamp or provider flags. */
export function quoteState(
  asset: PublicMarketAsset,
  marketOpen: boolean | null,
  refreshFailed = false,
) {
  if (asset.price === null || !asset.as_of) return 'missing';
  if (refreshFailed) return 'cached';
  if (marketOpen === false) return 'closed';
  if (asset.is_stale) return 'stale';
  if (asset.is_delayed) return 'delayed';
  return 'recent';
}
