'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LoadingState } from '@/components/ui/LoadingState';
import { getMarkets } from './api';
import styles from './markets.module.css';
import { PriceChart } from './PriceChart';
import { MarketClock } from './MarketClock';
import { MarketSchedule } from './MarketSchedule';
import { Problem } from './MarketProblem';

export function Markets() {
  const list = useQuery({
    queryKey: ['markets', 'list'],
    queryFn: ({ signal }) => getMarkets(signal),
  });
  const [selected, setSelected] = useState('');
  const current = list.data?.find((m) => m.code === selected) ?? list.data?.[0];
  return (
    <section className={styles.panel} aria-label="Mercados bursátiles">
      <div className={styles.marketTopBar}>
        <div>
          <span className={styles.sectionKicker}>
            DATOS EN TIEMPO REAL · MERCADOS DE EE. UU.
          </span>
          <h2>Mercados bursátiles</h2>
        </div>
        {list.data && current && (
          <label className={styles.marketPickerLabel}>
            <span>Mercado</span>
            <select
              aria-label="Mercado"
              value={current.code}
              onChange={(e) => setSelected(e.target.value)}
            >
              {list.data.map((m) => (
                <option key={m.code} value={m.code}>
                  {m.name} ({m.code})
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {list.error ? (
        <Problem error={list.error} retry={list.refetch} />
      ) : !list.data ? (
        <LoadingState
          label="Consultando mercados bursátiles…"
          detail="Obteniendo bolsas habilitadas y estado de negociación en vivo."
        />
      ) : (
        <>
          {current ? (
            <>
              <PriceChart key={current.code} exchange={current.code} />
              <MarketClock />
              <MarketSchedule code={current.code} />
            </>
          ) : (
            <p className={styles.emptyNotice}>No hay mercados disponibles.</p>
          )}
        </>
      )}
    </section>
  );
}
