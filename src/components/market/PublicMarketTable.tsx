'use client';
import { useId, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { AssetLogo } from './AssetLogo';
import { LoadingState } from '@/components/ui/LoadingState';
import { useLocale } from '@/lib/i18n';
import {
  formatDecimalNumber,
  formatPercent,
  formatMarketDateTime,
} from '@/lib/formatters';
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
    retry: false,
  });
  const data = query.data;
  const exchanges = data?.markets ?? [];
  const exchangeOptions =
    selectedExchange &&
    !exchanges.some((market) => market.code === selectedExchange)
      ? [...exchanges, { code: selectedExchange, name: selectedExchange }]
      : exchanges;
  const pages = data ? Math.max(1, Math.ceil(data.total / data.page_size)) : 1;
  return (
    <div className={styles.panel}>
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
            <input
              id={`${id}-search`}
              value={draft}
              maxLength={50}
              placeholder={tx('Ej. Apple o AAPL', 'E.g. Apple or AAPL')}
              onChange={(event) => setDraft(event.target.value)}
            />
            <button type="submit">{tx('Buscar', 'Search')}</button>
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
          onClick={() => query.refetch()}
        >
          {tx('Actualizar', 'Refresh')}
        </button>
      </div>
      <div className={styles.summary}>
        <span className={styles.source}>Alpaca · USD</span>
        <span>
          {data
            ? `${data.total.toLocaleString(locale === 'en' ? 'en-US' : 'es-CO')} ${tx('instrumentos', 'instruments')}`
            : tx('Catálogo bursátil', 'Asset catalog')}
        </span>
        {data && (
          <span>
            {data.market_open === null
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
          <button type="button" onClick={() => query.refetch()}>
            {tx('Reintentar', 'Retry')}
          </button>
        </div>
      ) : (
        data && (
          <>
            {query.isError && (
              <p className={styles.notice} role="status">
                {tx(
                  'No pudimos renovar las cotizaciones. Se muestra la última información recibida, con su hora de actualización.',
                  'Could not refresh quotes. The last received data is shown with its update time.',
                )}
              </p>
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
                  {data.results.map((asset) => (
                    <tr key={asset.symbol}>
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
                      <td>{asset.exchange}</td>
                      <td>
                        {asset.price === null
                          ? '—'
                          : formatDecimalNumber(asset.price, locale, 8)}
                      </td>
                      <td
                        className={
                          asset.change_ratio === null ||
                          asset.change_ratio === 0
                            ? ''
                            : asset.change_ratio > 0
                              ? styles.up
                              : styles.down
                        }
                      >
                        {asset.change_ratio === null
                          ? '—'
                          : formatPercent(asset.change_ratio, locale, {
                              fractionDigits: 2,
                            })}
                      </td>
                      <td>
                        {asset.as_of
                          ? formatMarketDateTime(asset.as_of, locale)
                          : '—'}
                        <span className={styles.detail}>
                          {asset.feed}
                          {asset.is_delayed
                            ? ` · ${tx('Con demora', 'Delayed')}`
                            : ''}
                          {asset.is_stale
                            ? ` · ${tx('Dato antiguo', 'Stale')}`
                            : ''}
                        </span>
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
              <p className={styles.notice} role="status">
                {tx(
                  'Algunas cotizaciones no están disponibles.',
                  'Some quotes are unavailable.',
                )}
              </p>
            )}
            <div className={styles.pagination}>
              <span>
                {tx('Página', 'Page')} {page} / {pages}
              </span>
              <button
                type="button"
                disabled={page <= 1 || query.isFetching}
                onClick={() => setPage(page - 1)}
              >
                {tx('Anterior', 'Previous')}
              </button>
              <button
                type="button"
                disabled={page >= pages || query.isFetching}
                onClick={() => setPage(page + 1)}
              >
                {tx('Siguiente', 'Next')}
              </button>
            </div>
            <p className={styles.notice}>
              {tx(
                'Precios y cobertura según el feed contratado. Actualización automática cada 30 segundos.',
                'Prices and coverage depend on the subscribed feed. Refreshes automatically every 30 seconds.',
              )}
            </p>
          </>
        )
      )}
    </div>
  );
}
