'use client';

import { LoadingState } from '@/components/ui/LoadingState';
import styles from '../trading.module.css';

export interface SearchableAsset {
  symbol: string;
  name: string;
  exchange: string;
}

export interface TradingMarketItem {
  code: string;
  name: string;
}

export function InstrumentSelector({
  exchange,
  letter,
  search,
  page,
  symbol,
  markets,
  marketsPending,
  marketsError,
  assets,
  total,
  pageSize,
  isError,
  isFetching,
  onExchangeChange,
  onRetryMarkets,
  onLetterChange,
  onSearchChange,
  onPageChange,
  onSymbolChange,
}: {
  exchange: string;
  letter: string;
  search: string;
  page: number;
  symbol: string;
  markets: TradingMarketItem[];
  marketsPending: boolean;
  marketsError: boolean;
  assets: SearchableAsset[];
  total: number;
  pageSize: number;
  isError: boolean;
  isFetching: boolean;
  onExchangeChange: (nextExchange: string) => void;
  onRetryMarkets: () => void;
  onLetterChange: (nextLetter: string) => void;
  onSearchChange: (nextSearch: string) => void;
  onPageChange: (nextPage: number) => void;
  onSymbolChange: (nextSymbol: string) => void;
}) {
  const hasNext = total > 0 && page * pageSize < total;

  return (
    <div className={styles.fieldGrid}>
      <label className={styles.fieldGroup}>
        Bolsa de valores
        <select
          className={styles.select}
          value={exchange}
          disabled={marketsPending || marketsError}
          onChange={(e) => onExchangeChange(e.target.value)}
        >
          <option value="">
            {marketsPending
              ? 'Cargando bolsas…'
              : marketsError
                ? 'Bolsas no disponibles'
                : 'Todas las bolsas'}
          </option>
          {markets.map((market) => (
            <option key={market.code} value={market.code}>
              {market.name} ({market.code})
            </option>
          ))}
        </select>
      </label>

      <label className={styles.fieldGroup}>
        Explorar por letra
        <select
          className={styles.select}
          value={letter}
          disabled={Boolean(search.trim())}
          onChange={(e) => onLetterChange(e.target.value)}
        >
          {'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('').map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </label>

      {marketsError && (
        <div
          role="alert"
          className={`${styles.alertError} ${styles.fieldFull}`}
        >
          <span>No se pudieron cargar las bolsas.</span>
          <button
            type="button"
            className={styles.btnCompact}
            onClick={onRetryMarkets}
          >
            Reintentar
          </button>
        </div>
      )}

      <label className={styles.fieldGroup}>
        Buscar acción por nombre o símbolo
        <input
          className={styles.input}
          value={search}
          maxLength={50}
          placeholder="Ej. AAPL, NVDA, IBM…"
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </label>

      <label className={styles.fieldGroup}>
        Instrumento
        <select
          className={styles.select}
          required
          disabled={isFetching || isError}
          value={symbol}
          onChange={(e) => onSymbolChange(e.target.value)}
        >
          <option value="">Selecciona un instrumento</option>
          {symbol && !assets.some((a) => a.symbol === symbol) && (
            <option value={symbol}>{symbol}</option>
          )}
          {assets.map((asset) => (
            <option key={asset.symbol} value={asset.symbol}>
              {asset.symbol} · {asset.name} ({asset.exchange})
            </option>
          ))}
        </select>
      </label>

      <p className={`${styles.cardSubtitle} ${styles.fieldFull}`}>
        Solo instrumentos negociables. Sin búsqueda, se muestran coincidencias
        de la letra seleccionada en el símbolo o nombre.
      </p>

      {isFetching && (
        <div className={styles.fieldFull}>
          <LoadingState mode="compact" label="Cargando acciones…" />
        </div>
      )}

      {!isFetching && !isError && total === 0 && (
        <p className={`${styles.alertInfo} ${styles.fieldFull}`}>
          No hay acciones para estos filtros.
        </p>
      )}

      {isError && (
        <p role="alert" className={`${styles.alertError} ${styles.fieldFull}`}>
          No se pudieron consultar los instrumentos.
        </p>
      )}

      <div className={styles.paginationCompact}>
        <button
          type="button"
          className={styles.btnCompact}
          disabled={page === 1 || isFetching || isError}
          onClick={() => onPageChange(page - 1)}
        >
          Anterior
        </button>
        <span className={styles.pageLabel}>
          {isFetching
            ? 'Consultando resultados…'
            : isError
              ? 'Resultados no disponibles'
              : `Página ${page} · ${total} resultados`}
        </span>
        <button
          type="button"
          className={styles.btnCompact}
          disabled={isFetching || isError || !hasNext}
          onClick={() => onPageChange(page + 1)}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
