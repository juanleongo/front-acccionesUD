'use client';

import { useQuery } from '@tanstack/react-query';
import { LoadingState } from '@/components/ui/LoadingState';
import { AssetLogo } from '@/components/market/AssetLogo';
import { QUERY_STALE_TIMES, queryKeys } from '@/lib/api';
import { formatMarketDateTime, formatUsd } from '@/lib/formatters';
import { useLocale } from '@/lib/i18n';
import { getInstrumentQuote } from '../trading-api';
import styles from '../order-guidance.module.css';

export function InstrumentQuoteCard({ symbol }: { symbol: string }) {
  const { locale, tx } = useLocale();
  const quote = useQuery({
    queryKey: queryKeys.instruments.quote(symbol),
    queryFn: ({ signal }) => getInstrumentQuote(symbol, signal),
    staleTime: QUERY_STALE_TIMES.realtime,
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
    retry: false,
  });
  const data = quote.data;
  const price = (value: string | null | undefined) =>
    data?.currency === 'USD' &&
    value != null &&
    Number.isFinite(Number(value)) &&
    Number(value) > 0
      ? formatUsd(value, { withCode: true, maximumFractionDigits: 4 })
      : '—';
  const timestamp = data?.updated_at ?? data?.as_of;
  return (
    <section
      className={styles.quote}
      aria-label={tx(`Precio de ${symbol}`, `${symbol} price`)}
    >
      <div className={styles.header}>
        <div className={styles.quoteIdentity}>
          <AssetLogo symbol={symbol} />
          <h3 className={styles.title}>
            {symbol} · {tx('Precio por acción', 'Price per share')}
          </h3>
        </div>
        <button
          type="button"
          className={styles.refresh}
          disabled={quote.isFetching}
          onClick={() => {
            void quote.refetch();
          }}
        >
          {tx('Actualizar precio', 'Refresh price')}
        </button>
      </div>
      {quote.isPending ? (
        <LoadingState
          mode="compact"
          label={tx('Consultando precio…', 'Loading price…')}
        />
      ) : quote.isError ? (
        <p className={styles.warning}>
          {tx(
            'No pudimos actualizar la cotización. Reintenta antes de tomar este precio como referencia.',
            'Could not refresh the quote. Retry before relying on this price.',
          )}
        </p>
      ) : null}
      {data && (
        <>
          <span className={styles.label}>
            {tx('Última operación disponible', 'Latest available trade')}
          </span>
          <strong className={styles.price}>
            {price(data.last_trade_price)}
          </strong>
          <p className={styles.meta}>
            {timestamp
              ? `${formatMarketDateTime(timestamp, locale)} · ET`
              : tx(
                  'Fecha de cotización no informada',
                  'Quote timestamp unavailable',
                )}{' '}
            · {data.source}
          </p>
          {(data.is_delayed || data.is_stale) && (
            <p className={styles.warning}>
              {data.is_stale
                ? tx(
                    'Dato antiguo: actualiza o consulta la vista previa para obtener una nueva referencia.',
                    'Stale data: refresh or request a preview for a new reference.',
                  )
                : tx(
                    'Cotización con retraso; no representa necesariamente el precio actual.',
                    'Delayed quote; it may not reflect the current price.',
                  )}
            </p>
          )}
          {data.currency !== 'USD' && (
            <p className={styles.warning}>
              {tx(
                'No se confirmó una cotización en USD.',
                'A USD quote could not be confirmed.',
              )}
            </p>
          )}
          <dl className={styles.quoteSides}>
            <div>
              <dt>{tx('Oferta de venta (ask)', 'Ask: sellers offer')}</dt>
              <dd>{price(data.ask_price)}</dd>
            </div>
            <div>
              <dt>{tx('Oferta de compra (bid)', 'Bid: buyers offer')}</dt>
              <dd>{price(data.bid_price)}</dd>
            </div>
          </dl>
          <p className={styles.hint}>
            {tx(
              'Al comprar se toma la oferta de venta disponible; al vender, la oferta de compra. El precio final puede variar.',
              'Buys match available asks; sells match available bids. The final execution price may differ.',
            )}
          </p>
        </>
      )}
    </section>
  );
}
