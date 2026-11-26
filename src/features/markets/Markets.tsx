'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Icon } from '@/components/ui/Icon';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { LoadingState } from '@/components/ui/LoadingState';
import { PublicMarketTable } from '@/components/market/PublicMarketTable';
import type { PublicMarketAsset } from '@/lib/market-explorer';
import { QUERY_STALE_TIMES, queryKeys } from '@/lib/api';
import { useLocale } from '@/lib/i18n';
import { getMarkets } from './api';
import styles from './markets.module.css';
import { PriceChart } from './PriceChart';
import { MarketClock } from './MarketClock';
import { MarketSchedule } from './MarketSchedule';
import { Problem } from './MarketProblem';

export function Markets() {
  const { tx } = useLocale();
  const list = useQuery({
    queryKey: queryKeys.markets.list(),
    queryFn: ({ signal }) => getMarkets(signal),
    staleTime: QUERY_STALE_TIMES.catalog,
    retry: false,
    networkMode: 'always',
  });
  const [selected, setSelected] = useState('');
  const [asset, setAsset] = useState<PublicMarketAsset | null>(null);
  const current = list.data?.find((m) => m.code === selected) ?? list.data?.[0];
  return (
    <section
      className={styles.panel}
      aria-label={tx('Mercados bursátiles', 'Stock markets')}
    >
      <div className={styles.marketTopBar}>
        <div className={styles.marketIntro}>
          <span className={styles.marketIntroIcon}>
            <Icon name="trend" size={25} />
          </span>
          <div>
            <span className={styles.sectionKicker}>
              {tx(
                'EXPLORACIÓN DE MERCADOS · EE. UU.',
                'MARKET EXPLORER · UNITED STATES',
              )}
            </span>
            <h2>{tx('Mercados bursátiles', 'Stock markets')}</h2>
            <p className={styles.marketDescription}>
              {tx(
                'Explora instrumentos, compara su evolución y consulta los horarios de negociación.',
                'Explore instruments, compare price history, and check trading schedules.',
              )}
            </p>
          </div>
        </div>
        {list.data && current && (
          <div className={styles.marketPickerLabel}>
            <label htmlFor="markets-exchange-select">
              {tx('Mercado del gráfico', 'Chart exchange')}
            </label>
            <CustomSelect
              id="markets-exchange-select"
              align="right"
              value={current.code}
              onChange={setSelected}
              options={list.data.map((m) => ({
                value: m.code,
                label: `${m.name} (${m.code})`,
              }))}
            />
          </div>
        )}
      </div>

      {list.error ? (
        <Problem error={list.error} retry={list.refetch} />
      ) : !list.data ? (
        <LoadingState
          label={tx(
            'Consultando mercados bursátiles…',
            'Loading stock markets…',
          )}
          detail={tx(
            'Obteniendo bolsas habilitadas y estado de negociación en vivo.',
            'Fetching enabled exchanges and live trading status.',
          )}
        />
      ) : (
        <>
          {current ? (
            <>
              <PriceChart
                key={`${current.code}:${asset?.exchange === current.code ? asset.symbol : ''}`}
                exchange={current.code}
                initialSymbol={
                  asset?.exchange === current.code ? asset.symbol : ''
                }
                initialName={asset?.exchange === current.code ? asset.name : ''}
              />
              <PublicMarketTable
                onSelect={(item) => {
                  setAsset(item);
                  setSelected(item.exchange);
                }}
              />
              <MarketClock />
              <MarketSchedule code={current.code} />
            </>
          ) : (
            <p className={styles.emptyNotice}>
              {tx(
                'No hay mercados disponibles.',
                'No stock markets available right now.',
              )}
            </p>
          )}
        </>
      )}
    </section>
  );
}
