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
            disabled={invalidDates || orders.isFetching}
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
          <label className={styles.fieldGroup}>
            Desde
            <input
              className={styles.input}
              type="date"
              value={fromDate}
              max={toDate || undefined}
              onChange={(e) => {
                setFromDate(e.target.value);
                setCursors(['']);
              }}
            />
          </label>
          <label className={styles.fieldGroup}>
            Hasta
            <input
              className={styles.input}
              type="date"
              value={toDate}
              min={fromDate || undefined}
              onChange={(e) => {
                setToDate(e.target.value);
                setCursors(['']);
              }}
            />
          </label>
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
            Limpiar fechas
          </button>
        </div>
        <p className={styles.cardSubtitle}>
          Fecha de creación de la orden · Hora de Colombia (UTC−5). Incluye
          ambos días.
        </p>
        {invalidDates && (
          <p role="alert" className={styles.alertError}>
            La fecha Desde no puede ser posterior a Hasta.
          </p>
        )}

        {!invalidDates && orders.isPending && (
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
            Anterior
          </button>
          <span className={styles.pageLabel}>
            Página {cursors.length} · Máximo 10 órdenes
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
