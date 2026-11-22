'use client';

import { formatPercent } from '@/lib/formatters';
import { useLocale } from '@/lib/i18n';
import { formatPortfolioUsd, formatSectorLabel } from '../portfolio-formatters';
import type { PortfolioPositionsData } from '../portfolio-mock';
import { AllocationBars } from './AllocationBars';
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
  const { locale, tx } = useLocale();
  return (
    <div className={styles.panelCard}>
      <div className={styles.panelHeader}>
        <div>
          <h3 className={styles.panelTitle}>
            {tx(
              'Tenencias y Valoración por Instrumento',
              'Holdings & Asset Valuation',
            )}
          </h3>
          <p className={styles.panelDesc}>
            {tx(
              'Detalle de títulos disponibles, acciones reservadas en órdenes abiertas y rendimiento acumulado.',
              'Available shares, shares held in open orders, and cumulative return.',
            )}
          </p>
        </div>
      </div>

      {viewMode === 'table' && (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{tx('Instrumento', 'Instrument')}</th>
                <th>{tx('Bolsa', 'Exchange')}</th>
                <th>{tx('Cant. Total (Reservada)', 'Total Qty (Reserved)')}</th>
                <th>{tx('Costo Promedio', 'Avg. Cost')}</th>
                <th>{tx('Precio Actual', 'Current Price')}</th>
                <th>{tx('Valor Mercado', 'Market Value')}</th>
                <th>{tx('Ganancia / Pérdida', 'Gain / Loss')}</th>
                <th>{tx('Acción', 'Action')}</th>
              </tr>
            </thead>
            <tbody>
              {positionsData.positions.map((pos) => {
                const pnl = Number(pos.unrealized_pnl) || 0;
                const cost = Number(pos.cost_basis) || 1;
                const ratio = pnl / cost;
                return (
                  <tr key={pos.symbol}>
                    <td>
                      <div className={styles.symbolCell}>
                        <span className={styles.symbolTicker}>
                          {pos.symbol}
                        </span>
                        <span className={styles.symbolSector}>
                          {formatSectorLabel(pos.sector, locale)}
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
                        ? `(${tx('Reservadas', 'Reserved')}: ${pos.reserved_qty})`
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
                        {formatPortfolioUsd(pnl)} (
                        {formatPercent(ratio, locale)})
                      </span>
                    </td>
                    <td>
                      {onNavigateToOrder && (
                        <button
                          type="button"
                          className={styles.secondaryBtn}
                          onClick={() => onNavigateToOrder(pos.symbol)}
                        >
                          {tx('Operar', 'Trade')} {pos.symbol}
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
                      {pos.sector
                        ? formatSectorLabel(pos.sector, locale)
                        : pos.exchange}
                    </div>
                  </div>
                  <span className={styles.exchangeBadge}>{pos.exchange}</span>
                </div>
                <div className={styles.positionCardMetrics}>
                  <div className={styles.metricBox}>
                    <span className={styles.metricBoxLabel}>
                      {tx('Cantidad', 'Quantity')}
                    </span>
                    <span className={styles.metricBoxVal}>
                      {pos.qty} {tx('títulos', 'shares')}
                    </span>
                  </div>
                  <div className={styles.metricBox}>
                    <span className={styles.metricBoxLabel}>
                      {tx('Precio Actual', 'Current Price')}
                    </span>
                    <span className={styles.metricBoxVal}>
                      {formatPortfolioUsd(pos.price)}
                    </span>
                  </div>
                  <div className={styles.metricBox}>
                    <span className={styles.metricBoxLabel}>
                      {tx('Valor Mercado', 'Market Value')}
                    </span>
                    <span className={styles.metricBoxVal}>
                      {formatPortfolioUsd(pos.market_value)}
                    </span>
                  </div>
                  <div className={styles.metricBox}>
                    <span className={styles.metricBoxLabel}>
                      {tx('Rendimiento', 'Return')}
                    </span>
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
                {onNavigateToOrder && (
                  <button
                    type="button"
                    className={styles.secondaryBtn}
                    onClick={() => onNavigateToOrder(pos.symbol)}
                  >
                    {tx('Operar', 'Trade')} {pos.symbol}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {viewMode === 'chart' && (
        <AllocationBars
          items={positionsData.positions.map((pos) => {
            const mv = Number(pos.market_value) || 0;
            const weight = totalMarketVal > 0 ? (mv / totalMarketVal) * 100 : 0;
            return {
              key: pos.symbol,
              label: (
                <>
                  <strong>{pos.symbol}</strong> ·{' '}
                  {pos.sector
                    ? formatSectorLabel(pos.sector, locale)
                    : pos.exchange}
                </>
              ),
              valueText: `${formatPortfolioUsd(mv)} (${weight.toFixed(1)}%)`,
              percentage: weight,
            };
          })}
        />
      )}
    </div>
  );
}
