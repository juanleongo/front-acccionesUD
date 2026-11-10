'use client';

import { useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import type { Exchange, MarketAsset } from '../model/market.types';
import { UpcomingButton } from './LandingActions';
import styles from '../landing.module.css';

const exchanges: { value: Exchange | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'NASDAQ', label: 'Nueva York (NYSE/NASDAQ)' },
  { value: 'LSE', label: 'Londres (LSE)' },
  { value: 'TSE', label: 'Tokio (TSE)' },
  { value: 'ASX', label: 'Australia (ASX)' },
];

export function MarketExplorer({ assets }: { assets: readonly MarketAsset[] }) {
  const [exchange, setExchange] = useState<Exchange | 'all'>('all');
  const [search, setSearch] = useState('');
  const searchInput = useRef<HTMLInputElement>(null);
  const query = search.trim().toLocaleLowerCase('es');
  const filtered = assets.filter(
    (asset) =>
      (exchange === 'all' || asset.exchange === exchange) &&
      `${asset.name} ${asset.symbol} ${asset.exchange}`
        .toLocaleLowerCase('es')
        .includes(query),
  );

  useEffect(() => {
    function focusSearch(event: KeyboardEvent) {
      if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === 'k' &&
        !document.querySelector('dialog[open]')
      ) {
        event.preventDefault();
        searchInput.current?.focus();
      }
    }
    window.addEventListener('keydown', focusSearch);
    return () => window.removeEventListener('keydown', focusSearch);
  }, []);

  return (
    <section
      id="mercados"
      className={`${styles.container} ${styles.marketSection}`}
      aria-labelledby="markets-title"
    >
      <div className={styles.marketPanel}>
        <div className={styles.marketHeader}>
          <div>
            <h2 id="markets-title">
              <span className={styles.dot} /> Explorador de Mercados Bursátiles
              Globales
            </h2>
            <p>
              Explora activos cotizados en los mercados bursátiles de Wall
              Street, Londres, Tokio y Australia.
            </p>
          </div>
          <label className={styles.search}>
            <Icon name="search" size={18} />
            <span className={styles.srOnly}>Buscar empresa o acción</span>
            <input
              ref={searchInput}
              type="search"
              placeholder="Buscar empresa o acción (ej. Apple, Tesla)…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <kbd>Ctrl + K</kbd>
          </label>
        </div>
        <div
          className={styles.filters}
          role="group"
          aria-label="Filtrar por mercado"
        >
          {exchanges.map((item) => (
            <button
              key={item.value}
              type="button"
              aria-pressed={exchange === item.value}
              onClick={() => setExchange(item.value)}
            >
              {item.label}
              {item.value === 'all' ? ` (${assets.length})` : ''}
            </button>
          ))}
        </div>
        <div
          className={styles.tableScroll}
          role="region"
          aria-label="Cotizaciones de demostración, tabla desplazable"
          tabIndex={0}
        >
          <table className={styles.marketTable}>
            <caption className={styles.srOnly}>
              Cotizaciones ilustrativas. Precios y estados de ejemplo; no se
              actualizan en tiempo real.
            </caption>
            <thead>
              <tr>
                <th scope="col">Activo bursátil</th>
                <th scope="col">Cotización</th>
                <th scope="col">Variación 24h</th>
                <th scope="col">Estado mercado</th>
                <th scope="col">Paper execution</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((asset) => (
                <tr key={asset.symbol}>
                  <th scope="row">
                    <div className={styles.asset}>
                      <span className={styles.assetEmblem} aria-hidden="true">
                        {asset.emblem}
                      </span>
                      <div>
                        <div className={styles.assetTitle}>
                          {asset.symbol} <span>{asset.exchange}</span>
                        </div>
                        <span className={styles.assetName}>{asset.name}</span>
                      </div>
                    </div>
                  </th>
                  <td className={styles.quote}>
                    {asset.priceLabel} <small>{asset.currency}</small>
                  </td>
                  <td>
                    <span className={styles.change}>{asset.changeLabel}</span>
                  </td>
                  <td>
                    <span
                      className={
                        asset.status === 'open'
                          ? styles.openStatus
                          : styles.closedStatus
                      }
                    >
                      {asset.status === 'open'
                        ? 'Abierto'
                        : '● En cola (mercado cerrado)'}
                    </span>
                  </td>
                  <td>
                    <UpcomingButton
                      feature={`Simulación de órdenes · ${asset.symbol}`}
                      className={styles.orderButton}
                    >
                      {asset.status === 'open'
                        ? 'Simular orden'
                        : 'Encolar orden FIX'}
                    </UpcomingButton>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className={styles.emptyState}>
                    <strong>No encontramos activos</strong>
                    <p>Prueba otro nombre, símbolo o mercado.</p>
                    <button
                      type="button"
                      className={styles.secondaryButton}
                      onClick={() => {
                        setSearch('');
                        setExchange('all');
                      }}
                    >
                      Limpiar filtros
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className={styles.marketNote}>
          <span>
            <Icon name="info" size={15} /> Datos de demostración. Cotizaciones y
            estados ilustrativos, sin operaciones reales.
          </span>
          <span role="status">{filtered.length} activos · Vista previa</span>
        </div>
      </div>
    </section>
  );
}
