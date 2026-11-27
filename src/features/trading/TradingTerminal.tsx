'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { LoadingState } from '@/components/ui/LoadingState';
import { DatePicker } from '@/components/ui/DatePicker';
import { QUERY_STALE_TIMES, queryKeys } from '@/lib/api';
import { useLocale } from '@/lib/i18n';
import { ActiveOrdersTable } from './ActiveOrdersTable';
import { PositionsCard } from './components/PositionsCard';
import { OrderDetails } from './OrderDetails';
import { OrderForm } from './OrderForm';
import { listOrders, getPositions, type OrderDetail } from './trading-api';
import { getOrderStatusOptions } from './trading-labels';
import styles from './trading.module.css';

export function TradingTerminal({
  initialSymbol,
}: { initialSymbol?: string | undefined } = {}) {
  const { locale, tx } = useLocale();
  const statusOptions = getOrderStatusOptions(locale);
  const client = useQueryClient();
  const [selected, setSelected] = useState<string | null>(null);
  const [editing, setEditing] = useState<OrderDetail | undefined>();
  const [status, setStatus] = useState('');
  const [symbol, setSymbol] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const invalidDates = Boolean(fromDate && toDate && fromDate > toDate);
  const [cursors, setCursors] = useState<string[]>(['']);
  const cursor = cursors[cursors.length - 1] ?? '';

  const orders = useQuery({
    queryKey: ['orders', cursor, symbol, status, fromDate, toDate],
    queryFn: ({ signal }) =>
      listOrders(cursor, symbol, status, signal, fromDate, toDate),
    enabled: !invalidDates,
    staleTime: QUERY_STALE_TIMES.realtime,
    retry: false,
    refetchInterval: 15000,
  });

  const positions = useQuery({
    queryKey: queryKeys.orders.positions(),
    queryFn: ({ signal }) => getPositions(signal),
    staleTime: QUERY_STALE_TIMES.realtime,
    retry: false,
    refetchInterval: 15000,
  });

  function refresh() {
    void client.invalidateQueries({ queryKey: queryKeys.orders.all });
    void client.invalidateQueries({ queryKey: queryKeys.orders.positions() });
    void client.invalidateQueries({ queryKey: queryKeys.wallet.all });
  }

  return (
    <div className={styles.tradingContainer}>
      <div className={styles.terminalGrid}>
        <OrderForm
          key={editing?.id ?? initialSymbol ?? 'new'}
          initialSymbol={initialSymbol}
          {...(editing ? { editing } : {})}
          onStopEditing={() => setEditing(undefined)}
          onOrderCreated={(order) => {
            refresh();
            setSelected(order.id);
          }}
        />
        <PositionsCard
          positions={positions.data?.positions ?? []}
          positionsAsOf={positions.data?.positions_as_of}
          isPending={positions.isPending}
          isError={positions.isError}
        />
      </div>

      <section className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <h2 className={styles.cardTitle}>
              {tx('Órdenes y ejecuciones', 'Orders & executions')}
            </h2>
            <p className={styles.cardSubtitle}>
              {tx(
                'Aquí aparecen tus solicitudes de compra y venta. Una orden pendiente aún no es una compra realizada: la cantidad ejecutada y el precio ejecutado muestran lo que realmente se negoció.',
                'Your buy and sell requests appear here. A pending order is not a completed trade: filled quantity and execution price show what actually traded.',
              )}
            </p>
          </div>
          <button
            type="button"
            className={styles.btnCompact}
            disabled={invalidDates || orders.isFetching}
            onClick={refresh}
          >
            {tx('Actualizar', 'Refresh')}
          </button>
        </div>

        <div className={styles.filterBar}>
          <label className={styles.fieldGroup}>
            <span className={styles.fieldLabel}>
              {tx('Filtrar por símbolo', 'Filter by symbol')}
            </span>
            <input
              className={styles.input}
              placeholder={tx('Ej. AAPL, MSFT…', 'E.g. AAPL, MSFT…')}
              value={symbol}
              onChange={(e) => {
                setSymbol(e.target.value.toUpperCase());
                setCursors(['']);
              }}
            />
          </label>
          <div className={styles.fieldGroup}>
            <label htmlFor="orders-filter-status" className={styles.fieldLabel}>
              {tx('Estado', 'Status')}
            </label>
            <CustomSelect
              id="orders-filter-status"
              value={status}
              onChange={(val) => {
                setStatus(val);
                setCursors(['']);
              }}
              options={[
                { value: '', label: tx('Todos', 'All') },
                ...statusOptions,
              ]}
            />
          </div>
          <div className={styles.fieldGroup}>
            <span className={styles.fieldLabel}>{tx('Desde', 'From')}</span>
            <DatePicker
              label={tx('Desde', 'From')}
              value={fromDate}
              max={toDate || undefined}
              onChange={(value) => {
                setFromDate(value);
                setCursors(['']);
              }}
            />
          </div>
          <div className={styles.fieldGroup}>
            <span className={styles.fieldLabel}>{tx('Hasta', 'To')}</span>
            <DatePicker
              label={tx('Hasta', 'To')}
              value={toDate}
              min={fromDate || undefined}
              onChange={(value) => {
                setToDate(value);
                setCursors(['']);
              }}
            />
          </div>
          <button
            type="button"
            className={styles.btnCompact}
            disabled={!fromDate && !toDate}
            onClick={() => {
              setFromDate('');
              setToDate('');
              setCursors(['']);
            }}
          >
            {tx('Limpiar fechas', 'Clear dates')}
          </button>
        </div>
        <p className={styles.cardSubtitle}>
          {tx(
            'Fecha de creación de la orden · Hora de Colombia (UTC−5). Incluye ambos días.',
            'Order creation date · Colombia time (UTC−5). Both dates included.',
          )}
        </p>
        {invalidDates && (
          <p role="alert" className={styles.alertError}>
            {tx(
              'La fecha Desde no puede ser posterior a Hasta.',
              'From date cannot be after To date.',
            )}
          </p>
        )}

        {!invalidDates && orders.isPending && (
          <LoadingState
            mode="compact"
            label={tx('Consultando órdenes…', 'Loading orders…')}
            detail={tx(
              'Sincronizando órdenes activas e historial reciente.',
              'Syncing active orders and recent history.',
            )}
          />
        )}

        {orders.isError && (
          <p role="alert" className={styles.alertError}>
            {tx(
              'No se pudieron consultar las órdenes.',
              'Could not load orders.',
            )}
          </p>
        )}

        {!invalidDates && orders.data && (
          <ActiveOrdersTable
            orders={orders.data.items}
            onSelect={(id) => setSelected(id)}
          />
        )}

        <div className={styles.paginationBar}>
          <button
            type="button"
            className={styles.btnCompact}
            disabled={invalidDates || cursors.length === 1 || orders.isFetching}
            onClick={() => setCursors((previous) => previous.slice(0, -1))}
          >
            {tx('Anterior', 'Previous')}
          </button>
          <span className={styles.pageLabel}>
            {tx(`Página ${cursors.length}`, `Page ${cursors.length}`)}
          </span>
          <button
            type="button"
            className={styles.btnCompact}
            disabled={
              invalidDates || !orders.data?.next_cursor || orders.isFetching
            }
            onClick={() => {
              if (orders.data?.next_cursor)
                setCursors((previous) => [
                  ...previous,
                  orders.data.next_cursor!,
                ]);
            }}
          >
            {tx('Siguiente', 'Next')}
          </button>
        </div>
      </section>

      {selected && (
        <OrderDetails
          key={selected}
          id={selected}
          onUpdated={refresh}
          onEdit={(order) => setEditing(order)}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
