'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { LoadingState } from '@/components/ui/LoadingState';
import { AssetLogo } from '@/components/market/AssetLogo';
import { QUERY_STALE_TIMES, queryKeys } from '@/lib/api';
import { formatMarketDateTime, formatUsd } from '@/lib/formatters';
import { useLocale } from '@/lib/i18n';
import { getInstrumentQuote } from '../trading-api';
import { useInstrumentSession } from '../use-instrument-session';
import styles from '../order-guidance.module.css';

export function InstrumentQuoteCard({ symbol }: { symbol: string }) {
  const { locale, tx } = useLocale();
  const [refreshing, setRefreshing] = useState(false);
  const [checked, setChecked] = useState<{
    at: number;
    changed: boolean;
    stale: boolean;
  } | null>(null);
  const quote = useQuery({
    queryKey: queryKeys.instruments.quote(symbol),
    queryFn: ({ signal }) => getInstrumentQuote(symbol, signal),
    staleTime: QUERY_STALE_TIMES.realtime,
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
    retry: false,
  });
  const data = quote.data;
  const session = useInstrumentSession(
    symbol,
    Boolean(data?.is_stale || data?.is_delayed),
  );
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
          disabled={quote.isFetching || refreshing}
          aria-busy={quote.isFetching || refreshing}
          onClick={async () => {
            if (refreshing) return;
            setRefreshing(true);
            try {
              setChecked(null);
              const before = JSON.stringify([
                data?.last_trade_price,
                data?.bid_price,
                data?.ask_price,
              ]);
              const [result] = await Promise.all([
                quote.refetch(),
                session.refresh(),
              ]);
              if (result.isSuccess && result.data) {
                const next = result.data;
                setChecked({
                  at: Date.now(),
                  stale: next.is_stale,
                  changed:
                    before !==
                    JSON.stringify([
                      next.last_trade_price,
                      next.bid_price,
                      next.ask_price,
                    ]),
                });
              }
            } finally {
              setRefreshing(false);
            }
          }}
        >
          {quote.isFetching || refreshing
            ? tx('Consultando…', 'Checking…')
            : tx('Actualizar precio', 'Refresh price')}
        </button>
      </div>
      {checked && (
        <p role="status" className={styles.hint}>
          {checked.stale
            ? tx(
                'Consulta completada. No hay una cotización más reciente disponible.',
                'Check complete. No newer quote is available.',
              )
            : checked.changed
              ? tx('Precio actualizado.', 'Price updated.')
              : tx(
                  'Cotización consultada. El precio no ha cambiado.',
                  'Quote checked. The price has not changed.',
                )}{' '}
          ·{' '}
          {formatMarketDateTime(new Date(checked.at).toISOString(), locale, {
            timeZone: 'America/New_York',
          })}{' '}
          ET
        </p>
      )}
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
              ? `${formatMarketDateTime(timestamp, locale, { timeZone: 'America/New_York' })} · ET`
              : tx(
                  'Fecha de cotización no informada',
                  'Quote timestamp unavailable',
                )}{' '}
            · {data.source}
          </p>
          {data.served_from_cache ? (
            <p className={styles.warning}>
              {tx(
                'Referencia guardada: la fuente no respondió con una nueva cotización. La fecha del dato se muestra arriba.',
                'Saved reference: the source did not return a new quote. Its timestamp is shown above.',
              )}
            </p>
          ) : session.checking ? (
            <p className={styles.info}>
              {tx(
                'Consultando la sesión de la bolsa… La fecha del precio disponible se muestra arriba.',
                'Checking the exchange session… The available price timestamp is shown above.',
              )}
            </p>
          ) : session.state === 'closed' ? (
            <p className={styles.info}>
              {tx(
                'Mercado cerrado. Mostramos la última cotización disponible. Actualizar vuelve a consultar la fuente; los precios pueden mantenerse hasta una nueva sesión.',
                'Market closed. Showing the latest available quote. Refresh checks the source again; prices may remain unchanged until a new session.',
              )}
            </p>
          ) : (
            (data.is_delayed || data.is_stale) && (
              <p className={styles.warning}>
                {data.is_stale
                  ? tx(
                      'Precio de referencia. La fuente aún no informa una cotización reciente; comprueba la fecha antes de continuar.',
                      'Reference price. The source has not provided a recent quote; check its timestamp before continuing.',
                    )
                  : tx(
                      'Cotización con retraso; no representa necesariamente el precio actual.',
                      'Delayed quote; it may not reflect the current price.',
                    )}
              </p>
            )
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
