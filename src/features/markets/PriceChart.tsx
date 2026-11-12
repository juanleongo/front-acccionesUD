'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ApiError } from '@/lib/api';
import { history, periods, type Period } from './history';
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
  const [period, setPeriod] = useState<Period>('1M');
  const query = useQuery({
    queryKey: ['price-history', symbol, period],
    enabled: Boolean(symbol) && !catalog.error,
    queryFn: ({ signal }) => history(symbol, period, signal),
  });
  const points = query.data?.points ?? [];
  const first = points[0],
    last = points.at(-1);
  const change =
    first && last && first.price !== 0 && points.length > 1
      ? (last.price - first.price) / first.price
      : null;
  const status = query.error instanceof ApiError && query.error.metadata.status;
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

        <div className={styles.toolbar}>
          <div className={styles.filterInputs}>
            <label className={styles.field}>
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

            <label className={styles.field}>
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
            {catalog.data && catalog.data.total > catalog.data.page_size && (
              <div
                className={styles.pages}
                role="navigation"
                aria-label="Paginación de instrumentos"
              >
                <button
                  type="button"
                  className={styles.pageButton}
                  disabled={page === 1}
                  onClick={() => {
                    setPage(page - 1);
                    setSelected('');
                  }}
                  aria-label="Página anterior"
                >
                  ← Anterior
                </button>
                <span className={styles.pageIndicator}>
                  <span className={styles.pageCurrent}>{page}</span>
                  <span className={styles.pageDivider}>/</span>
                  <span className={styles.pageTotal}>
                    {Math.ceil(catalog.data.total / catalog.data.page_size)}
                  </span>
                </span>
                <button
                  type="button"
                  className={styles.pageButton}
                  disabled={page * catalog.data.page_size >= catalog.data.total}
                  onClick={() => {
                    setPage(page + 1);
                    setSelected('');
                  }}
                  aria-label="Página siguiente"
                >
                  Siguiente →
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      <div className={styles.plot}>
        {catalog.error ? (
          <p role="alert">
            No se pudo cargar la lista de instrumentos.{' '}
            <button onClick={() => catalog.refetch()}>Reintentar</button>
          </p>
        ) : catalog.isPending ? (
          <p role="status">Cargando instrumentos…</p>
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
          <p role="status">Consultando precios…</p>
        ) : query.data && points.length > 0 ? (
          <PriceSeries
            key={symbol + period}
            points={query.data.points}
            currency={query.data.currency}
            label={'Evolución de ' + symbol + ' · ' + periods[period].label}
          />
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
          · {query.data.source}
          {query.data.delayed && ' · Datos diferidos'}
        </footer>
      )}
    </article>
  );
}
