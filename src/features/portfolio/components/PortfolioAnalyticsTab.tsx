'use client';

import { useLocale } from '@/lib/i18n';
import {
  formatPortfolioUsd,
  formatRiskClassLabel,
  formatSectorLabel,
} from '../portfolio-formatters';
import type {
  PortfolioRiskProfile,
  PortfolioStatistics,
} from '../portfolio-mock';
import { AllocationBars } from './AllocationBars';
import styles from '../portfolio.module.css';

export function PortfolioStatisticsTab({
  statistics,
}: {
  statistics: PortfolioStatistics;
}) {
  const { locale, tx } = useLocale();
  return (
    <div className={styles.panelCard}>
      <div className={styles.panelHeader}>
        <div>
          <h3 className={styles.panelTitle}>
            {tx(
              'Estadísticas de Volumen y Participación por Mercado y Sector',
              'Volume & Allocation Statistics by Market and Sector',
            )}
          </h3>
          <p className={styles.panelDesc}>
            {tx('Operaciones totales:', 'Total executions:')}{' '}
            {statistics.execution_count} ({tx('Compras:', 'Buys:')}{' '}
            {statistics.buy_count} · {tx('Ventas:', 'Sells:')}{' '}
            {statistics.sell_count}) ·{' '}
            {tx('Volumen negociado:', 'Volume traded:')}{' '}
            {formatPortfolioUsd(statistics.volume)}
          </p>
        </div>
        <span className={styles.sourceBadge}>
          {tx('Resumen del período consultado', 'Selected period summary')}
        </span>
      </div>

      <div className={styles.twoColGrid}>
        <div>
          <h4 className={styles.panelTitle}>
            {tx('Distribución por Sector', 'Sector Allocation')}
          </h4>
          <AllocationBars
            spaced
            items={statistics.by_sector.map((item) => ({
              key: item.key,
              label: formatSectorLabel(item.key, locale),
              valueText: `${formatPortfolioUsd(item.volume)} (${item.percentage}%)`,
              percentage: Number(item.percentage) || 0,
            }))}
          />
        </div>

        <div>
          <h4 className={styles.panelTitle}>
            {tx(
              'Distribución por Bolsa (NYSE / NASDAQ)',
              'Exchange Allocation (NYSE / NASDAQ)',
            )}
          </h4>
          <AllocationBars
            spaced
            items={statistics.by_market.map((item) => ({
              key: item.key,
              label: item.key,
              valueText: `${formatPortfolioUsd(item.volume)} (${item.percentage}%)`,
              percentage: Number(item.percentage) || 0,
            }))}
          />
        </div>
      </div>
    </div>
  );
}

export function PortfolioRiskTab({
  riskProfile,
}: {
  riskProfile: PortfolioRiskProfile;
}) {
  const { locale, tx } = useLocale();
  return (
    <div className={styles.panelCard}>
      <div className={styles.panelHeader}>
        <div>
          <h3 className={styles.panelTitle}>
            {tx(
              `Análisis de Riesgo y Diversificación (Últimos ${riskProfile.window_days} días)`,
              `Risk & Diversification Analysis (Last ${riskProfile.window_days} days)`,
            )}
          </h3>
          <p className={styles.panelDesc}>
            {tx(
              'Evaluación integral de frecuencia operativa, concentración por activo, exposición bursátil y tamaño promedio de orden.',
              'Comprehensive assessment of trading frequency, asset concentration, equity exposure, and average order size.',
            )}
          </p>
        </div>
        <span
          className={`${styles.riskBadge} ${
            riskProfile.classification === 'conservative'
              ? styles.riskConservative
              : riskProfile.classification === 'aggressive'
                ? styles.riskAggressive
                : styles.riskModerate
          }`}
        >
          {tx('Perfil:', 'Profile:')}{' '}
          {formatRiskClassLabel(riskProfile.classification, locale)} (
          {riskProfile.risk_score ?? '0.00'})
        </span>
      </div>

      <div className={styles.factorsGrid}>
        <div className={styles.factorCard}>
          <span className={styles.factorName}>
            {tx('Frecuencia Operativa (F)', 'Trading Frequency (F)')}
          </span>
          <span className={styles.factorScore}>{riskProfile.f}</span>
          <span className={styles.kpiHint}>
            {riskProfile.metrics.executions_per_week}{' '}
            {tx('ejecuciones por semana', 'trades per week')}
          </span>
        </div>
        <div className={styles.factorCard}>
          <span className={styles.factorName}>
            {tx('Concentración de Activos (C)', 'Asset Concentration (C)')}
          </span>
          <span className={styles.factorScore}>{riskProfile.c}</span>
          <span className={styles.kpiHint}>
            {riskProfile.metrics.instruments.length}{' '}
            {tx('instrumentos en cartera', 'instruments in portfolio')}
          </span>
        </div>
        <div className={styles.factorCard}>
          <span className={styles.factorName}>
            {tx('Exposición sobre Patrimonio (E)', 'Equity Exposure (E)')}
          </span>
          <span className={styles.factorScore}>{riskProfile.e}</span>
          <span className={styles.kpiHint}>
            {tx('Mercados:', 'Markets:')}{' '}
            {riskProfile.metrics.markets.join(', ')}
          </span>
        </div>
        <div className={styles.factorCard}>
          <span className={styles.factorName}>
            {tx('Tamaño Relativo de Orden (T)', 'Relative Order Size (T)')}
          </span>
          <span className={styles.factorScore}>{riskProfile.t}</span>
          <span className={styles.kpiHint}>
            {tx('Volumen acumulado:', 'Cumulative volume:')}{' '}
            {formatPortfolioUsd(riskProfile.metrics.volume)}
          </span>
        </div>
      </div>
    </div>
  );
}
