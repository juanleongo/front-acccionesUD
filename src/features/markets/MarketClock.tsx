'use client';
import { useQuery } from '@tanstack/react-query';
import { LoadingState } from '@/components/ui/LoadingState';
import { QUERY_STALE_TIMES, queryKeys } from '@/lib/api';
import { useLocale } from '@/lib/i18n';
import { getClock, tz } from './api';
import { formatInstant } from './marketDates';
import { Problem } from './MarketProblem';
import styles from './markets.module.css';

export function MarketClock() {
  const { locale, tx } = useLocale();
  const clock = useQuery({
    queryKey: queryKeys.markets.clock(tz),
    queryFn: ({ signal }) => getClock(signal),
    staleTime: QUERY_STALE_TIMES.realtime,
    refetchInterval: 60000,
  });
  return (
    <div className={styles.clockCard}>
      <div className={styles.clockHeader}>
        <div>
          <span className={styles.sectionKicker}>
            {tx('SINCRONIZACIÓN WALL STREET', 'WALL STREET SYNC')} · {tz}
          </span>
          <h3>{tx('Reloj bursátil en vivo', 'Live market clock')}</h3>
        </div>
        {clock.data && !clock.error && (
          <span
            className={
              clock.data.is_open ? styles.badgeOpen : styles.badgeClosed
            }
          >
            ●{' '}
            {clock.data.is_open
              ? tx('Mercado Abierto', 'Market Open')
              : tx('Mercado Cerrado', 'Market Closed')}
          </span>
        )}
      </div>
      {clock.error ? (
        <Problem error={clock.error} retry={clock.refetch} />
      ) : clock.data ? (
        <div className={styles.clockStatsGrid}>
          <div className={styles.clockStatItem}>
            <span className={styles.clockStatLabel}>
              {tx('Última actualización', 'Last update')}
            </span>
            <strong className={styles.clockStatValue}>
              {formatInstant(clock.data.timestamp, locale)}
            </strong>
          </div>
          <div className={styles.clockStatItem}>
            <span className={styles.clockStatLabel}>
              {tx('Próxima apertura', 'Next market open')}
            </span>
            <strong className={styles.clockStatValue}>
              {formatInstant(clock.data.next_open, locale)}
            </strong>
          </div>
          <div className={styles.clockStatItem}>
            <span className={styles.clockStatLabel}>
              {tx('Próximo cierre', 'Next market close')}
            </span>
            <strong className={styles.clockStatValue}>
              {formatInstant(clock.data.next_close, locale)}
            </strong>
          </div>
        </div>
      ) : (
        <LoadingState
          mode="compact"
          label={tx('Consultando reloj bursátil…', 'Loading market clock…')}
          detail={tx(
            'Sincronizando horario oficial de negociación.',
            'Syncing official trading hours.',
          )}
        />
      )}
    </div>
  );
}
