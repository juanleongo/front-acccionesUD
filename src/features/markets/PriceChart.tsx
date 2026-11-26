'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { LoadingState } from '@/components/ui/LoadingState';
import { ApiError, QUERY_STALE_TIMES, queryKeys } from '@/lib/api';
import {
  formatDecimalNumber,
  formatMarketDateTime,
  formatPercent,
} from '@/lib/formatters';
import { useLocale } from '@/lib/i18n';
import {
  history,
  periods,
  candleFrames,
  candleFramesEn,
  type CandleFrame,
  type Period,
} from './history';
import { FinancialChart } from './chart/FinancialChart';
import {
  formatChartTime,
  sessionDate,
  type ChartMode,
} from './chart/chart-data';
import styles from './price.module.css';
import { getInstruments } from './api';

export function PriceChart({
  exchange,
  initialSymbol = '',
  initialName = '',
}: {
  exchange: string;
  initialSymbol?: string;
  initialName?: string;
}) {
  const { locale, tx } = useLocale();
  const frameLabels = locale === 'en' ? candleFramesEn : candleFrames;
  const [letter, setLetter] = useState('A');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(initialSymbol);
  const catalog = useQuery({
    queryKey: queryKeys.instruments.options(exchange, letter, page),
    queryFn: ({ signal }) => getInstruments(exchange, letter, page, signal),
    staleTime: QUERY_STALE_TIMES.catalog,
  });
  const options = catalog.data?.results ?? [];
  const symbol = (selected || options[0]?.symbol) ?? '';
  const currentIndex = Math.max(
    0,
    options.findIndex((item) => item.symbol === symbol),
  );
  const totalPages = catalog.data
    ? Math.max(1, Math.ceil(catalog.data.total / catalog.data.page_size))
    : 1;

  const canGoPrev = currentIndex > 0 || page > 1;
  const canGoNext =
    currentIndex < options.length - 1 ||
    Boolean(catalog.data && page < totalPages);

  function handlePrevInstrument() {
    if (currentIndex > 0) {
      const prevItem = options[currentIndex - 1];
      if (prevItem) setSelected(prevItem.symbol);
    } else if (page > 1) {
      setPage(page - 1);
      setSelected('');
    }
  }

  function handleNextInstrument() {
    if (currentIndex < options.length - 1) {
      const nextItem = options[currentIndex + 1];
      if (nextItem) setSelected(nextItem.symbol);
    } else if (page < totalPages) {
      setPage(page + 1);
      setSelected('');
    }
  }

  const [period, setPeriod] = useState<Period>('1M');
  const [chartType, setChartType] = useState<ChartMode>('candles');
  const [frame, setFrame] = useState<CandleFrame | 'auto'>('auto');
  const timeframe = frame === 'auto' ? periods[period].frame : frame;
  const query = useQuery({
    queryKey: queryKeys.instruments.priceHistory(symbol, period, timeframe),
    enabled: Boolean(symbol) && !catalog.error,
    queryFn: ({ signal }) => history(symbol, period, signal, timeframe),
    staleTime: QUERY_STALE_TIMES.realtime,
  });
  const points = query.data?.points ?? [];
  const first = points[0],
    last = points.at(-1);
  const change =
    first && last && first.price !== 0 && points.length > 1
      ? (last.price - first.price) / first.price
      : null;
  const status = query.error instanceof ApiError && query.error.metadata.status;
  const isFetchingAny = catalog.isFetching || query.isFetching;

  return (
    <article
      className={styles.card}
      data-direction={
        change === null || change === 0 ? 'flat' : change < 0 ? 'down' : 'up'
      }
    >
      <header className={styles.head}>
        <div className={styles.titleArea}>
          <div>
            <span className={styles.chartEyebrow}>
              {exchange} · {tx('Histórico de precios', 'Price history')}
            </span>
            <h2>
              {symbol
                ? `${tx('Gráfico de precios de', 'Price chart for')} ${symbol}`
                : tx('Gráfico de precios', 'Price chart')}
            </h2>
            <p>
              {options.find((item) => item.symbol === symbol)?.name ??
                (symbol === initialSymbol ? initialName : '')}
            </p>
          </div>
          <div className={styles.performance}>
            {last && !query.error && (
              <span className={styles.lastClose}>
                {formatDecimalNumber(last.close, locale, 8)}{' '}
                {query.data?.currency}
                <small>
                  {tx('Último cierre disponible', 'Last available close')}
                </small>
              </span>
            )}
            {!catalog.error && !query.error && change !== null && (
              <strong>{formatPercent(change, locale)}</strong>
            )}{' '}
            {locale === 'en' ? periods[period].labelEn : periods[period].label}
          </div>
        </div>

        <div className={styles.chartControls}>
          <div className={styles.filterInputs}>
            <div className={styles.field}>
              <label htmlFor="price-chart-type">
                {tx('Tipo de gráfico', 'Chart type')}
              </label>
              <CustomSelect
                id="price-chart-type"
                value={chartType}
                onChange={(value) => setChartType(value as ChartMode)}
                options={[
                  { value: 'line', label: tx('Línea', 'Line') },
                  { value: 'area', label: tx('Área', 'Area') },
                  {
                    value: 'candles',
                    label: tx('Velas japonesas', 'Candlesticks'),
                  },
                ]}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="price-candle-frame">
                {tx('Intervalo de precios', 'Price interval')}
              </label>
              <CustomSelect
                id="price-candle-frame"
                value={frame}
                onChange={(val) => setFrame(val as CandleFrame | 'auto')}
                options={[
                  {
                    value: 'auto',
                    label: `${tx('Automática', 'Auto')} (${frameLabels[periods[period].frame]})`,
                  },
                  ...Object.entries(frameLabels).map(([value, label]) => ({
                    value,
                    label,
                  })),
                ]}
              />
            </div>
          </div>
          <div className={styles.toolbar}>
            <div className={styles.filterInputs}>
              <div className={`${styles.field} ${styles.letterField}`}>
                <label htmlFor="price-letter-filter">
                  {tx('Explorar por letra', 'Browse by letter')}
                </label>
                <CustomSelect
                  id="price-letter-filter"
                  searchable
                  searchPlaceholder={tx('Letra…', 'Letter…')}
                  value={letter}
                  onChange={(val) => {
                    setLetter(val);
                    setPage(1);
                    setSelected('');
                  }}
                  options={Array.from(
                    'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.-/',
                  ).map((c) => ({
                    value: c,
                    label: c,
                  }))}
                />
              </div>

              <div className={`${styles.field} ${styles.instrumentField}`}>
                <label htmlFor="price-instrument-select">
                  {tx('Instrumento', 'Instrument')}
                </label>
                <CustomSelect
                  id="price-instrument-select"
                  ariaLabel={tx('Instrumento', 'Instrument')}
                  searchable
                  searchPlaceholder={tx(
                    'Filtrar en esta página…',
                    'Filter this page…',
                  )}
                  placeholder={tx(
                    'Selecciona un instrumento',
                    'Select an instrument',
                  )}
                  value={symbol}
                  disabled={!symbol || Boolean(catalog.error)}
                  onChange={setSelected}
                  options={
                    !symbol
                      ? [
                          {
                            value: '',
                            label: tx(
                              'Selecciona un instrumento',
                              'Select an instrument',
                            ),
                          },
                        ]
                      : [
                          ...(symbol === initialSymbol &&
                          !options.some((item) => item.symbol === symbol)
                            ? [{ symbol, name: initialName }]
                            : []),
                          ...options,
                        ].map((item) => ({
                          value: item.symbol,
                          label: `${item.symbol} · ${item.name}`,
                        }))
                  }
                />
              </div>
            </div>

            <div className={styles.paginationArea}>
              {options.length > 0 && (
                <div
                  className={styles.pages}
                  role="navigation"
                  aria-label={tx(
                    'Paginación de instrumentos',
                    'Instrument pagination',
                  )}
                >
                  <button
                    type="button"
                    className={styles.pageButton}
                    disabled={!canGoPrev || isFetchingAny}
                    onClick={handlePrevInstrument}
                    aria-label={tx(
                      'Instrumento anterior',
                      'Previous instrument',
                    )}
                  >
                    {tx('← Anterior', '← Previous')}
                  </button>
                  <span
                    className={styles.pageIndicator}
                    title={
                      totalPages > 1
                        ? `${tx('Instrumento', 'Instrument')} ${currentIndex + 1} ${tx('de', 'of')} ${options.length} (${tx('Lote', 'Batch')} ${page} ${tx('de', 'of')} ${totalPages})`
                        : `${tx('Instrumento', 'Instrument')} ${currentIndex + 1} ${tx('de', 'of')} ${options.length}`
                    }
                  >
                    <span className={styles.pageCurrent}>
                      {currentIndex + 1}
                    </span>
                    <span className={styles.pageDivider}>/</span>
                    <span className={styles.pageTotal}>{options.length}</span>
                    {totalPages > 1 ? (
                      <small className={styles.pageBatchBadge}>
                        · {tx('Lote', 'Batch')} {page}/{totalPages}
                      </small>
                    ) : null}
                  </span>
                  <button
                    type="button"
                    className={styles.pageButton}
                    disabled={!canGoNext || isFetchingAny}
                    onClick={handleNextInstrument}
                    aria-label={tx('Siguiente instrumento', 'Next instrument')}
                  >
                    {tx('Siguiente →', 'Next →')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {isFetchingAny && !catalog.isPending && !query.isPending && (
        <LoadingState
          mode="compact"
          label={tx(
            'Actualizando datos de mercado…',
            'Refreshing market data…',
          )}
        />
      )}

      <div className={styles.plot}>
        {catalog.error ? (
          <p className={styles.plotAlert} role="alert">
            <span>
              {tx(
                'No se pudo cargar la lista de instrumentos.',
                'Could not load the instrument list.',
              )}
            </span>
            <button
              type="button"
              className={styles.retryInlineBtn}
              onClick={() => catalog.refetch()}
            >
              {tx('Reintentar', 'Retry')}
            </button>
          </p>
        ) : catalog.isPending ? (
          <LoadingState
            label={`${tx('Cargando instrumentos de', 'Loading instruments for')} ${exchange}…`}
            detail={tx(
              'Consultando el catálogo bursátil disponible.',
              'Fetching available tradable instruments.',
            )}
          />
        ) : !symbol ? (
          <p className={styles.plotEmpty}>
            {tx(
              `Sin instrumentos para este filtro en ${exchange}. Selecciona otra letra o mercado.`,
              `No instruments matched this filter on ${exchange}. Select another letter or exchange.`,
            )}
          </p>
        ) : query.error ? (
          <p className={styles.plotAlert} role="alert">
            <span>
              {status === 401 ? (
                <Link href="/login">
                  {tx(
                    'Inicia sesión para consultar precios.',
                    'Sign in to view live quotes.',
                  )}
                </Link>
              ) : status === 403 ? (
                tx(
                  'Tu cuenta no tiene permiso para consultar precios.',
                  'Your account lacks permission to view market prices.',
                )
              ) : status === 404 ? (
                tx(
                  'El instrumento no está en el catálogo.',
                  'This instrument is not in the catalog.',
                )
              ) : (
                tx(
                  'No se pudo cargar el histórico.',
                  'Could not load price history.',
                )
              )}
            </span>
            <button
              type="button"
              className={styles.retryInlineBtn}
              onClick={() => query.refetch()}
            >
              {tx('Reintentar', 'Retry')}
            </button>
          </p>
        ) : query.isPending ? (
          <LoadingState
            label={`${tx('Consultando precios históricos de', 'Loading historical prices for')} ${symbol}…`}
            detail={`${tx('Sincronizando cierres para el período', 'Syncing price bars for')} ${(locale === 'en' ? periods[period].labelEn : periods[period].label).toLowerCase()}.`}
          />
        ) : query.data && points.length > 0 ? (
          <FinancialChart
            points={query.data.points}
            mode={chartType}
            timeframe={timeframe}
            datasetKey={`${symbol}:${period}:${timeframe}`}
            currency={query.data.currency}
            label={`${tx('Histórico de', 'Price history for')} ${symbol}`}
          />
        ) : (
          <p className={styles.plotEmpty}>
            {tx(
              'Sin precios disponibles para este período.',
              'No price bars available for this period.',
            )}
          </p>
        )}
      </div>
      <div
        role="group"
        aria-label={tx('Período del gráfico', 'Chart period')}
        className={styles.periods}
      >
        {(Object.keys(periods) as Period[]).map((value) => (
          <button
            type="button"
            aria-pressed={period === value}
            key={value}
            onClick={() => setPeriod(value)}
          >
            {value}
          </button>
        ))}
      </div>
      {last && query.data && !catalog.error && !query.error && (
        <footer className={styles.cardFooter}>
          {tx('Último cierre:', 'Last close:')}{' '}
          {formatDecimalNumber(last.price, locale, 8)} {query.data.currency} ·{' '}
          {timeframe === '1Day'
            ? formatChartTime(sessionDate(last.time), locale, false)
            : formatMarketDateTime(last.time, locale, {
                includeTime: false,
                timeZone: 'America/New_York',
              })}{' '}
          · {tx('Fuente API:', 'API Source:')} {query.data.source.toUpperCase()}
          {query.data.delayed && tx(' · Datos diferidos', ' · Delayed data')}
        </footer>
      )}
    </article>
  );
}
