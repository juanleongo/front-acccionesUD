'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { LoadingState } from '@/components/ui/LoadingState';
import { useLocale } from '@/lib/i18n';
import {
  adminRead,
  marketSchema,
  pageOf,
  scheduleSchema,
} from './operations-api';
import {
  AdminError,
  dateValue,
  Evidence,
  Panel,
  PeriodFields,
  QueryTable,
  Table,
  usePeriod,
} from './OperationsUi';
import styles from './operations.module.css';

function ScheduleChanges({ market }: { market: string }) {
  const { tx, locale } = useLocale();
  const [period, setPeriod] = usePeriod();
  return (
    <>
      <PeriodFields value={period} onChange={setPeriod} />
      <QueryTable
        key={JSON.stringify(period)}
        path={`/admin/markets/${encodeURIComponent(market)}/schedule-changes`}
        params={period}
        schema={pageOf(scheduleSchema)}
        title={tx('Cambios de horario', 'Schedule changes')}
        columns={[
          {
            label: tx('Fecha', 'Date'),
            render: (row) => dateValue(row.occurred_at, locale),
          },
          {
            label: tx('Acción', 'Action'),
            render: (row) => row.action.replaceAll('_', ' '),
          },
          {
            label: tx('Vigencia', 'Effective from'),
            render: (row) => row.effective_from,
          },
          {
            label: tx('Notificación', 'Dispatch'),
            render: (row) => (
              <span className={styles.badge}>
                {row.dispatch_status === 'pending'
                  ? tx('Pendiente', 'Pending')
                  : tx('Enviada', 'Dispatched')}
              </span>
            ),
          },
          {
            label: tx('Órdenes / Usuarios', 'Orders / Users'),
            render: (row) =>
              `${row.affected_orders ?? '—'} / ${row.notified_users ?? '—'}`,
          },
          {
            label: tx('Cambios', 'Changes'),
            render: (row) => (
              <Evidence
                title={tx('Antes y después', 'Before and after')}
                value={{ before: row.before, after: row.after }}
              />
            ),
          },
        ]}
      />
    </>
  );
}
export function MarketOperations() {
  const { tx } = useLocale();
  const [selected, setSelected] = useState('');
  const query = useQuery({
    queryKey: ['admin07', 'markets'],
    queryFn: ({ signal }) =>
      adminRead('/admin/markets', z.array(marketSchema), {}, signal),
    staleTime: 30_000,
    retry: false,
  });
  const market = selected || query.data?.[0]?.code || '';
  return (
    <Panel
      title={tx(
        'Supervisión de bolsas y cambios de horario',
        'Exchange oversight and schedule changes',
      )}
      hint={tx(
        'Consulta las tarifas aplicables, las pausas y la distribución de los cambios de calendario.',
        'Review applicable fees, halts and schedule change dispatch.',
      )}
    >
      {query.isPending ? (
        <LoadingState
          mode="compact"
          label={tx('Consultando bolsas…', 'Loading exchanges…')}
        />
      ) : query.isError ? (
        <AdminError error={query.error} retry={() => void query.refetch()} />
      ) : (
        <>
          <Table
            label={tx(
              'Estado administrativo de las bolsas',
              'Exchange administration status',
            )}
            rows={query.data}
            columns={[
              { label: tx('Bolsa', 'Exchange'), render: (row) => row.name },
              {
                label: tx('Zona horaria', 'Timezone'),
                render: (row) => row.timezone,
              },
              {
                label: tx('Comisión', 'Commission'),
                render: (row) => `${row.commission_terms.commission_rate_pct}%`,
              },
              {
                label: tx('Pausas', 'Halts'),
                render: (row) => row.trading_halts.length,
              },
              {
                label: tx('Calendario', 'Schedule'),
                render: (row) => (
                  <Evidence
                    title={tx(
                      'Ver horario y excepciones',
                      'View schedule and overrides',
                    )}
                    value={{
                      schedule: row.default_schedule,
                      overrides: row.overrides,
                    }}
                  />
                ),
              },
            ]}
          />
          <div className={styles.field}>
            <label htmlFor="schedule-market">
              {tx('Historial de la bolsa', 'Exchange history')}
            </label>
            <CustomSelect
              id="schedule-market"
              value={market}
              onChange={setSelected}
              options={query.data.map((row) => ({
                value: row.code,
                label: row.name,
              }))}
            />
          </div>
          {market && <ScheduleChanges key={market} market={market} />}
        </>
      )}
    </Panel>
  );
}
