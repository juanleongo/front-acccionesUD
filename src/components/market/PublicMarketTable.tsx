'use client';
import { useId, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Icon } from '@/components/ui/Icon';
import { MarketQuoteStatus } from './MarketQuoteStatus';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { AssetLogo } from './AssetLogo';
import { LoadingState } from '@/components/ui/LoadingState';
import { useLocale } from '@/lib/i18n';
import { formatDecimalNumber, formatPercent } from '@/lib/formatters';
import {
  getPublicMarketPage,
  type PublicMarketAsset,
} from '@/lib/market-explorer';
import styles from './public-market-table.module.css';

export function PublicMarketTable({
  exchange = '',
  onSelect,
}: {
  exchange?: string;
  onSelect?: (asset: PublicMarketAsset) => void;
}) {
  const { locale, tx } = useLocale();
  const id = useId();
  const [draft, setDraft] = useState('');
  const [q, setQ] = useState('');
  const [selectedExchange, setExchange] = useState(exchange);
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ['public-market-explorer', q, selectedExchange, page],
    queryFn: ({ signal }) =>
      getPublicMarketPage(q, selectedExchange, page, signal),
    staleTime: 30_000,
    refetchInterval: 30_000,
    refetchOnWindowFocus: 'always',
    refetchOnReconnect: 'always',
    retry: false,
  });
  const data = query.data;
  const exchanges = data?.markets ?? [];
  const exchangeOptions =
    selectedExchange &&
    !exchanges.some((market) => market.code === selectedExchange)
      ? [...exchanges, { code: selectedExchange, name: selectedExchange }]
      : exchanges;
  const checkedAt = data
    ? new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'es-CO', {
        timeZone: 'America/New_York',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }).format(new Date(data.retrieved_at))
    : '';
  const pages = data ? Math.max(1, Math.ceil(data.total / data.page_size)) : 1;
  return (
    <div className={styles.panel} aria-busy={query.isFetching}>
      <div className={styles.controls}>
        <form
          noValidate
          className={styles.search}
          onSubmit={(event) => {
            event.preventDefault();
            setQ(draft.trim());
            setPage(1);
          }}
        >
          <label htmlFor={`${id}-search`}>
            {tx('Empresa o símbolo', 'Company or symbol')}
          </label>
          <div className={styles.searchRow}>
            <div className={styles.searchInput}>
              <Icon name="search" size={18} />
              <input
                id={`${id}-search`}
                value={draft}
                maxLength={50}
                placeholder={tx('Ej. Apple o AAPL', 'E.g. Apple or AAPL')}
                onChange={(event) => setDraft(event.target.value)}
              />
            </div>
            <button
              className={`${styles.button} ${styles.searchButton}`}
              type="submit"
            >
              {tx('Buscar', 'Search')}
            </button>
          </div>
        </form>
        <div className={styles.exchange}>
          <label htmlFor={`${id}-exchange`}>{tx('Bolsa', 'Exchange')}</label>
          <CustomSelect
            id={`${id}-exchange`}
            value={selectedExchange}
            onChange={(value) => {
              setExchange(value);
              setPage(1);
            }}
            options={[
              { value: '', label: tx('Todas las bolsas', 'All exchanges') },
              ...exchangeOptions.map((market) => ({
                value: market.code,
                label: `${market.name} (${market.code})`,
              })),
            ]}
          />
        </div>
        <button
          className={styles.refresh}
          type="button"
          disabled={query.isFetching}
          aria-busy={query.isFetching}
          onClick={() => query.refetch()}
        >
          <Icon name="exchange" size={17} />
          {query.isFetching
            ? tx('Actualizando…', 'Refreshing…')
            : tx('Actualizar', 'Refresh')}
        </button>
      </div>
      <div className={styles.summary}>
        <span className={styles.source}>
          <Icon name="globe" size={16} />
          Alpaca <span>USD</span>
        </span>
        <span>
          {data
            ? `${data.total.toLocaleString(locale === 'en' ? 'en-US' : 'es-CO')} ${tx('instrumentos', 'instruments')}`
            : tx('Catálogo bursátil', 'Asset catalog')}
        </span>
        {data && (
          <span
            className={styles.session}
            data-session={
              query.isError || data.market_open === null
                ? 'unknown'
                : data.market_open
                  ? 'open'
                  : 'closed'
            }
          >
            <span className={styles.sessionDot} />
            {query.isError
              ? tx('Sesión sin verificar', 'Session unverified')
              : data.market_open === null
                ? tx(
                    'Estado de sesión no disponible',
                    'Session status unavailable',
                  )
                : data.market_open
                  ? tx('Sesión abierta', 'Session open')
                  : tx('Sesión cerrada', 'Session closed')}
          </span>
        )}
      </div>
      {query.isPending ? (
        <LoadingState label={tx('Cargando acciones…', 'Loading stocks…')} />
      ) : query.isError && !data ? (
        <div className={styles.feedback} role="alert">
          <span className={styles.feedbackIcon}>
            <Icon name="info" size={27} />
          </span>
          <strong>
            {tx(
              'No pudimos actualizar el mercado.',
              'Could not refresh market data.',
            )}
          </strong>
          <p>
            {tx(
              'Reintenta para consultar los datos disponibles.',
              'Retry to view available data.',
            )}
          </p>
          <button
            className={styles.button}
            type="button"
            onClick={() => query.refetch()}
          >
            {tx('Reintentar', 'Retry')}
          </button>
        </div>
      ) : (
        data && (
          <>
            <div className={styles.syncBar} role="status" aria-live="off">
              <span className={styles.syncLabel}>
                <span className={styles.sessionDot} />
                {query.isFetching
                  ? tx('Consultando el mercado…', 'Checking market data…')
                  : tx(
                      'Consulta automática cada 30 s',
                      'Automatic check every 30 s',
                    )}
              </span>
              <span>
                {tx('Última consulta', 'Last checked')} ·{' '}
                <time dateTime={data.retrieved_at}>{checkedAt} ET</time>
              </span>
            </div>
            {query.isError && (
              <div className={styles.notice} data-tone="warning" role="status">
                <Icon name="info" size={20} />
                <div>
                  <strong>
                    {tx(
                      'No pudimos renovar las cotizaciones.',
                      'Could not refresh quotes.',
                    )}
                  </strong>
                  <p>
                    {tx(
                      'Conservamos la última información recibida y su hora de cotización. Reintenta en unos instantes.',
                      'The last received data and quote timestamps are retained. Try again shortly.',
                    )}
                  </p>
                </div>
              </div>
            )}
            {data.market_open === false && !query.isError && (
              <div className={styles.notice} data-tone="neutral">
                <Icon name="moon" size={20} />
                <div>
                  <strong>
                    {tx(
                      'Mercado cerrado · última cotización disponible',
                      'Market closed · latest available quote',
                    )}
                  </strong>
                  <p>
                    {tx(
                      'Seguimos consultando cada 30 segundos. La fecha del precio cambia cuando el proveedor entrega una nueva cotización.',
                      'We keep checking every 30 seconds. The quote timestamp changes when the provider delivers a new quote.',
                    )}
                  </p>
                </div>
              </div>
            )}
            <div
              className={styles.scroll}
              role="region"
              aria-label={tx('Tabla de acciones', 'Stock table')}
              tabIndex={0}
            >
              <table className={styles.table}>
                <thead>
                  <tr>
                    {[
                      tx('Empresa / símbolo', 'Company / symbol'),
                      tx('Bolsa', 'Exchange'),
                      tx('Precio · USD', 'Price · USD'),
                      tx('Variación diaria', 'Daily change'),
                      tx('Actualización · ET', 'Updated · ET'),
                      tx('Disponibilidad', 'Availability'),
                    ].map((label) => (
                      <th key={label} scope="col">
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.results.map((asset, index) => (
                    <tr
                      key={asset.symbol}
                      style={{ animationDelay: `${index * 45}ms` }}
                    >
                      <th scope="row">
                        <div className={styles.company}>
                          <AssetLogo
                            symbol={asset.symbol}
                            exchange={asset.exchange}
                          />
                          <span>
                            {onSelect ? (
                              <button
                                type="button"
                                className={styles.symbol}
                                onClick={() => onSelect(asset)}
                              >
                                {asset.symbol}
                              </button>
                            ) : (
                              <Link className={styles.symbol} href="/login">
                                {asset.symbol}
                              </Link>
                            )}
                            <span className={styles.name}>{asset.name}</span>
                          </span>
                        </div>
                      </th>
                      <td>
                        <span className={styles.exchangeBadge}>
                          {asset.exchange}
                        </span>
                      </td>
                      <td>
                        <strong
                          className={styles.quotePrice}
                          key={`${asset.symbol}:${asset.price}`}
                        >
                          {asset.price === null
                            ? '—'
                            : formatDecimalNumber(asset.price, locale, 8)}
                        </strong>
                      </td>
                      <td>
                        <span
                          className={styles.change}
                          data-direction={
                            asset.change_ratio === null ||
                            asset.change_ratio === 0
                              ? 'flat'
                              : asset.change_ratio > 0
                                ? 'up'
                                : 'down'
                          }
                        >
                          {asset.change_ratio !== null &&
                            asset.change_ratio !== 0 && (
                              <Icon name="arrow" size={14} />
                            )}
                          {asset.change_ratio === null
                            ? '—'
                            : formatPercent(asset.change_ratio, locale, {
                                fractionDigits: 2,
                              })}
                        </span>
                      </td>
                      <td>
                        <MarketQuoteStatus
                          asset={asset}
                          marketOpen={data.market_open}
                          refreshFailed={query.isError}
                        />
                      </td>
                      <td>
                        <span className={styles.badge}>
                          {asset.tradable
                            ? tx('Negociable', 'Tradable')
                            : tx('Solo consulta', 'View only')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.results.length === 0 && (
                <div className={styles.feedback} role="status">
                  <p>
                    {tx(
                      'Sin resultados para estos filtros.',
                      'No results for these filters.',
                    )}
                  </p>
                  {selectedExchange && (
                    <>
                      <p>
                        {tx(
                          `La búsqueda está limitada a ${selectedExchange}.`,
                          `Search is limited to ${selectedExchange}.`,
                        )}
                      </p>
                      <button
                        className={styles.button}
                        type="button"
                        onClick={() => {
                          setExchange('');
                          setPage(1);
                        }}
                      >
                        {tx(
                          'Buscar en todas las bolsas',
                          'Search all exchanges',
                        )}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
            {data.quotes_unavailable && (
              <div className={styles.notice} data-tone="warning" role="status">
                <Icon name="info" size={20} />
                <div>
                  <strong>
                    {tx(
                      'Algunas cotizaciones no están disponibles.',
                      'Some quotes are unavailable.',
                    )}
                  </strong>
                  <p>
                    {tx(
                      'Las mostramos con un guion para que puedas distinguirlas de un precio confirmado.',
                      'A dash identifies them so you can distinguish them from confirmed prices.',
                    )}
                  </p>
                </div>
              </div>
            )}
            <div className={styles.pagination}>
              <span>
                <strong>
                  {tx('Página', 'Page')} {page} / {pages}
                </strong>
                <small>
                  {data.results.length
                    ? `${tx('Mostrando', 'Showing')} ${(page - 1) * data.page_size + 1}–${(page - 1) * data.page_size + data.results.length} ${tx('de', 'of')} ${data.total.toLocaleString(locale === 'en' ? 'en-US' : 'es-CO')}`
                    : tx('Sin instrumentos', 'No instruments')}
                </small>
              </span>
              <button
                className={styles.button}
                type="button"
                disabled={page <= 1 || query.isFetching}
                onClick={() => setPage(page - 1)}
              >
                {tx('Anterior', 'Previous')}
              </button>
              <button
                className={styles.button}
                type="button"
                disabled={page >= pages || query.isFetching}
                onClick={() => setPage(page + 1)}
              >
                {tx('Siguiente', 'Next')}
              </button>
            </div>
            <div className={styles.coverageNote}>
              <Icon name="shield" size={18} />
              <p>
                {tx(
                  'Precios en USD. La cobertura y los retrasos dependen del feed contratado con Alpaca; la hora de cada cotización se muestra en ET.',
                  'Prices in USD. Coverage and delays depend on the Alpaca feed subscription; each quote timestamp is shown in ET.',
                )}
              </p>
            </div>
          </>
        )
      )}
    </div>
  );
}
