'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { useLocale } from '@/lib/i18n';
import {
  adminRead,
  adminWrite,
  haltSchema,
  marketSchema,
  pageOf,
} from './operations-api';
import {
  AdminAction,
  AdminError,
  dateValue,
  Panel,
  QueryTable,
  type Column,
} from './OperationsUi';
import styles from './operations.module.css';

export function HaltOperations() {
  const { tx, locale } = useLocale();
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState<z.infer<typeof haltSchema> | null>(
    null,
  );
  const markets = useQuery({
    queryKey: ['admin07', 'markets'],
    queryFn: ({ signal }) =>
      adminRead('/admin/markets', z.array(marketSchema), {}, signal),
    staleTime: 60_000,
    retry: false,
  });
  const scopeOptions = [
    { value: 'global', label: tx('Todas las bolsas', 'All exchanges') },
    ...(markets.data ?? []).map((market) => ({
      value: market.code,
      label: market.name,
    })),
  ];
  const states = [
    { value: 'active', label: tx('Activa', 'Active') },
    { value: 'scheduled', label: tx('Programada', 'Scheduled') },
    { value: 'released', label: tx('Levantada', 'Released') },
    { value: 'expired', label: tx('Finalizada', 'Expired') },
  ];
  const columns: Column<z.infer<typeof haltSchema>>[] = [
    {
      label: tx('Alcance', 'Scope'),
      render: (row) =>
        row.scope === 'global'
          ? tx('Todas las bolsas', 'All exchanges')
          : row.scope,
    },
    {
      label: tx('Estado', 'Status'),
      render: (row) => (
        <span className={styles.badge}>
          {states.find((state) => state.value === row.status)?.label}
        </span>
      ),
    },
    {
      label: tx('Inicio / Fin', 'Start / End'),
      render: (row) => (
        <>
          {dateValue(row.starts_at, locale)}
          <p className={styles.hint}>
            {row.ends_at
              ? dateValue(row.ends_at, locale)
              : tx('Hasta levantar la pausa', 'Until released')}
          </p>
        </>
      ),
    },
    { label: tx('Motivo', 'Reason'), render: (row) => row.reason },
    {
      label: tx('Acción', 'Action'),
      render: (row) =>
        ['active', 'scheduled'].includes(row.status) ? (
          <button
            type="button"
            className={styles.button}
            onClick={() => setSelected(row)}
          >
            {tx('Levantar pausa', 'Release halt')}
          </button>
        ) : (
          '—'
        ),
    },
  ];
  return (
    <Panel
      title={tx('Pausas de negociación', 'Trading halts')}
      hint={tx(
        'Controla pausas globales o de una bolsa. Una pausa puede impedir nuevas operaciones; revisa el alcance antes de confirmar. Horas del formulario: Colombia (UTC−5).',
        'Manage global or exchange-specific halts. A halt may block new trading; review the scope before confirming. Form times: Colombia (UTC−5).',
      )}
    >
      {markets.isError && (
        <AdminError
          error={markets.error}
          retry={() => void markets.refetch()}
        />
      )}
      <AdminAction
        title={tx('Crear pausa', 'Create halt')}
        description={tx(
          'Sin fecha de inicio se activa al confirmar. Sin fin permanece hasta que se levante.',
          'Without a start date it activates on confirmation. Without an end it remains until released.',
        )}
        disabled={!markets.data}
        fields={[
          {
            name: 'scope',
            label: tx('Alcance', 'Scope'),
            options: scopeOptions,
            required: true,
          },
          {
            name: 'starts_at',
            label: tx('Inicio (opcional)', 'Start (optional)'),
            kind: 'datetime',
          },
          {
            name: 'ends_at',
            label: tx('Fin (opcional)', 'End (optional)'),
            kind: 'datetime',
          },
        ]}
        validate={(values) =>
          values.ends_at &&
          Date.parse(`${values.ends_at}:00-05:00`) <=
            (values.starts_at
              ? Date.parse(`${values.starts_at}:00-05:00`)
              : Date.now())
            ? tx(
                'El fin debe ser posterior al inicio.',
                'End must be after start.',
              )
            : null
        }
        onConfirm={(values) =>
          adminWrite(
            '/admin/trading-halts',
            {
              scope: values.scope,
              reason: values.reason,
              totp_code: values.totp_code,
              ...(values.starts_at
                ? { starts_at: `${values.starts_at}:00-05:00` }
                : {}),
              ...(values.ends_at
                ? { ends_at: `${values.ends_at}:00-05:00` }
                : {}),
            },
            haltSchema,
          )
        }
      />
      {selected && (
        <AdminAction
          key={selected.id}
          title={tx(
            `Levantar pausa: ${selected.scope}`,
            `Release halt: ${selected.scope}`,
          )}
          description={selected.reason}
          onConfirm={async (values) => {
            const result = await adminWrite(
              `/admin/trading-halts/${encodeURIComponent(selected.id)}/release`,
              { reason: values.reason, totp_code: values.totp_code },
              haltSchema,
            );
            setSelected(null);
            return result;
          }}
        />
      )}
      <div className={styles.field}>
        <label htmlFor="halt-status">
          {tx('Estado de la pausa', 'Halt status')}
        </label>
        <CustomSelect
          id="halt-status"
          value={filter}
          onChange={setFilter}
          options={[
            { value: '', label: tx('Todos los estados', 'All statuses') },
            ...states,
          ]}
        />
      </div>
      <QueryTable
        key={filter}
        path="/admin/trading-halts"
        params={{ status: filter }}
        schema={pageOf(haltSchema)}
        columns={columns}
        title={tx('Historial de pausas', 'Halt history')}
      />
    </Panel>
  );
}
