'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ApiError } from '@/lib/api';
import {
  history,
  periods,
  candleFrames,
  type CandleFrame,
  type Period,
} from './history';
import { CandleSeries } from './CandleSeries';
import styles from './price.module.css';
import { PriceSeries } from './PriceSeries';
import { getInstruments } from './api';

const percent = new Intl.NumberFormat('es-CO', {
  style: 'percent',
  signDisplay: 'exceptZero',
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
});

export function PriceChart({ exchange }: { exchange: string }) {
  const [letter, setLetter] = useState('A');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState('');
  const catalog = useQuery({
    queryKey: ['instrument-options', exchange, letter, page],
    queryFn: ({ signal }) => getInstruments(exchange, letter, page, signal),
    placeholderData: (previousData) => previousData,
  });
  const options = catalog.data?.results ?? [];
  const symbol =
    options.find((item) => item.symbol === selected)?.symbol ??
    options[0]?.symbol ??
    '';
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
  const [chartType, setChartType] = useState('line');
  const [frame, setFrame] = useState<CandleFrame | 'auto'>('auto');
  const timeframe = frame === 'auto' ? periods[period].frame : frame;
  const query = useQuery({
    queryKey: ['price-history', symbol, period, timeframe],
    enabled: Boolean(symbol) && !catalog.error,
    queryFn: ({ signal }) => history(symbol, period, signal, timeframe),
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
          <h2>
            {symbol ? 'Gráfico de precios de ' + symbol : 'Gráfico de precios'}
          </h2>
          <p>
            {!query.error && change !== null && (
              <strong>{percent.format(change)}</strong>
            )}{' '}
            {periods[period].label}
          </p>
        </div>

        <div className={styles.filterInputs}>
          <label className={styles.field}>
            <span>Tipo de gráfico</span>
            <select
              value={chartType}
              onChange={(e) => setChartType(e.target.value)}
            >
              <option value="line">Línea / área</option>
              <option value="candles">Velas japonesas</option>
            </select>
          </label>
          <label className={styles.field}>
            <span>Duración de cada vela</span>
            <select
              value={frame}
              onChange={(e) => setFrame(e.target.value as CandleFrame | 'auto')}
            >
              <option value="auto">
                Automática ({candleFrames[periods[period].frame]})
              </option>
              {Object.entries(candleFrames).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className={styles.toolbar}>
          <div className={styles.filterInputs}>
            <label className={`${styles.field} ${styles.letterField}`}>
              <span>Filtro de nombre o símbolo</span>
              <select
                value={letter}
                onChange={(e) => {
                  setLetter(e.target.value);
                  setPage(1);
                  setSelected('');
                }}
              >
                {Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.-/').map(
                  (c) => (
                    <option key={c}>{c}</option>
                  ),
                )}
              </select>
            </label>

            <label className={`${styles.field} ${styles.instrumentField}`}>
              <span>Instrumento</span>
              <select
                aria-label="Instrumento"
                value={symbol}
                disabled={!symbol || Boolean(catalog.error)}
                onChange={(e) => setSelected(e.target.value)}
              >
                {!symbol && <option value="">Selecciona un instrumento</option>}
                {options.map((item) => (
                  <option value={item.symbol} key={item.symbol}>
                    {item.symbol} · {item.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className={styles.paginationArea}>
            {options.length > 0 && (
              <div
                className={styles.pages}
                role="navigation"
                aria-label="Paginación de instrumentos"
              >
                <button
                  type="button"
                  className={styles.pageButton}
                  disabled={!canGoPrev || isFetchingAny}
                  onClick={handlePrevInstrument}
                  aria-label="Instrumento anterior"
                >
                  ← Anterior
                </button>
                <span
                  className={styles.pageIndicator}
                  title={
                    totalPages > 1
                      ? `Instrumento ${currentIndex + 1} de ${options.length} (Lote ${page} de ${totalPages})`
                      : `Instrumento ${currentIndex + 1} de ${options.length}`
                  }
                >
                  <span className={styles.pageCurrent}>{currentIndex + 1}</span>
                  <span className={styles.pageDivider}>/</span>
                  <span className={styles.pageTotal}>{options.length}</span>
                  {totalPages > 1 ? (
                    <small className={styles.pageBatchBadge}>
                      · Lote {page}/{totalPages}
                    </small>
                  ) : null}
                </span>
                <button
                  type="button"
                  className={styles.pageButton}
                  disabled={!canGoNext || isFetchingAny}
                  onClick={handleNextInstrument}
                  aria-label="Siguiente instrumento"
                >
                  Siguiente →
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {isFetchingAny && (
        <div
          className={styles.loadingBarWrap}
          role="progressbar"
          aria-label="Actualizando datos de mercado"
        >
          <div className={styles.loadingBarFill} />
        </div>
      )}

      <div className={styles.plot}>
        {catalog.error ? (
          <p role="alert">
            No se pudo cargar la lista de instrumentos.{' '}
            <button onClick={() => catalog.refetch()}>Reintentar</button>
          </p>
        ) : catalog.isPending ? (
          <div className={styles.loadingStateBox} role="status">
            <div className={styles.loadingBarTrack}>
              <div className={styles.loadingBarFill} />
            </div>
            <p>Cargando instrumentos del mercado {exchange}…</p>
          </div>
        ) : !symbol ? (
          <p>
            Sin instrumentos para este filtro en {exchange}. Selecciona otra
            letra o mercado.
          </p>
        ) : query.error ? (
          <p role="alert">
            {status === 401 ? (
              <Link href="/login">Inicia sesión para consultar precios.</Link>
            ) : status === 403 ? (
              'Tu cuenta no tiene permiso para consultar precios.'
            ) : status === 404 ? (
              'El instrumento no está en el catálogo.'
            ) : (
              'No se pudo cargar el histórico.'
            )}{' '}
            <button onClick={() => query.refetch()}>Reintentar</button>
          </p>
        ) : query.isPending ? (
          <div className={styles.loadingStateBox} role="status">
            <div className={styles.loadingBarTrack}>
              <div className={styles.loadingBarFill} />
            </div>
            <p>Consultando precios históricos de {symbol} en Alpaca…</p>
          </div>
        ) : query.data && points.length > 0 ? (
          chartType === 'candles' ? (
            <CandleSeries
              key={symbol + period + timeframe}
              candles={query.data.points}
              currency={query.data.currency}
              label={'Velas japonesas de ' + symbol}
            />
          ) : (
            <PriceSeries
              key={symbol + period + timeframe}
              points={query.data.points}
              currency={query.data.currency}
              label={'Evolución de ' + symbol + ' · ' + periods[period].label}
            />
          )
        ) : (
          <p>Sin precios disponibles para este período.</p>
        )}
      </div>
      <div
        role="group"
        aria-label="Período del gráfico"
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
      {last && query.data && !query.error && (
        <footer>
          Último cierre:{' '}
          {last.price.toLocaleString('es-CO', { maximumFractionDigits: 8 })}{' '}
          {query.data.currency} ·{' '}
          {new Date(last.time).toLocaleDateString('es-CO', {
            timeZone: 'America/New_York',
          })}{' '}
          · Fuente API: {query.data.source.toUpperCase()}
          {query.data.delayed && ' · Datos diferidos'}
        </footer>
      )}
    </article>
  );
}
