'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { LoadingState } from '@/components/ui/LoadingState';
import { useLocale } from '@/lib/i18n';
import {
  adminRead,
  custodySchema,
  pageOf,
  trailSchema,
} from './operations-api';
import {
  AdminError,
  dateValue,
  Evidence,
  moneyValue,
  Panel,
  PeriodFields,
  QueryTable,
  Table,
  textValue,
  usePeriod,
  uuidValid,
} from './OperationsUi';
import styles from './operations.module.css';

function Custody({ id }: { id: string }) {
  const { tx, locale } = useLocale();
  const query = useQuery({
    queryKey: ['admin07', 'custody', id],
    queryFn: ({ signal }) =>
      adminRead(
        `/admin/audit-trail/orders/${encodeURIComponent(id)}`,
        custodySchema,
        {},
        signal,
      ),
    retry: false,
  });
  if (query.isPending)
    return (
      <LoadingState
        mode="compact"
        label={tx('Consultando trazabilidad…', 'Loading order custody…')}
      />
    );
  if (query.isError)
    return (
      <AdminError error={query.error} retry={() => void query.refetch()} />
    );
  const data = query.data;
  return (
    <div className={styles.evidence}>
      <h3 className={styles.title}>
        {data.order.symbol} · {tx('Trazabilidad de la orden', 'Order custody')}
      </h3>
      <div className={styles.grid}>
        <div className={styles.metric}>
          <span className={styles.hint}>
            {tx('Cantidad ejecutada', 'Filled quantity')}
          </span>
          <strong>
            {textValue(data.order.filled_qty)} / {textValue(data.order.qty)}
          </strong>
        </div>
        <div className={styles.metric}>
          <span className={styles.hint}>
            {tx('Precio de ejecución', 'Fill price')}
          </span>
          <strong>{moneyValue(data.order.filled_avg_price)}</strong>
        </div>
      </div>
      <Evidence
        title={tx('Identidad y autorización', 'Identity and authorization')}
        value={{
          user_id: data.order.user_id,
          created_by: data.created_by,
          signed_by: data.signed_by,
          signed_at: dateValue(data.signed_at, locale),
          authorization_method: data.authorization_method,
          first_submitted_at: dateValue(data.first_submitted_at, locale),
        }}
      />
      {(
        [
          ['events', tx('Eventos', 'Events')],
          ['executions', tx('Ejecuciones', 'Executions')],
          ['cancel_requests', tx('Cancelaciones', 'Cancellations')],
          ['reauthorizations', tx('Reautorizaciones', 'Reauthorizations')],
          ['proposals', tx('Propuestas relacionadas', 'Related proposals')],
        ] as const
      ).map(([key, label]) => (
        <section key={key}>
          <h4 className={styles.hint}>
            {label} ({data[key].length})
          </h4>
          <Table
            rows={data[key]}
            label={label}
            columns={[
              {
                label: tx('Registro', 'Record'),
                render: (row) => (
                  <Evidence
                    title={tx('Ver detalle', 'View details')}
                    value={row}
                  />
                ),
              },
            ]}
          />
        </section>
      ))}
    </div>
  );
}

