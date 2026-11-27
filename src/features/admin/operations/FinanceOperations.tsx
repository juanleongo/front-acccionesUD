'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { z } from 'zod';
import { AssetLogo } from '@/components/market/AssetLogo';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { LoadingState } from '@/components/ui/LoadingState';
import { useLocale } from '@/lib/i18n';
import {
  adminRead,
  adminWrite,
  commissionsSchema,
  feeMatrixSchema,
  feeSchema,
  kpiSchema,
  pageOf,
} from './operations-api';
import {
  AdminAction,
  AdminError,
  dateValue,
  Evidence,
  moneyValue,
  Panel,
  PeriodFields,
  QueryTable,
  Table,
  usePeriod,
  uuidValid,
  type Column,
} from './OperationsUi';
import styles from './operations.module.css';

export function RealKpis() {
  const { tx, locale } = useLocale();
  const [period, setPeriod] = usePeriod();
  const query = useQuery({
    queryKey: ['admin07', 'kpis', period],
    queryFn: ({ signal }) =>
      adminRead('/admin/kpis', kpiSchema, period, signal),
    staleTime: 30_000,
    retry: false,
  });
  const labels: Record<string, [string, string]> = {
    registered_users: ['Usuarios registrados', 'Registered users'],
    new_registrations: ['Nuevos registros', 'New registrations'],
    active_users: ['Usuarios activos', 'Active users'],
    traded_volume_usd: ['Volumen negociado', 'Traded volume'],
    executions_count: ['Ejecuciones', 'Executions'],
    platform_commissions_usd: [
      'Comisiones de la plataforma',
      'Platform commissions',
    ],
    active_subscriptions: ['Suscripciones activas', 'Active subscriptions'],
    revenue_by_source: ['Ingresos por fuente', 'Revenue by source'],
    users_by_type: ['Inversionistas por perfil', 'Investors by profile'],
  };
  return (
    <Panel
      title={tx('Indicadores de actividad', 'Activity indicators')}
      hint={tx(
        'Datos calculados por el servidor para el período seleccionado. Las cifras incompletas se identifican expresamente.',
        'Server-calculated data for the selected period. Incomplete figures are explicitly identified.',
      )}
    >
      <PeriodFields value={period} onChange={setPeriod} />
      <div className={styles.actions}>
        <button
          className={styles.button}
          type="button"
          disabled={query.isFetching}
          onClick={() => void query.refetch()}
        >
          {tx('Actualizar indicadores', 'Refresh indicators')}
        </button>
      </div>
      {query.isPending ? (
        <LoadingState
          mode="compact"
          label={tx('Calculando indicadores…', 'Calculating indicators…')}
        />
      ) : query.isError ? (
        <AdminError error={query.error} retry={() => void query.refetch()} />
      ) : (
        <>
          <p className={styles.hint}>
            {tx('Corte de datos:', 'Data as of:')}{' '}
            {dateValue(query.data.as_of, locale)}{' '}
            {query.data.stale && (
              <span className={styles.badge}>
                {tx(
                  'Datos pendientes de actualización',
                  'Data awaiting refresh',
                )}
              </span>
            )}
          </p>
          <div className={styles.grid}>
            {Object.entries(query.data.metrics).map(([key, metric]) => (
              <article className={styles.metric} key={key}>
                <span className={styles.hint}>
                  {labels[key] ? tx(...labels[key]) : key.replaceAll('_', ' ')}
                </span>
                <strong>
                  {metric.unit === 'USD'
                    ? moneyValue(metric.value)
                    : new Intl.NumberFormat().format(Number(metric.value))}
                </strong>
                {metric.complete === false && (
                  <span className={styles.badge}>
                    {tx('Cifra parcial', 'Partial figure')}
                  </span>
                )}
                <Evidence
                  title={tx('Ver desglose', 'View breakdown')}
                  value={Object.fromEntries(
                    Object.entries(metric).filter(
                      ([name]) =>
                        !['value', 'definition', 'unit'].includes(name),
                    ),
                  )}
                />
              </article>
            ))}
          </div>
        </>
      )}
    </Panel>
  );
}

