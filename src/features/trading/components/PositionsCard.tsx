'use client';

import { LoadingState } from '@/components/ui/LoadingState';
import styles from '../trading.module.css';

export interface PositionRow {
  symbol: string;
  qty: string;
  reserved_qty: string;
  price: string;
}

export function PositionsCard({
  positions,
  positionsAsOf,
  isPending,
  isError,
}: {
  positions: PositionRow[];
  positionsAsOf: string | undefined;
  isPending: boolean;
  isError: boolean;
}) {
  return (
    <section className={styles.card}>
      <div className={styles.cardHeader}>
        <div>
          <h2 className={styles.cardTitle}>Tus posiciones</h2>
          <p className={styles.cardSubtitle}>
            Acciones disponibles para venta, descontando las reservas activas.
          </p>
        </div>
        {positionsAsOf && (
          <span className={styles.badgeTimestamp}>
            Actualizado: {new Date(positionsAsOf).toLocaleString('es-CO')}
          </span>
        )}
      </div>

      {isPending && (
        <LoadingState mode="compact" label="Cargando posiciones…" />
      )}

      {isError && (
        <p role="alert" className={styles.alertError}>
          No se pudieron consultar las posiciones.
        </p>
      )}

      {!isPending && !isError && (
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
              {positions.map((position) => (
                <tr key={position.symbol}>
                  <td>
                    <strong>{position.symbol}</strong>
                  </td>
                  <td className={styles.tabularNum}>{position.qty}</td>
                  <td className={styles.tabularNum}>{position.reserved_qty}</td>
                  <td className={styles.tabularNum}>
                    <strong>
                      {Math.max(
                        0,
                        Number(position.qty) - Number(position.reserved_qty),
                      )}
                    </strong>
                  </td>
                </tr>
              ))}
              {positions.length === 0 && (
                <tr>
                  <td colSpan={4} className={styles.emptyCell}>
                    Todavía no tienes posiciones registradas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
