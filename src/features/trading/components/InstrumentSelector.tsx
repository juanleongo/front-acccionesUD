'use client';

import { useMemo } from 'react';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { AssetSearchCombobox } from './AssetSearchCombobox';
import { LoadingState } from '@/components/ui/LoadingState';
import { useLocale } from '@/lib/i18n';
import styles from '../trading.module.css';

import type { SelectorAssetItem, SelectorMarketItem } from './instrument-types';

const LETTERS = Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.-/');

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
  markets: SelectorMarketItem[];
  marketsPending: boolean;
  marketsError: boolean;
  assets: SelectorAssetItem[];
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
  const { tx } = useLocale();
  const totalPages = Math.max(1, Math.ceil(total / Math.max(pageSize, 1)));
  const trimmedSearch = search.trim().toUpperCase();

  const sortedAssets = useMemo(() => {
    if (!trimmedSearch) return assets;
    return [...assets].sort((a, b) => {
      const aExact = a.symbol.toUpperCase() === trimmedSearch ? 0 : 1;
      const bExact = b.symbol.toUpperCase() === trimmedSearch ? 0 : 1;
      if (aExact !== bExact) return aExact - bExact;
      const aPrefix = a.symbol.toUpperCase().startsWith(trimmedSearch) ? 0 : 1;
      const bPrefix = b.symbol.toUpperCase().startsWith(trimmedSearch) ? 0 : 1;
      return aPrefix - bPrefix;
    });
  }, [assets, trimmedSearch]);
  const instrumentPlaceholder = isFetching
    ? tx('Cargando instrumentos…', 'Loading instruments…')
    : sortedAssets.length === 0
      ? tx('Sin instrumentos disponibles', 'No instruments available')
      : tx('Selecciona un instrumento', 'Select an instrument');

  return (
    <div className={styles.selectorPanel}>
      <div className={styles.fieldGrid}>
        <div className={styles.fieldGroup}>
          <label htmlFor="order-exchange-select" className={styles.fieldLabel}>
            {tx('Bolsa de valores', 'Stock exchange')}
          </label>
          <CustomSelect
            className={styles.selectorControl ?? ''}
            id="order-exchange-select"
            value={exchange}
            onChange={onExchangeChange}
            disabled={marketsPending}
            placeholder={
              marketsPending
                ? tx('Cargando bolsas…', 'Loading exchanges…')
                : tx('Todas las bolsas', 'All exchanges')
            }
            options={[
              { value: '', label: tx('Todas las bolsas', 'All exchanges') },
              ...markets.map((m) => ({
                value: m.code,
                label: `${m.name} (${m.code})`,
              })),
            ]}
          />
          {marketsError && (
            <div className={styles.selectorHintRow}>
              <span className={styles.fieldHint}>
                {tx(
                  'No se pudo cargar el listado de bolsas.',
                  'Could not load exchanges list.',
                )}
              </span>
              <button
                type="button"
                className={styles.btnCompact}
                onClick={onRetryMarkets}
              >
                {tx('Reintentar', 'Retry')}
              </button>
            </div>
          )}
        </div>

        <div className={styles.fieldGroup}>
          <label htmlFor="order-letter-select" className={styles.fieldLabel}>
            {tx('Explorar por letra', 'Browse by letter')}
          </label>
          <CustomSelect
            className={styles.selectorControl ?? ''}
            id="order-letter-select"
            searchable
            searchPlaceholder={tx('Letra…', 'Letter…')}
            value={letter}
            disabled={Boolean(trimmedSearch)}
            onChange={onLetterChange}
            options={LETTERS.map((c) => ({ value: c, label: c }))}
          />
          {trimmedSearch && (
            <span className={styles.fieldHint}>
              {tx(
                `Búsqueda libre activa en todo el catálogo (${trimmedSearch}).`,
                `Free search active across the full catalog (${trimmedSearch}).`,
              )}
            </span>
          )}
        </div>

        <AssetSearchCombobox
          search={search}
          assets={sortedAssets}
          loading={isFetching}
          error={isError}
          onSearch={onSearchChange}
          onSelect={onSymbolChange}
        />

        <div className={styles.fieldGroup}>
          <label htmlFor="order-symbol-select" className={styles.fieldLabel}>
            {tx('Instrumento', 'Instrument')}
          </label>
          <CustomSelect
            className={styles.selectorControl ?? ''}
            id="order-symbol-select"
            searchable
            searchPlaceholder={tx('Filtrar resultados…', 'Filter results…')}
            value={symbol}
            disabled={isError || isFetching || sortedAssets.length === 0}
            placeholder={instrumentPlaceholder}
            onChange={onSymbolChange}
            options={[
              {
                value: '',
                label: instrumentPlaceholder,
              },
              ...sortedAssets.map((a) => ({
                value: a.symbol,
                label: `${a.symbol} · ${a.name}`,
                hint: a.exchange,
              })),
            ]}
          />
        </div>
      </div>

      <span className={styles.fieldHint}>
        {tx(
          'Solo instrumentos negociables. Sin búsqueda, se muestran coincidencias de la letra seleccionada en el símbolo o nombre.',
          'Tradable instruments only. Without a query, results matching the selected letter by symbol or name are displayed.',
        )}
      </span>

      {(!isFetching || sortedAssets.length > 0) && (
        <div className={styles.paginationCompact}>
          <button
            type="button"
            className={styles.btnCompact}
            disabled={page <= 1 || isFetching}
            onClick={() => onPageChange(Math.max(1, page - 1))}
          >
            {tx('Anterior', 'Previous')}
          </button>
          <span className={styles.pageLabel}>
            {tx(
              `Página ${page} · ${total} resultados`,
              `Page ${page} · ${total} results`,
            )}
          </span>
          <button
            type="button"
            className={styles.btnCompact}
            disabled={page >= totalPages || isFetching}
            onClick={() => onPageChange(page + 1)}
          >
            {tx('Siguiente', 'Next')}
          </button>
        </div>
      )}

      <div className={styles.instrumentResultsPanel}>
        <div className={styles.instrumentResultsHeader}>
          <span>
            {trimmedSearch
              ? tx(
                  `Coincidencias para "${trimmedSearch}" (haz clic para elegir)`,
                  `Matches for "${trimmedSearch}" (click to select)`,
                )
              : tx(
                  `Instrumentos disponibles · Letra "${letter}" (haz clic para elegir)`,
                  `Available instruments · Letter "${letter}" (click to select)`,
                )}
          </span>
          {symbol && (
            <span>
              {tx('Activo elegido:', 'Selected asset:')}{' '}
              <strong>{symbol}</strong>
            </span>
          )}
        </div>

        {isError ? (
          <p role="alert" className={styles.alertError}>
            {tx(
              'No se pudieron consultar los instrumentos negociables.',
              'Could not load tradable instruments.',
            )}
          </p>
        ) : isFetching && sortedAssets.length === 0 ? (
          <LoadingState
            mode="compact"
            label={tx('Cargando acciones…', 'Loading stocks…')}
            detail={tx(
              'Consultando activos negociables en tiempo real.',
              'Fetching real-time tradable assets.',
            )}
          />
        ) : sortedAssets.length === 0 ? (
          <p className={styles.instrumentEmptyNote}>
            {tx(
              'No hay acciones para estos filtros.',
              'No stocks match these filters.',
            )}
          </p>
        ) : (
          <div className={styles.instrumentResultsGrid}>
            {sortedAssets.map((item) => {
              const isSelected = item.symbol === symbol;
              return (
                <button
                  key={`${item.symbol}-${item.exchange}`}
                  type="button"
                  onClick={() => onSymbolChange(item.symbol)}
                  className={
                    isSelected
                      ? `${styles.instrumentChip} ${styles.instrumentChipActive}`
                      : styles.instrumentChip
                  }
                >
                  <div className={styles.instrumentChipTop}>
                    <span className={styles.instrumentChipSymbol}>
                      {item.symbol}
                    </span>
                    <span className={styles.instrumentChipExchange}>
                      {item.exchange}
                    </span>
                  </div>
                  <span className={styles.instrumentChipName}>{item.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
