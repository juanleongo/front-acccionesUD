'use client';
import { useQuery } from '@tanstack/react-query';
import { LoadingState } from '@/components/ui/LoadingState';
import { getClock, tz } from './api';
import { formatInstant } from './marketDates';
import { Problem } from './MarketProblem';
import styles from './markets.module.css';

export function MarketClock() {
  const clock = useQuery({
    queryKey: ['markets', 'clock', tz],
    queryFn: ({ signal }) => getClock(signal),
    refetchInterval: 60000,
  });
  return (
    <div className={styles.clockCard}>
      <div className={styles.clockHeader}>
        <div>
          <span className={styles.sectionKicker}>
            SINCRONIZACIÓN WALL STREET · {tz}
          </span>
          <h3>Reloj bursátil en vivo</h3>
        </div>
        {clock.data && !clock.error && (
          <span
            className={
              clock.data.is_open ? styles.badgeOpen : styles.badgeClosed
            }
          >
            ● {clock.data.is_open ? 'Mercado Abierto' : 'Mercado Cerrado'}
          </span>
        )}
      </div>
      {clock.error ? (
        <Problem error={clock.error} retry={clock.refetch} />
      ) : clock.data ? (
        <div className={styles.clockStatsGrid}>
          <div className={styles.clockStatItem}>
            <span className={styles.clockStatLabel}>Última actualización</span>
            <strong className={styles.clockStatValue}>
              {formatInstant(clock.data.timestamp)}
            </strong>
          </div>
          <div className={styles.clockStatItem}>
            <span className={styles.clockStatLabel}>Próxima apertura</span>
            <strong className={styles.clockStatValue}>
              {formatInstant(clock.data.next_open)}
            </strong>
          </div>
          <div className={styles.clockStatItem}>
            <span className={styles.clockStatLabel}>Próximo cierre</span>
            <strong className={styles.clockStatValue}>
              {formatInstant(clock.data.next_close)}
            </strong>
          </div>
        </div>
      ) : (
        <LoadingState
          mode="compact"
          label="Consultando reloj bursátil…"
          detail="Sincronizando horario oficial de negociación."
        />
      )}
    </div>
  );
}
