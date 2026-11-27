'use client';
import { Icon } from '@/components/ui/Icon';
import { useLocale } from '@/lib/i18n';
import { formatMarketDateTime } from '@/lib/formatters';
import type { PublicMarketAsset } from '@/lib/market-explorer';
import { quoteState } from './quote-state';
import styles from './public-market-table.module.css';

export function MarketQuoteStatus({
  asset,
  marketOpen,
  refreshFailed = false,
}: {
  asset: PublicMarketAsset;
  marketOpen: boolean | null;
  refreshFailed?: boolean;
}) {
  const { locale, tx } = useLocale();
  const state = quoteState(asset, marketOpen, refreshFailed);
  const label = {
    missing: tx('Sin cotización', 'Quote unavailable'),
    cached: tx('Última recibida', 'Last received'),
    closed: tx('Última disponible', 'Latest available'),
    stale: tx('Sin cotización reciente', 'No recent quote'),
    delayed: tx('Con demora', 'Delayed'),
    recent: tx('Reciente', 'Recent'),
  }[state];
  return (
    <div className={styles.quoteMeta}>
      <span
        className={styles.quoteStatus}
        data-quote-state={state}
        title={
          state === 'closed'
            ? tx(
                'Mercado cerrado: se conserva la última cotización recibida, con su fecha real.',
                'Market closed: the last received quote is retained with its actual timestamp.',
              )
            : undefined
        }
      >
        <Icon
          name={
            state === 'recent' ? 'check' : state === 'closed' ? 'moon' : 'info'
          }
          size={13}
        />
        {label}
      </span>
      <time className={styles.quoteTime} dateTime={asset.as_of ?? undefined}>
        {asset.as_of ? formatMarketDateTime(asset.as_of, locale) : '—'}
      </time>
      {asset.feed !== 'unknown' && (
        <span className={styles.feed}>
          {asset.feed}
          {asset.is_delayed && state !== 'delayed'
            ? ` · ${tx('Con demora', 'Delayed')}`
            : ''}
        </span>
      )}
    </div>
  );
}
