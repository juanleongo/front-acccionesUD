'use client';

import { formatPortfolioUsd } from '../portfolio-formatters';
import type { PortfolioPositionsData } from '../portfolio-mock';
import styles from '../portfolio.module.css';

export function PortfolioPositionsTab({
  positionsData,
  viewMode,
  totalMarketVal,
  onNavigateToOrder,
}: {
  positionsData: PortfolioPositionsData;
  viewMode: 'table' | 'cards' | 'chart';
  totalMarketVal: number;
  onNavigateToOrder?: (symbol: string) => void;
}) {
  return (
    <div className={styles.panelCard}>
      <div className={styles.panelHeader}>
        <div>
          <h3 className={styles.panelTitle}>
            Tenencias y Valoración por Instrumento
          </h3>
          <p className={styles.panelDesc}>
            Detalle de títulos disponibles, acciones reservadas en órdenes
            abiertas y rendimiento acumulado.
          </p>
        </div>
      </div>

      {viewMode === 'table' && (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Instrumento</th>
                <th>Bolsa</th>
                <th>Cant. Total (Reservada)</th>
                <th>Costo Promedio</th>
                <th>Precio Actual</th>
                <th>Valor Mercado</th>
                <th>Ganancia / Pérdida</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {positionsData.positions.map((pos) => {
                const pnl = Number(pos.unrealized_pnl) || 0;
                const cost = Number(pos.cost_basis) || 1;
                const pct = ((pnl / cost) * 100).toFixed(2);
                return (
                  <tr key={pos.symbol}>
                    <td>
                      <div className={styles.symbolCell}>
                        <span className={styles.symbolTicker}>
                          {pos.symbol}
                        </span>
                        <span className={styles.symbolSector}>
                          {pos.sector ?? 'Renta Variable EE. UU.'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={styles.exchangeBadge}>
                        {pos.exchange}
                      </span>
                    </td>
                    <td className={styles.monoCell}>
                      {pos.qty}{' '}
                      {Number(pos.reserved_qty) > 0
                        ? `(Reservadas: ${pos.reserved_qty})`
                        : ''}
                    </td>
                    <td className={styles.monoCell}>
                      {formatPortfolioUsd(pos.average_cost)}
                    </td>
                    <td className={styles.monoCell}>
                      {formatPortfolioUsd(pos.price)}
                    </td>
                    <td className={styles.monoCell}>
                      {formatPortfolioUsd(pos.market_value)}
                    </td>
                    <td>
                      <span
                        className={
                          pnl >= 0 ? styles.pnlBadgeGain : styles.pnlBadgeLoss
                        }
                      >
                        {pnl >= 0 ? '+' : ''}
                        {formatPortfolioUsd(pnl)} ({pct}%)
                      </span>
                    </td>
                    <td>
                      {onNavigateToOrder && (
                        <button
                          type="button"
                          className={styles.secondaryBtn}
                          onClick={() => onNavigateToOrder(pos.symbol)}
                        >
                          Operar {pos.symbol}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {viewMode === 'cards' && (
        <div className={styles.cardsGrid}>
          {positionsData.positions.map((pos) => {
            const pnl = Number(pos.unrealized_pnl) || 0;
            return (
              <div key={pos.symbol} className={styles.positionCard}>
                <div className={styles.positionCardTop}>
                  <div>
                    <div className={styles.symbolTicker}>{pos.symbol}</div>
                    <div className={styles.symbolSector}>
                      {pos.sector ?? pos.exchange}
                    </div>
                  </div>
                  <span className={styles.exchangeBadge}>{pos.exchange}</span>
                </div>
                <div className={styles.positionCardMetrics}>
                  <div className={styles.metricBox}>
                    <span className={styles.metricBoxLabel}>Cantidad</span>
                    <span className={styles.metricBoxVal}>
                      {pos.qty} títulos
                    </span>
                  </div>
                  <div className={styles.metricBox}>
                    <span className={styles.metricBoxLabel}>Precio Actual</span>
                    <span className={styles.metricBoxVal}>
                      {formatPortfolioUsd(pos.price)}
                    </span>
                  </div>
                  <div className={styles.metricBox}>
                    <span className={styles.metricBoxLabel}>Valor Mercado</span>
                    <span className={styles.metricBoxVal}>
                      {formatPortfolioUsd(pos.market_value)}
                    </span>
                  </div>
                  <div className={styles.metricBox}>
                    <span className={styles.metricBoxLabel}>Rendimiento</span>
                    <span
                      className={
                        pnl >= 0 ? styles.pnlBadgeGain : styles.pnlBadgeLoss
                      }
                    >
                      {pnl >= 0 ? '+' : ''}
                      {formatPortfolioUsd(pnl)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {viewMode === 'chart' && (
        <div className={styles.barsList}>
          {positionsData.positions.map((pos) => {
            const mv = Number(pos.market_value) || 0;
            const weight = totalMarketVal > 0 ? (mv / totalMarketVal) * 100 : 0;
            return (
              <div key={pos.symbol} className={styles.barRow}>
                <div className={styles.barRowHeader}>
                  <span>
                    <strong>{pos.symbol}</strong> · {pos.sector ?? pos.exchange}
                  </span>
                  <span>
                    {formatPortfolioUsd(mv)} ({weight.toFixed(1)}%)
                  </span>
                </div>
                <div className={styles.barTrack}>
                  <div
                    className={styles.barFill}
                    style={{ width: `${Math.min(100, weight)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
