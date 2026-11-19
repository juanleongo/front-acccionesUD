'use client';

import {
  formatPortfolioUsd,
  formatRiskClassLabel,
} from '../portfolio-formatters';
import type {
  PortfolioRiskProfile,
  PortfolioStatistics,
} from '../portfolio-mock';
import styles from '../portfolio.module.css';

export function PortfolioStatisticsTab({
  statistics,
  periodFrom,
  periodTo,
  onPeriodFromChange,
  onPeriodToChange,
}: {
  statistics: PortfolioStatistics;
  periodFrom: string;
  periodTo: string;
  onPeriodFromChange: (val: string) => void;
  onPeriodToChange: (val: string) => void;
}) {
  return (
    <div className={styles.panelCard}>
      <div className={styles.panelHeader}>
        <div>
          <h3 className={styles.panelTitle}>
            Estadísticas de Volumen y Participación por Mercado y Sector
          </h3>
          <p className={styles.panelDesc}>
            Operaciones totales: {statistics.execution_count} (Compras:{' '}
            {statistics.buy_count} · Ventas: {statistics.sell_count}) · Volumen
            negociado: {formatPortfolioUsd(statistics.volume)}
          </p>
        </div>
        <div className={styles.filterRow}>
          <input
            type="date"
            className={styles.filterInput}
            value={periodFrom}
            onChange={(e) => onPeriodFromChange(e.target.value)}
            aria-label="Fecha desde"
          />
          <input
            type="date"
            className={styles.filterInput}
            value={periodTo}
            onChange={(e) => onPeriodToChange(e.target.value)}
            aria-label="Fecha hasta"
          />
        </div>
      </div>

      <div className={styles.twoColGrid}>
        <div>
          <h4 className={styles.panelTitle}>Distribución por Sector</h4>
          <div className={`${styles.barsList} ${styles.barsListSpaced}`}>
            {statistics.by_sector.map((item) => (
              <div key={item.key} className={styles.barRow}>
                <div className={styles.barRowHeader}>
                  <span>{item.key}</span>
                  <span>
                    {formatPortfolioUsd(item.volume)} ({item.percentage}%)
                  </span>
                </div>
                <div className={styles.barTrack}>
                  <div
                    className={styles.barFill}
                    style={{
                      width: `${Math.min(100, Number(item.percentage) || 0)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className={styles.panelTitle}>
            Distribución por Bolsa (NYSE / NASDAQ)
          </h4>
          <div className={`${styles.barsList} ${styles.barsListSpaced}`}>
            {statistics.by_market.map((item) => (
              <div key={item.key} className={styles.barRow}>
                <div className={styles.barRowHeader}>
                  <span>{item.key}</span>
                  <span>
                    {formatPortfolioUsd(item.volume)} ({item.percentage}%)
                  </span>
                </div>
                <div className={styles.barTrack}>
                  <div
                    className={styles.barFill}
                    style={{
                      width: `${Math.min(100, Number(item.percentage) || 0)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
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
  return (
    <div className={styles.panelCard}>
      <div className={styles.panelHeader}>
        <div>
          <h3 className={styles.panelTitle}>
            Análisis de Riesgo y Diversificación (Últimos{' '}
            {riskProfile.window_days} días)
          </h3>
          <p className={styles.panelDesc}>
            Evaluación integral de frecuencia operativa, concentración por
            activo, exposición bursátil y tamaño promedio de orden.
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
          Perfil: {formatRiskClassLabel(riskProfile.classification)} (
          {riskProfile.risk_score ?? '0.00'})
        </span>
      </div>

      <div className={styles.factorsGrid}>
        <div className={styles.factorCard}>
          <span className={styles.factorName}>Frecuencia Operativa</span>
          <span className={styles.factorScore}>{riskProfile.f}</span>
          <span className={styles.kpiHint}>
            {riskProfile.metrics.executions_per_week} ejecuciones por semana
          </span>
        </div>
        <div className={styles.factorCard}>
          <span className={styles.factorName}>Concentración de Activos</span>
          <span className={styles.factorScore}>{riskProfile.c}</span>
          <span className={styles.kpiHint}>
            {riskProfile.metrics.instruments.length} instrumentos en cartera
          </span>
        </div>
        <div className={styles.factorCard}>
          <span className={styles.factorName}>Exposición sobre Patrimonio</span>
          <span className={styles.factorScore}>{riskProfile.e}</span>
          <span className={styles.kpiHint}>
            Mercados: {riskProfile.metrics.markets.join(', ')}
          </span>
        </div>
        <div className={styles.factorCard}>
          <span className={styles.factorName}>Tamaño Relativo de Orden</span>
          <span className={styles.factorScore}>{riskProfile.t}</span>
          <span className={styles.kpiHint}>
            Volumen acumulado: {formatPortfolioUsd(riskProfile.metrics.volume)}
          </span>
        </div>
      </div>
    </div>
  );
}
