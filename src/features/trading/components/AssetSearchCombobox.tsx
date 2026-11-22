'use client';
import { useId, useRef, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { useLocale } from '@/lib/i18n';
import type { SelectorAssetItem } from './instrument-types';
import styles from '../trading.module.css';

export function AssetSearchCombobox({
  search,
  assets,
  loading,
  error,
  onSearch,
  onSelect,
}: {
  search: string;
  assets: SelectorAssetItem[];
  loading: boolean;
  error: boolean;
  onSearch: (value: string) => void;
  onSelect: (symbol: string) => void;
}) {
  const { tx } = useLocale();
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const index = Math.min(active, Math.max(0, assets.length - 1));
  function choose(asset: SelectorAssetItem) {
    onSearch(asset.symbol);
    onSelect(asset.symbol);
    setActive(0);
    input.current?.focus();
    setOpen(false);
  }
  return (
    <div className={styles.fieldGroup}>
      <label className={styles.fieldLabel} htmlFor={`${id}-input`}>
        {tx(
          'Buscar acción por nombre o símbolo',
          'Search stock by name or symbol',
        )}
      </label>
      <div
        className={styles.assetSearch}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget))
            setOpen(false);
        }}
      >
        <div className={styles.assetSearchInput}>
          <Icon name="search" size={17} />
          <input
            ref={input}
            id={`${id}-input`}
            type="search"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={open}
            aria-controls={
              open && !loading && !error ? `${id}-list` : undefined
            }
            aria-activedescendant={
              open && !loading && !error && assets.length
                ? `${id}-option-${index}`
                : undefined
            }
            placeholder={tx(
              'Buscar o elegir una acción…',
              'Search or choose a stock…',
            )}
            value={search}
            onFocus={() => setOpen(true)}
            onClick={() => setOpen(true)}
            onChange={(event) => {
              onSearch(event.target.value);
              setOpen(true);
              setActive(0);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                setOpen(false);
                return;
              }
              if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                event.preventDefault();
                setOpen(true);
                setActive(
                  Math.max(
                    0,
                    Math.min(
                      assets.length - 1,
                      index + (event.key === 'ArrowDown' ? 1 : -1),
                    ),
                  ),
                );
              }
              if (event.key === 'Enter' && open) {
                event.preventDefault();
                const asset = assets[index];
                if (asset && !loading && !error) choose(asset);
              }
            }}
          />
          <button
            type="button"
            aria-label={tx(
              'Mostrar acciones disponibles',
              'Show available stocks',
            )}
            aria-expanded={open}
            onClick={() => {
              setOpen(!open);
              input.current?.focus();
            }}
          >
            <Icon name="menu" size={17} />
          </button>
        </div>
        {open && (
          <div className={styles.assetSearchMenu}>
            <p className={styles.assetSearchCaption}>
              {tx(
                'Elige un instrumento del catálogo',
                'Choose an instrument from the catalog',
              )}
            </p>
            {loading ? (
              <p className={styles.fieldHint} role="status">
                {tx('Buscando acciones…', 'Searching stocks…')}
              </p>
            ) : error ? (
              <p className={styles.fieldHint}>
                {tx(
                  'No se pudo cargar el catálogo.',
                  'Could not load the catalog.',
                )}
              </p>
            ) : (
              <ul
                id={`${id}-list`}
                role="listbox"
                aria-label={tx('Acciones disponibles', 'Available stocks')}
              >
                {assets.map((asset, i) => (
                  <li
                    key={`${asset.symbol}-${asset.exchange}`}
                    role="presentation"
                    onMouseEnter={() => setActive(i)}
                  >
                    <button
                      type="button"
                      role="option"
                      id={`${id}-option-${i}`}
                      aria-selected={i === index}
                      tabIndex={-1}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => choose(asset)}
                    >
                      <span>
                        <strong>{asset.symbol}</strong>
                        <small>{asset.name}</small>
                      </span>
                      <span className={styles.assetSearchExchange}>
                        {asset.exchange}
                      </span>
                    </button>
                  </li>
                ))}
                {!assets.length && (
                  <li className={styles.fieldHint}>
                    {tx(
                      'No hay coincidencias. Prueba otro nombre o símbolo.',
                      'No matches. Try another name or symbol.',
                    )}
                  </li>
                )}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
