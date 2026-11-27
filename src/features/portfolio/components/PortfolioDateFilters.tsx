'use client';
import { Icon } from '@/components/ui/Icon';
import { DatePicker } from '@/components/ui/DatePicker';
import { useLocale } from '@/lib/i18n';
import styles from '../portfolio.module.css';
export function PortfolioDateFilters({
  from,
  to,
  onFrom,
  onTo,
}: {
  from: string;
  to: string;
  onFrom: (value: string) => void;
  onTo: (value: string) => void;
}) {
  const { tx } = useLocale();
  const valid = Boolean(from && to && from <= to);
  return (
    <section
      className={styles.dateToolbar}
      aria-label={tx('Período de consulta', 'Query period')}
    >
      <div className={styles.dateToolbarTitle}>
        <Icon name="calendar" size={20} />
        <div>
          <strong>{tx('Período de consulta', 'Query period')}</strong>
          <p>
            {tx(
              'Consulta estadísticas y operaciones dentro de estas fechas.',
              'View statistics and executions within these dates.',
            )}
          </p>
        </div>
      </div>
      <div className={styles.filterRow}>
        <div className={styles.fieldGroup}>
          <span className={styles.fieldLabel}>{tx('Desde', 'From')}</span>
          <DatePicker
            label={tx('Desde', 'From')}
            value={from}
            onChange={onFrom}
            max={to || undefined}
          />
        </div>
        <div className={styles.fieldGroup}>
          <span className={styles.fieldLabel}>{tx('Hasta', 'To')}</span>
          <DatePicker
            label={tx('Hasta', 'To')}
            value={to}
            onChange={onTo}
            min={from || undefined}
          />
        </div>
      </div>
      {!valid && (
        <p role="alert" className={styles.alertError}>
          {tx(
            'Selecciona un rango válido: Desde debe ser anterior o igual a Hasta.',
            'Select a valid range: From must be on or before To.',
          )}
        </p>
      )}
    </section>
  );
}
