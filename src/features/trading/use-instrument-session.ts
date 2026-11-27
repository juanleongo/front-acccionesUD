'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getClock, getStatus, sessionState } from '@/features/markets/client';
import { QUERY_STALE_TIMES, queryKeys } from '@/lib/api';
import { getInstrumentDetails } from './trading-api';

const timezone = 'America/New_York';
const dayFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: timezone,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** A daily trading-day flag alone does not establish whether trading is open now. */
export function useInstrumentSession(symbol: string, enabled = true) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);
  const details = useQuery({
    enabled,
    queryKey: ['trading', 'instrument-details', symbol],
    queryFn: ({ signal }) => getInstrumentDetails(symbol, signal),
    staleTime: QUERY_STALE_TIMES.catalog,
    retry: false,
  });
  const clock = useQuery({
    enabled,
    queryKey: queryKeys.markets.clock(timezone),
    queryFn: ({ signal }) => getClock(signal),
    staleTime: QUERY_STALE_TIMES.realtime,
    refetchInterval: 60_000,
    retry: false,
  });
  const age = Math.max(0, now - clock.dataUpdatedAt);
  const instant =
    clock.data && !clock.isError && age < 120_000
      ? Date.parse(clock.data.timestamp) + age
      : NaN;
  const day = Number.isFinite(instant)
    ? dayFormatter.format(new Date(instant))
    : '';
  const market = details.data?.exchange ?? '';
  const schedule = useQuery({
    queryKey: queryKeys.markets.status(market, day, timezone),
    queryFn: ({ signal }) => getStatus(market, day, signal),
    enabled: Boolean(enabled && market && day),
    staleTime: QUERY_STALE_TIMES.realtime,
    refetchInterval: 60_000,
    retry: false,
  });
  return {
    checking: [details, clock, schedule].some(
      (query) => query.isPending && query.fetchStatus === 'fetching',
    ),
    state:
      details.isError || schedule.isError
        ? ('unknown' as const)
        : sessionState(schedule.data, day, instant),
    refresh: async () => {
      if (!enabled) return;
      await clock.refetch();
      if (market && day) await schedule.refetch();
    },
  };
}