export function AuditOperations() {
  const { tx, locale } = useLocale();
  const [period, setPeriod] = usePeriod();
  const [draft, setDraft] = useState({
    source: '',
    user_id: '',
    action: '',
    entity_type: '',
    entity_id: '',
  });
  const [filters, setFilters] = useState(draft);
  const [orderDraft, setOrderDraft] = useState('');
  const [orderId, setOrderId] = useState('');
  const [invalid, setInvalid] = useState(false);
  const [orderInvalid, setOrderInvalid] = useState(false);
  return (
    <div className={styles.workspace}>
      <Panel
        title={tx('Auditoría consolidada', 'Consolidated audit')}
        hint={tx(
          'Consulta la actividad registrada por administración, órdenes, comisionistas y acceso. Las fechas mostradas usan la hora de Nueva York.',
          'Review recorded activity across administration, orders, brokers and access. Displayed timestamps use New York time.',
        )}
      >
        <PeriodFields value={period} onChange={setPeriod} />
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            const bad = Boolean(draft.user_id && !uuidValid(draft.user_id));
            setInvalid(bad);
            if (!bad) setFilters(draft);
          }}
        >
          <div className={styles.grid}>
            <div className={styles.field}>
              <label htmlFor="trail-source">
                {tx('Origen del evento', 'Event source')}
              </label>
              <CustomSelect
                id="trail-source"
                value={draft.source}
                onChange={(source) => setDraft({ ...draft, source })}
                options={[
                  { value: '', label: tx('Todos los orígenes', 'All sources') },
                  {
                    value: 'admin',
                    label: tx('Administración', 'Administration'),
                  },
                  { value: 'orders', label: tx('Órdenes', 'Orders') },
                  { value: 'brokers', label: tx('Comisionistas', 'Brokers') },
                  { value: 'auth', label: tx('Acceso', 'Access') },
                ]}
              />
            </div>
            {(['user_id', 'action', 'entity_type', 'entity_id'] as const).map(
              (key) => (
                <label key={key} className={styles.field}>
                  {
                    {
                      user_id: tx('ID de usuario', 'User ID'),
                      action: tx('Acción registrada', 'Recorded action'),
                      entity_type: tx('Tipo de entidad', 'Entity type'),
                      entity_id: tx('ID de entidad', 'Entity ID'),
                    }[key]
                  }
                  <input
                    value={draft[key]}
                    onChange={(event) =>
                      setDraft({ ...draft, [key]: event.target.value.trim() })
                    }
                  />
                </label>
              ),
            )}
          </div>
          {invalid && (
            <p className={styles.error} role="alert">
              {tx(
                'El ID de usuario debe ser un UUID válido.',
                'User ID must be a valid UUID.',
              )}
            </p>
          )}
          <div className={styles.actions}>
            <button type="submit" className={styles.button}>
              {tx('Aplicar filtros', 'Apply filters')}
            </button>
          </div>
        </form>
        <QueryTable
          key={JSON.stringify([period, filters])}
          path="/admin/audit-trail"
          params={{ ...period, ...filters }}
          schema={pageOf(trailSchema)}
          title={tx('Eventos de auditoría', 'Audit events')}
          columns={[
            {
              label: tx('Fecha / Origen', 'Date / Source'),
              render: (row) => (
                <>
                  {dateValue(row.occurred_at, locale)}
                  <p className={styles.hint}>{row.source}</p>
                </>
              ),
            },
            {
              label: tx('Acción', 'Action'),
              render: (row) => row.action.replaceAll('_', ' '),
            },
            {
              label: tx('Actor', 'Actor'),
              render: (row) => row.actor_id ?? row.actor_type,
            },
            {
              label: tx('Entidad', 'Entity'),
              render: (row) => (
                <>
                  {row.entity_type}
                  <p className={styles.hint}>{row.entity_id}</p>
                </>
              ),
            },
            {
              label: tx('Cambio de estado', 'State change'),
              render: (row) =>
                `${row.from_state ?? '—'} → ${row.to_state ?? '—'}`,
            },
            {
              label: tx('Evidencia', 'Evidence'),
              render: (row) => (
                <Evidence
                  title={tx('Ver detalle', 'View details')}
                  value={row.details}
                />
              ),
            },
          ]}
        />
      </Panel>
      <Panel
        title={tx('Trazabilidad de una orden', 'Order custody')}
        hint={tx(
          'Relaciona la orden con sus ejecuciones, autorizaciones, cancelaciones y propuestas.',
          'Connect an order with its executions, authorizations, cancellations and proposals.',
        )}
      >
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            const bad = !uuidValid(orderDraft);
            setOrderInvalid(bad);
            if (!bad) setOrderId(orderDraft);
          }}
        >
          <label className={styles.field}>
            {tx('ID de la orden', 'Order ID')}
            <input
              value={orderDraft}
              onChange={(event) => setOrderDraft(event.target.value.trim())}
            />
          </label>
          {orderInvalid && (
            <p className={styles.error} role="alert">
              {tx(
                'Ingresa un UUID de orden válido.',
                'Enter a valid order UUID.',
              )}
            </p>
          )}
          <div className={styles.actions}>
            <button className={styles.button} type="submit">
              {tx('Consultar trazabilidad', 'View custody')}
            </button>
          </div>
        </form>
        {orderId && <Custody key={orderId} id={orderId} />}
      </Panel>
    </div>
  );
}
