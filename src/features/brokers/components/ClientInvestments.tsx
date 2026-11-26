'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { useLocale } from '@/lib/i18n';
import { formatUsd } from '@/lib/formatters';
import { brokerRequest } from '../brokers-api';
import { positionsSchema, pageSchema, orderSchema } from '../brokers-schemas';
import type { BrokerClientItem } from '../brokers-types';
import { Pager } from './HistoryFilters';
import styles from '../brokers.module.css';
export function ClientInvestments({
  clients,
  userId,
}: {
  clients: BrokerClientItem[];
  userId: string;
}) {
  const { tx } = useLocale();
  const [selected, setSelected] = useState('');
  const id = clients.some((c) => c.investor_id === selected) ? selected : '';
  const [cursors, setCursors] = useState(['']);
  const positions = useQuery({
    queryKey: ['brokers', userId, 'client-positions', id],
    queryFn: ({ signal }) =>
      brokerRequest(
        `portfolio/broker/clients/${id}/positions`,
        positionsSchema,
        'GET',
        undefined,
        undefined,
        signal,
      ),
    enabled: Boolean(id),
    retry: false,
  });
  const orders = useQuery({
    queryKey: ['brokers', userId, 'client-orders', id, cursors.at(-1)],
    queryFn: ({ signal }) =>
      brokerRequest(
        `broker/clients/${id}/orders`,
        pageSchema(orderSchema),
        'GET',
        undefined,
        {
          page_size: '10',
          ...(cursors.at(-1) ? { cursor: cursors.at(-1)! } : {}),
        },
        signal,
      ),
    enabled: Boolean(id),
    retry: false,
  });
  return (
    <div className={styles.card}>
      <h3 className={styles.cardTitle}>
        {tx(
          'Inversiones y órdenes del cliente',
          'Client investments and orders',
        )}
      </h3>
      <label htmlFor="broker-client-inspect" className={styles.fieldLabel}>
        {tx('Cliente', 'Client')}
      </label>
      <CustomSelect
        id="broker-client-inspect"
        searchable
        value={id}
        onChange={(v) => {
          setSelected(v);
          setCursors(['']);
        }}
        options={[
          { value: '', label: tx('Selecciona un cliente', 'Select a client') },
          ...clients.map((c) => ({ value: c.investor_id, label: c.name })),
        ]}
      />
      {id && (
        <>
          {[positions, orders]
            .filter((q) => q.isError)
            .map((q, i) => (
              <p key={i} role="alert" className={styles.formError}>
                {q.error?.message}
                <button
                  className={styles.secondaryBtn}
                  onClick={() => void q.refetch()}
                >
                  {tx('Reintentar', 'Retry')}
                </button>
              </p>
            ))}
          <h4 className={styles.controlTitle}>
            {tx('Posiciones', 'Positions')}
          </h4>
          {positions.isPending && (
            <p className={styles.fieldHint}>{tx('Cargando…', 'Loading…')}</p>
          )}
          {positions.data?.positions.length === 0 && (
            <p className={styles.fieldHint}>
              {tx('Sin posiciones abiertas.', 'No open positions.')}
            </p>
          )}
          {positions.data?.positions.map((p) => (
            <p key={p.symbol} className={styles.controlHint}>
              {p.symbol} · {tx('Cantidad', 'Quantity')}: {p.qty} ·{' '}
              {tx('Valor', 'Value')}:{' '}
              {formatUsd(p.market_value, { withCode: true })} · P&amp;L:{' '}
              {formatUsd(p.unrealized_pnl, { withCode: true })}
            </p>
          ))}
          <h4 className={styles.controlTitle}>{tx('Órdenes', 'Orders')}</h4>
          {orders.isPending && (
            <p className={styles.fieldHint}>{tx('Cargando…', 'Loading…')}</p>
          )}
          {orders.data?.items.length === 0 && (
            <p className={styles.fieldHint}>
              {tx('Sin órdenes.', 'No orders.')}
            </p>
          )}
          {orders.data?.items.map((o) => (
            <p key={o.id} className={styles.controlHint}>
              {o.symbol} · {o.side} · {o.qty} · {o.status} · {o.created_at}
            </p>
          ))}
          <Pager
            index={cursors.length - 1}
            hasNext={Boolean(orders.data?.next_cursor)}
            onPrevious={() => setCursors((c) => c.slice(0, -1))}
            onNext={() => setCursors((c) => [...c, orders.data!.next_cursor!])}
          />
        </>
      )}
    </div>
  );
}