export function CommissionOperations() {
  const { tx, locale } = useLocale();
  const [period, setPeriod] = usePeriod();
  const [filters, setFilters] = useState({
    market: '',
    broker_id: '',
    investor_id: '',
  });
  const [draft, setDraft] = useState(filters);
  const [invalid, setInvalid] = useState(false);
  const columns: Column<z.infer<typeof commissionsSchema>['items'][number]>[] =
    [
      {
        label: tx('Instrumento', 'Instrument'),
        render: (row) => (
          <>
            <AssetLogo symbol={row.symbol} /> <strong>{row.symbol}</strong>
            <p className={styles.hint}>{row.exchange}</p>
          </>
        ),
      },
      {
        label: tx('Inversionista', 'Investor'),
        render: (row) => row.investor_name || row.user_id,
      },
      {
        label: tx('Operación', 'Side'),
        render: (row) =>
          tx(
            row.side === 'buy' ? 'Compra' : 'Venta',
            row.side === 'buy' ? 'Buy' : 'Sell',
          ),
      },
      {
        label: tx('Cantidad / Precio', 'Quantity / Price'),
        render: (row) => (
          <>
            {row.qty}
            <p className={styles.hint}>{moneyValue(row.price)}</p>
          </>
        ),
      },
      {
        label: tx('Comisión', 'Commission'),
        render: (row) => (
          <>
            {moneyValue(row.commission)}
            {row.commission_status === 'historical_terms_unknown' && (
              <span className={styles.badge}>
                {tx('Sin términos históricos', 'Historical terms unavailable')}
              </span>
            )}
          </>
        ),
      },
      {
        label: tx('Plataforma / Asesor', 'Platform / Advisor'),
        render: (row) => (
          <>
            {moneyValue(row.platform_share)} / {moneyValue(row.broker_share)}
          </>
        ),
      },
      {
        label: tx('Ejecución', 'Execution'),
        render: (row) => dateValue(row.executed_at, locale),
      },
    ];
  return (
    <Panel
      title={tx('Comisiones por ejecución', 'Execution commissions')}
      hint={tx(
        'Consulta comisiones efectivamente registradas y su distribución. Los totales corresponden a todo el período y los filtros, no solo a la página visible.',
        'Review recorded commissions and their distribution. Totals cover the full filtered period, not just the visible page.',
      )}
    >
      <PeriodFields value={period} onChange={setPeriod} />
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          const invalidId = [draft.broker_id, draft.investor_id].some(
            (id) => id && !uuidValid(id),
          );
          setInvalid(invalidId);
          if (!invalidId) setFilters(draft);
        }}
      >
        <div className={styles.grid}>
          {(['market', 'broker_id', 'investor_id'] as const).map((key) => (
            <label className={styles.field} key={key}>
              {key === 'market'
                ? tx('Bolsa (código)', 'Exchange (code)')
                : key === 'broker_id'
                  ? tx('ID del comisionista (opcional)', 'Broker ID (optional)')
                  : tx(
                      'ID del inversionista (opcional)',
                      'Investor ID (optional)',
                    )}
              <input
                value={draft[key]}
                onChange={(event) =>
                  setDraft({ ...draft, [key]: event.target.value.trim() })
                }
              />
            </label>
          ))}
        </div>
        {invalid && (
          <p className={styles.error} role="alert">
            {tx(
              'Los identificadores deben ser UUID válidos.',
              'IDs must be valid UUIDs.',
            )}
          </p>
        )}
        <div className={styles.actions}>
          <button className={styles.button} type="submit">
            {tx('Aplicar filtros', 'Apply filters')}
          </button>
        </div>
      </form>
      <QueryTable
        key={JSON.stringify([period, filters])}
        path="/admin/commissions"
        params={{ ...period, ...filters }}
        schema={commissionsSchema}
        columns={columns}
        title={tx('Comisiones', 'Commissions')}
      >
        {(data) => (
          <>
            <div className={styles.grid}>
              {[
                [
                  tx('Comisiones totales', 'Total commissions'),
                  data.totals.commission,
                ],
                [tx('Plataforma', 'Platform'), data.totals.platform_share],
                [tx('Comisionistas', 'Brokers'), data.totals.broker_share],
              ].map(([label, value]) => (
                <div className={styles.metric} key={String(label)}>
                  <span className={styles.hint}>{label}</span>
                  <strong>{moneyValue(value)}</strong>
                </div>
              ))}
            </div>
            {!data.totals.complete && (
              <p className={styles.badge}>
                {tx(
                  `${data.totals.historical_terms_unknown_count} ejecuciones sin términos históricos. Totales parciales.`,
                  `${data.totals.historical_terms_unknown_count} executions lack historical terms. Partial totals.`,
                )}
              </p>
            )}
            <Evidence
              title={tx('Distribución por bolsa', 'Distribution by exchange')}
              value={data.by_market}
            />
            <Evidence
              title={tx(
                'Distribución por comisionista',
                'Distribution by broker',
              )}
              value={data.by_broker}
            />
          </>
        )}
      </QueryTable>
    </Panel>
  );
}

