'use client';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { OrderForm } from './OrderForm';
import { ActiveOrdersTable } from './ActiveOrdersTable';
import { OrderDetails } from './OrderDetails';
import { listOrders, getPositions, type OrderDetail } from './trading-api';
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
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Tus posiciones</h2>
          <p className={styles.cardSubtitle}>
            Acciones disponibles para venta, descontando las reservas
            reportadas.
          </p>
          {positions.isPending && <p>Cargando posiciones…</p>}
          {positions.isError && (
            <p role="alert">No se pudieron consultar las posiciones.</p>
          )}
          {positions.data && (
            <>
              <p>
                Actualizado:{' '}
                {new Date(positions.data.positions_as_of).toLocaleString(
                  'es-CO',
                )}
              </p>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Instrumento</th>
                      <th>Cantidad</th>
                      <th>Reservada</th>
                      <th>Disponible</th>
                    </tr>
                  </thead>
                  <tbody>
                    {positions.data.positions.map((position) => (
                      <tr key={position.symbol}>
                        <td>{position.symbol}</td>
                        <td>{position.qty}</td>
                        <td>{position.reserved_qty}</td>
                        <td>
                          {Math.max(
                            0,
                            Number(position.qty) -
                              Number(position.reserved_qty),
                          )}
                        </td>
                      </tr>
                    ))}
                    {positions.data.positions.length === 0 && (
                      <tr>
                        <td colSpan={4}>Todavía no tienes posiciones.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      </div>
      <section className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>Órdenes y ejecuciones</h2>
          <button
            type="button"
            className={styles.btnSecondary}
            disabled={orders.isFetching}
            onClick={refresh}
          >
            Actualizar
          </button>
        </div>
        <div className={styles.actionsRow}>
          <label className={styles.fieldGroup}>
            Filtrar por símbolo
            <input
              className={styles.input}
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
              {[
                'PENDING',
                'SUBMITTED',
                'BROKER_SIGNED',
                'EXECUTING',
                'CANCELED',
                'REJECTED',
                'EXPIRED',
                'IN_REVIEW',
                'FAILED',
                'HELD',
              ].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
        </div>
        {orders.isPending && <p role="status">Consultando órdenes…</p>}
        {orders.isError && (
          <p role="alert">No se pudieron consultar las órdenes.</p>
        )}
        {orders.data && (
          <ActiveOrdersTable
            orders={orders.data.items}
            onSelect={(id) => setSelected(id)}
          />
        )}
        <div className={styles.actionsRow}>
          <button
            type="button"
            className={styles.btnSecondary}
            disabled={cursors.length === 1 || orders.isFetching}
            onClick={() => setCursors((previous) => previous.slice(0, -1))}
          >
            Anterior
          </button>
          <span>Página {cursors.length}</span>
          <button
            type="button"
            className={styles.btnSecondary}
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
