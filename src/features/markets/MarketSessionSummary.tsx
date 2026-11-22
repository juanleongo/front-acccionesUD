'use client';

import { useEffect, useState } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
import { Icon } from '@/components/ui/Icon';
import { QUERY_STALE_TIMES, queryKeys } from '@/lib/api';
import { useLocale } from '@/lib/i18n';
import { getClock, getMarkets, getStatus, tz } from './api';
import { formatInstant, localDay } from './marketDates';
import { sessionState } from './session-state';
import styles from './market-session-summary.module.css';

/** Existing authenticated market APIs; never infer all exchange states from one clock flag. */
export function MarketSessionSummary() {
  const { locale, tx } = useLocale();
  const [localNow, setLocalNow] = useState(Date.now);
  useEffect(() => {
    const timer = setInterval(() => setLocalNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);
  const markets = useQuery({
    queryKey: queryKeys.markets.list(),
    queryFn: ({ signal }) => getMarkets(signal),
    staleTime: QUERY_STALE_TIMES.catalog,
    retry: false,
  });
  const clock = useQuery({
    queryKey: queryKeys.markets.clock(tz),
    queryFn: ({ signal }) => getClock(signal),
    staleTime: QUERY_STALE_TIMES.realtime,
    refetchInterval: 60000,
    refetchOnWindowFocus: true,
    retry: false,
  });
  const clockAge = Math.max(0, localNow - clock.dataUpdatedAt);
  const now =
    clock.data && !clock.isError && clockAge < 120000
      ? Date.parse(clock.data.timestamp) + clockAge
      : NaN;
  const day = Number.isFinite(now) ? localDay.format(new Date(now)) : '';
  const exchanges = markets.data ?? [];
  const schedules = useQueries({
    queries: exchanges.map((market) => ({
      queryKey: queryKeys.markets.status(market.code, day, tz),
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        getStatus(market.code, day, signal),
      enabled: Boolean(day),
      staleTime: QUERY_STALE_TIMES.realtime,
      refetchInterval: 60000,
      refetchOnWindowFocus: true,
      retry: false,
    })),
  });
  return (
    <section
      className={styles.summary}
      aria-label={tx('Estado de las bolsas', 'Exchange session status')}
    >
      <div className={styles.heading}>
        <Icon name="globe" size={15} />
        <span>
          {tx(
            'Sesión regular · Nueva York (ET)',
            'Regular session · New York (ET)',
          )}
        </span>
      </div>
      {markets.isPending ? (
        <p className={styles.notice} role="status">
          {tx('Consultando bolsas…', 'Loading exchanges…')}
        </p>
      ) : markets.isError || !exchanges.length ? (
        <p className={styles.notice}>
          {tx(
            'No pudimos confirmar las bolsas disponibles.',
            'Could not confirm available exchanges.',
          )}
        </p>
      ) : (
        <ul className={styles.list}>
          {exchanges.map((market, index) => {
            const schedule = schedules[index];
            const state =
              !markets.isError && !schedule?.isError
                ? sessionState(schedule?.data, day, now)
                : 'unknown';
            const pending =
              clock.isPending || (schedule?.isPending && Boolean(day));
            const label =
              state === 'open'
                ? tx('Abierta', 'Open')
                : state === 'closed'
                  ? tx('Cerrada', 'Closed')
                  : pending
                    ? tx('Consultando…', 'Checking…')
                    : tx('Sin confirmar', 'Unconfirmed');
            const title = `${market.name} · ${tx('Apertura', 'Open')}: ${formatInstant(schedule?.data?.open_at ?? null, locale)} · ${tx('Cierre', 'Close')}: ${formatInstant(schedule?.data?.close_at ?? null, locale)}`;
            return (
              <li
                key={market.code}
                className={`${styles.exchange} ${styles[state]}`}
                title={title}
              >
                <span className={styles.dot} aria-hidden="true" />
                <strong>{market.code}</strong>
                <span>{label}</span>
              </li>
            );
          })}
        </ul>
      )}
      {!markets.isPending &&
        (markets.isError ||
          !exchanges.length ||
          clock.isError ||
          schedules.some((schedule) => schedule.isError)) && (
          <button
            type="button"
            className={styles.retry}
            onClick={() => {
              void markets.refetch();
              void clock.refetch();
              schedules.forEach((schedule) => {
                if (day) void schedule.refetch();
              });
            }}
          >
            {tx('Reintentar estados', 'Retry status')}
          </button>
        )}
    </section>
  );
}