export function FeeOperations() {
  const { tx, locale } = useLocale();
  const [scope, setScope] = useState('default');
  const matrix = useQuery({
    queryKey: ['admin07', 'fee-matrix'],
    queryFn: ({ signal }) =>
      adminRead('/admin/fee-schedules', feeMatrixSchema, {}, signal),
    retry: false,
    staleTime: 15_000,
  });
  // The first page is descending by version; includes canceled and scheduled versions.
  const latest = useQuery({
    queryKey: ['admin07', 'latest-fee', scope],
    queryFn: ({ signal }) =>
      adminRead(
        `/admin/fee-schedules/${encodeURIComponent(scope)}/versions`,
        pageOf(feeSchema),
        { page_size: '1' },
        signal,
      ),
    retry: false,
    staleTime: 0,
  });
  const [selected, setSelected] = useState<z.infer<typeof feeSchema> | null>(
    null,
  );
  const columns: Column<z.infer<typeof feeSchema>>[] = [
    { label: tx('Versión', 'Version'), render: (row) => row.version_no },
    {
      label: tx('Comisión', 'Commission'),
      render: (row) => `${row.commission_rate_pct}%`,
    },
    {
      label: tx('Plataforma / Asesor', 'Platform / Advisor'),
      render: (row) => `${row.platform_share_pct}% / ${row.broker_share_pct}%`,
    },
    {
      label: tx('Vigencia', 'Effective from'),
      render: (row) => dateValue(row.effective_from, locale),
    },
    {
      label: tx('Estado', 'Status'),
      render: (row) => (
        <span className={styles.badge}>
          {
            {
              scheduled: tx('Programada', 'Scheduled'),
              in_force: tx('Vigente', 'In force'),
              superseded: tx('Reemplazada', 'Superseded'),
              canceled: tx('Cancelada', 'Canceled'),
            }[row.status]
          }
        </span>
      ),
    },
    { label: tx('Motivo', 'Reason'), render: (row) => row.reason },
    {
      label: tx('Acción', 'Action'),
      render: (row) =>
        row.status === 'scheduled' ? (
          <button
            type="button"
            className={styles.button}
            onClick={() => setSelected(row)}
          >
            {tx('Cancelar versión', 'Cancel version')}
          </button>
        ) : (
          '—'
        ),
    },
  ];
  return (
    <Panel
      title={tx('Tarifas y versiones', 'Fees and versions')}
      hint={tx(
        'La tarifa determina la comisión total y su reparto. Una nueva versión afecta operaciones posteriores a su vigencia; el historial se conserva.',
        'Fees determine total commission and its distribution. A new version affects operations after its effective time; history is retained.',
      )}
    >
      {matrix.isPending ? (
        <LoadingState
          mode="compact"
          label={tx('Consultando tarifas…', 'Loading fees…')}
        />
      ) : matrix.isError ? (
        <AdminError error={matrix.error} retry={() => void matrix.refetch()} />
      ) : (
        <>
          <div className={styles.field}>
            <label htmlFor="fee-scope">
              {tx('Alcance de la tarifa', 'Fee scope')}
            </label>
            <CustomSelect
              id="fee-scope"
              value={scope}
              onChange={(value) => {
                setScope(value);
                setSelected(null);
              }}
              options={matrix.data.items.map((row) => ({
                value: row.scope,
                label:
                  row.scope === 'default'
                    ? tx('Tarifa general', 'Default fee')
                    : row.scope,
              }))}
            />
          </div>
          <Table
            label={tx('Tarifas vigentes', 'Current fees')}
            rows={matrix.data.items}
            columns={[
              {
                label: tx('Alcance', 'Scope'),
                render: (row) =>
                  row.scope === 'default'
                    ? tx('General', 'Default')
                    : row.scope,
              },
              {
                label: tx('Comisión total', 'Total commission'),
                render: (row) => `${row.terms.commission_rate_pct}%`,
              },
              {
                label: tx('Parte de plataforma', 'Platform share'),
                render: (row) => `${row.terms.platform_share_pct}%`,
              },
              {
                label: tx('Origen', 'Origin'),
                render: (row) =>
                  row.origin === 'default'
                    ? tx('Tarifa general', 'Default fee')
                    : tx('Específica de la bolsa', 'Exchange-specific'),
              },
            ]}
          />
        </>
      )}
      {latest.isError && (
        <AdminError error={latest.error} retry={() => void latest.refetch()} />
      )}
      <AdminAction
        key={`fee-form-${scope}`}
        title={tx('Crear versión de tarifa', 'Create fee version')}
        description={tx(
          `Alcance: ${scope}. La fecha es opcional; sin fecha entra en vigor al confirmar. Horas de Colombia (UTC−5).`,
          `Scope: ${scope}. Date is optional; without it the fee takes effect on confirmation. Colombia time (UTC−5).`,
        )}
        disabled={!matrix.data || !latest.data || latest.isFetching}
        fields={[
          {
            name: 'commission_rate_pct',
            label: tx(
              'Comisión total (%) · 0 a 10',
              'Total commission (%) · 0 to 10',
            ),
            kind: 'decimal',
            required: true,
          },
          {
            name: 'platform_share_pct',
            label: tx(
              'Parte de plataforma (%) · 0 a 100',
              'Platform share (%) · 0 to 100',
            ),
            kind: 'decimal',
            required: true,
          },
          {
            name: 'effective_from',
            label: tx(
              'Vigencia futura (opcional)',
              'Future effective date (optional)',
            ),
            kind: 'datetime',
          },
        ]}
        validate={(values) =>
          !/^\d+(?:\.\d{1,4})?$/.test(values.commission_rate_pct ?? '') ||
          Number(values.commission_rate_pct) > 10 ||
          !/^\d+(?:\.\d{1,2})?$/.test(values.platform_share_pct ?? '') ||
          Number(values.platform_share_pct) > 100 ||
          Boolean(
            values.effective_from &&
            Date.parse(`${values.effective_from}:00-05:00`) <= Date.now(),
          )
            ? tx(
                'Revisa los porcentajes y la vigencia futura.',
                'Check percentages and future effective date.',
              )
            : null
        }
        onConfirm={(values) =>
          adminWrite(
            `/admin/fee-schedules/${encodeURIComponent(scope)}/versions`,
            {
              commission_rate_pct: values.commission_rate_pct,
              platform_share_pct: values.platform_share_pct,
              expected_latest_version: latest.data?.items[0]?.version_no ?? 0,
              reason: values.reason,
              totp_code: values.totp_code,
              ...(values.effective_from
                ? { effective_from: `${values.effective_from}:00-05:00` }
                : {}),
            },
            feeSchema,
          )
        }
      />
      {selected && (
        <AdminAction
          key={selected.id}
          title={tx(
            `Cancelar versión ${selected.version_no}`,
            `Cancel version ${selected.version_no}`,
          )}
          description={tx(
            'Solo se pueden cancelar versiones que aún no han entrado en vigor.',
            'Only versions that have not taken effect can be canceled.',
          )}
          onConfirm={async (values) => {
            const result = await adminWrite(
              `/admin/fee-schedules/${encodeURIComponent(scope)}/versions/${encodeURIComponent(selected.id)}/cancel`,
              { reason: values.reason, totp_code: values.totp_code },
              feeSchema,
            );
            setSelected(null);
            return result;
          }}
        />
      )}
      <QueryTable
        key={`fee-history-${scope}`}
        path={`/admin/fee-schedules/${encodeURIComponent(scope)}/versions`}
        schema={pageOf(feeSchema)}
        columns={columns}
        title={tx('Historial de tarifas', 'Fee history')}
      />
    </Panel>
  );
}
