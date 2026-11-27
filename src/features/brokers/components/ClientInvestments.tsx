'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { useLocale } from '@/lib/i18n';
import { formatUsd, formatMarketDateTime } from '@/lib/formatters';
import { AssetLogo } from '@/components/market/AssetLogo';
import { LoadingState } from '@/components/ui/LoadingState';
import { formatOrderStatus } from '@/features/trading';
import ui from '../brokers-details.module.css';
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
  const { tx, locale } = useLocale();
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
            <LoadingState
              mode="compact"
              label={tx('Consultando posiciones…', 'Loading positions…')}
            />
          )}
          {positions.data?.positions.length === 0 && (
            <p className={styles.fieldHint}>
              {tx('Sin posiciones abiertas.', 'No open positions.')}
            </p>
          )}
          {positions.data && positions.data.positions.length > 0 && (
            <div
              className={ui.tableWrap}
              tabIndex={0}
              role="region"
              aria-label={tx('Posiciones del cliente', 'Client positions')}
            >
              <table className={ui.table}>
                <thead>
                  <tr>
                    <th>{tx('Instrumento', 'Instrument')}</th>
                    <th>{tx('Cantidad', 'Quantity')}</th>
                    <th>{tx('Valor de mercado', 'Market value')}</th>
                    <th>{tx('Ganancia / pérdida', 'Profit / loss')}</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.data.positions.map((p) => (
                    <tr key={p.symbol}>
                      <td data-label={tx('Instrumento', 'Instrument')}>
                        <span className={ui.asset}>
                          <AssetLogo symbol={p.symbol} />
                          <strong>{p.symbol}</strong>
                        </span>
                      </td>
                      <td data-label={tx('Cantidad', 'Quantity')}>{p.qty}</td>
                      <td data-label={tx('Valor de mercado', 'Market value')}>
                        {formatUsd(p.market_value, { withCode: true })}
                      </td>
                      <td
                        className={
                          Number(p.unrealized_pnl) > 0
                            ? ui.positive
                            : Number(p.unrealized_pnl) < 0
                              ? ui.negative
                              : undefined
                        }
                        data-label={tx('Ganancia / pérdida', 'Profit / loss')}
                      >
                        {formatUsd(p.unrealized_pnl, { withCode: true })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <h4 className={styles.controlTitle}>{tx('Órdenes', 'Orders')}</h4>
          {orders.isPending && (
            <LoadingState
              mode="compact"
              label={tx('Consultando órdenes…', 'Loading orders…')}
            />
          )}
          {orders.data?.items.length === 0 && (
            <p className={styles.fieldHint}>
              {tx('Sin órdenes.', 'No orders.')}
            </p>
          )}
          {orders.data && orders.data.items.length > 0 && (
            <div
              className={ui.tableWrap}
              tabIndex={0}
              role="region"
              aria-label={tx('Órdenes del cliente', 'Client orders')}
            >
              <table className={ui.table}>
                <thead>
                  <tr>
                    <th>{tx('Instrumento', 'Instrument')}</th>
                    <th>{tx('Operación', 'Side')}</th>
                    <th>{tx('Cantidad', 'Quantity')}</th>
                    <th>{tx('Estado', 'Status')}</th>
                    <th>{tx('Fecha', 'Date')}</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.data.items.map((o) => (
                    <tr key={o.id}>
                      <td data-label={tx('Instrumento', 'Instrument')}>
                        <span className={ui.asset}>
                          <AssetLogo symbol={o.symbol} />
                          <strong>{o.symbol}</strong>
                        </span>
                      </td>
                      <td data-label={tx('Operación', 'Side')}>
                        <span
                          className={
                            o.side === 'buy'
                              ? styles.badgeSuccess
                              : styles.badgeWarning
                          }
                        >
                          {o.side === 'buy'
                            ? tx('Compra', 'Buy')
                            : tx('Venta', 'Sell')}
                        </span>
                      </td>
                      <td data-label={tx('Cantidad', 'Quantity')}>{o.qty}</td>
                      <td data-label={tx('Estado', 'Status')}>
                        <span className={ui.badge}>
                          {formatOrderStatus(o.status, false, locale)}
                        </span>
                      </td>
                      <td data-label={tx('Fecha', 'Date')}>
                        {formatMarketDateTime(o.created_at, locale, {
                          timeZone: 'America/New_York',
                        })}{' '}
                        ET
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
