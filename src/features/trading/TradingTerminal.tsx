'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { LoadingState } from '@/components/ui/LoadingState';
import { ActiveOrdersTable } from './ActiveOrdersTable';
import { PositionsCard } from './components/PositionsCard';
import { OrderDetails } from './OrderDetails';
import { OrderForm } from './OrderForm';
import { listOrders, getPositions, type OrderDetail } from './trading-api';
import { ORDER_STATUS_OPTIONS } from './trading-labels';
import styles from './trading.module.css';

export function TradingTerminal({
  initialSymbol,
}: { initialSymbol?: string | undefined } = {}) {
  const client = useQueryClient();
  const [selected, setSelected] = useState<string | null>(null);
  const [editing, setEditing] = useState<OrderDetail | undefined>();
  const [status, setStatus] = useState('');
  const [symbol, setSymbol] = useState('');
  const [cursors, setCursors] = useState<string[]>(['']);
  const cursor = cursors[cursors.length - 1] ?? '';

  const orders = useQuery({
    queryKey: ['orders', cursor, symbol, status],
    queryFn: ({ signal }) => listOrders(cursor, symbol, status, signal),
    retry: false,
    refetchInterval: 15000,
  });

  const positions = useQuery({
    queryKey: ['trading-positions'],
    queryFn: ({ signal }) => getPositions(signal),
    retry: false,
    refetchInterval: 15000,
  });

  function refresh() {
    void client.invalidateQueries({ queryKey: ['orders'] });
    void client.invalidateQueries({ queryKey: ['trading-positions'] });
    void client.invalidateQueries({ queryKey: ['wallet'] });
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
            <h2 className={styles.cardTitle}>Órdenes y ejecuciones</h2>
            <p className={styles.cardSubtitle}>
              Seguimiento de órdenes activas, programadas, devueltas e historial
              reciente.
            </p>
          </div>
          <button
            type="button"
            className={styles.btnCompact}
            disabled={orders.isFetching}
            onClick={refresh}
          >
            Actualizar
          </button>
        </div>

        <div className={styles.filterBar}>
          <label className={styles.fieldGroup}>
            Filtrar por símbolo
            <input
              className={styles.input}
              placeholder="Ej. AAPL, MSFT…"
              value={symbol}
              onChange={(e) => {
                setSymbol(e.target.value.toUpperCase());
                setCursors(['']);
              }}
            />
          </label>
          <label className={styles.fieldGroup}>
            Estado
            <select
              className={styles.select}
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setCursors(['']);
              }}
            >
              <option value="">Todos</option>
              {ORDER_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {orders.isPending && (
          <LoadingState
            mode="compact"
            label="Consultando órdenes…"
            detail="Sincronizando órdenes activas e historial reciente."
          />
        )}

        {orders.isError && (
          <p role="alert" className={styles.alertError}>
            No se pudieron consultar las órdenes.
          </p>
        )}

        {orders.data && (
          <ActiveOrdersTable
            orders={orders.data.items}
            onSelect={(id) => setSelected(id)}
          />
        )}

        <div className={styles.paginationBar}>
          <button
            type="button"
            className={styles.btnCompact}
            disabled={cursors.length === 1 || orders.isFetching}
            onClick={() => setCursors((previous) => previous.slice(0, -1))}
          >
            Anterior
          </button>
          <span className={styles.pageLabel}>Página {cursors.length}</span>
          <button
            type="button"
            className={styles.btnCompact}
            disabled={!orders.data?.next_cursor || orders.isFetching}
            onClick={() => {
              if (orders.data?.next_cursor)
                setCursors((previous) => [
                  ...previous,
                  orders.data.next_cursor!,
                ]);
            }}
          >
            Siguiente
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
