'use client';
import { useState } from 'react';
import { useLocale } from '@/lib/i18n';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { DatePicker } from '@/components/ui/DatePicker';
import type { Filters } from '../brokers-api';
import styles from '../brokers.module.css';
export function HistoryFilters({
  states,
  onApply,
}: {
  states: Record<string, string>;
  onApply: (filters: Filters) => void;
}) {
  const { tx } = useLocale();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  return (
    <form
      className={styles.formGrid}
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (Boolean(from) !== Boolean(to) || (from && from > to)) {
          setError(
            tx(
              'Indica ambas fechas en orden válido.',
              'Enter both dates in chronological order.',
            ),
          );
          return;
        }
        setError('');
        onApply({
          ...(from ? { from, to } : {}),
          ...(status ? { status } : {}),
        });
      }}
    >
      <div className={styles.fieldGroup}>
        <label htmlFor="broker-history-from" className={styles.fieldLabel}>
          {tx('Desde', 'From')}
        </label>
        <DatePicker
          id="broker-history-from"
          label={tx('Desde', 'From')}
          value={from}
          onChange={setFrom}
          max={to || undefined}
        />
      </div>
      <div className={styles.fieldGroup}>
        <label htmlFor="broker-history-to" className={styles.fieldLabel}>
          {tx('Hasta', 'To')}
        </label>
        <DatePicker
          id="broker-history-to"
          label={tx('Hasta', 'To')}
          value={to}
          onChange={setTo}
          min={from || undefined}
        />
      </div>
      <div className={styles.fieldGroup}>
        <label htmlFor="broker-history-status" className={styles.fieldLabel}>
          {tx('Estado', 'Status')}
        </label>
        <CustomSelect
          id="broker-history-status"
          value={status}
          onChange={setStatus}
          options={[
            { value: '', label: tx('Todos', 'All') },
            ...Object.entries(states).map(([value, label]) => ({
              value,
              label,
            })),
          ]}
        />
      </div>
      <div className={styles.btnRow}>
        <button className={styles.primaryBtn}>
          {tx('Aplicar filtros', 'Apply filters')}
        </button>
        <button
          type="button"
          className={styles.secondaryBtn}
          onClick={() => {
            setFrom('');
            setTo('');
            setStatus('');
            setError('');
            onApply({});
          }}
        >
          {tx('Limpiar', 'Clear')}
        </button>
      </div>
      {error && (
        <p role="alert" className={styles.formError}>
          {error}
        </p>
      )}
    </form>
  );
}
export function Pager({
  index,
  hasNext,
  onPrevious,
  onNext,
}: {
  index: number;
  hasNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
}) {
  const { tx } = useLocale();
  return (
    <div className={styles.pager}>
      <button
        className={styles.secondaryBtn}
        disabled={index === 0}
        onClick={onPrevious}
      >
        {tx('Anterior', 'Previous')}
      </button>
      <span className={styles.fieldHint}>
        {tx('Página', 'Page')} {index + 1} ·{' '}
        {tx('Máximo 10 registros', 'Up to 10 records')}
      </span>
      <button
        className={styles.secondaryBtn}
        disabled={!hasNext}
        onClick={onNext}
      >
        {tx('Siguiente', 'Next')}
      </button>
    </div>
  );
}
