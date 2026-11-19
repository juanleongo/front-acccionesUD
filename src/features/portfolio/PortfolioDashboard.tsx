'use client';

import { useState } from 'react';
import {
  PortfolioRiskTab,
  PortfolioStatisticsTab,
} from './components/PortfolioAnalyticsTab';
import { PortfolioPositionsTab } from './components/PortfolioPositionsTab';
import {
  PortfolioExecutionsTab,
  PortfolioReportsTab,
} from './components/PortfolioReportsTab';
import {
  formatPortfolioUsd,
  formatRiskClassLabel,
} from './portfolio-formatters';
import {
  INITIAL_PORTFOLIO_EXECUTIONS,
  INITIAL_PORTFOLIO_POSITIONS,
  INITIAL_PORTFOLIO_REPORTS,
  INITIAL_PORTFOLIO_RISK,
  INITIAL_PORTFOLIO_STATISTICS,
  type PortfolioExecution,
  type PortfolioPositionsData,
  type PortfolioReportSummary,
  type PortfolioRiskProfile,
  type PortfolioStatistics,
} from './portfolio-mock';
import styles from './portfolio.module.css';

export interface PortfolioDashboardProps {
  onNavigateToOrder?: (symbol: string) => void;
}

type PortfolioTab =
  'positions' | 'statistics' | 'risk' | 'executions' | 'reports';

export function PortfolioDashboard({
  onNavigateToOrder,
}: PortfolioDashboardProps) {
  const [activeTab, setActiveTab] = useState<PortfolioTab>('positions');
  const [positionsData] = useState<PortfolioPositionsData>(
    INITIAL_PORTFOLIO_POSITIONS,
  );
  const [viewMode, setViewMode] = useState<'table' | 'cards' | 'chart'>(
    'table',
  );
  const [executions] = useState<PortfolioExecution[]>(
    INITIAL_PORTFOLIO_EXECUTIONS,
  );
  const [statistics] = useState<PortfolioStatistics>(
    INITIAL_PORTFOLIO_STATISTICS,
  );
  const [riskProfile] = useState<PortfolioRiskProfile>(INITIAL_PORTFOLIO_RISK);
  const [reports, setReports] = useState<PortfolioReportSummary[]>(
    INITIAL_PORTFOLIO_REPORTS,
  );
  const [selectedReport, setSelectedReport] =
    useState<PortfolioReportSummary | null>(
      INITIAL_PORTFOLIO_REPORTS[0] ?? null,
    );

  const [symbolFilter, setSymbolFilter] = useState('');
  const [periodFrom, setPeriodFrom] = useState('2026-10-01');
  const [periodTo, setPeriodTo] = useState('2026-11-18');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleGenerateReport = () => {
    const mockReport: PortfolioReportSummary = {
      id: `rep-sim-${Date.now().toString(36)}`,
      owner_id: 'inv-local',
      owner_role: 'investor',
      type: 'on_demand',
      period: { from: periodFrom, to: periodTo },
      positions_as_of: new Date().toISOString(),
      generated_at: new Date().toISOString(),
      notified_at: new Date().toISOString(),
      content: {
        market_value: positionsData.totals.market_value,
        cost_basis: positionsData.totals.cost_basis,
        unrealized_pnl: positionsData.totals.unrealized_pnl,
        positions_count: positionsData.positions.length,
        execution_count: executions.length,
      },
    };
    setReports((prev) => [mockReport, ...prev]);
    setSelectedReport(mockReport);
    setStatusMessage(
      `Reporte consolidado generado para el período ${periodFrom} al ${periodTo}.`,
    );
  };

  const totalMarketVal = Number(positionsData.totals.market_value) || 0;
  const totalCostBasis = Number(positionsData.totals.cost_basis) || 0;
  const totalUnrealizedPnl = Number(positionsData.totals.unrealized_pnl) || 0;
  const pnlPct =
    totalCostBasis > 0
      ? ((totalUnrealizedPnl / totalCostBasis) * 100).toFixed(2)
      : '0.00';

  const filteredExecutions = symbolFilter.trim()
    ? executions.filter((ex) =>
        ex.symbol.toLowerCase().includes(symbolFilter.trim().toLowerCase()),
      )
    : executions;

  return (
    <div className={styles.container}>
      <div className={styles.headerBanner}>
        <div className={styles.headerTitleGroup}>
          <h2 className={styles.headerTitle}>
            Portafolio de Inversión y Rendimiento
          </h2>
          <p className={styles.headerSubtitle}>
            Consulta la valoración de tus posiciones en NYSE y NASDAQ, la
            distribución por sector y tu perfil de riesgo en dólares (USD).
          </p>
        </div>
        <div className={styles.headerBadges}>
          <span className={`${styles.sourceBadge} ${styles.sourceBadgeLive}`}>
            Valoración en USD · NYSE &amp; NASDAQ
          </span>
          <span className={styles.sourceBadge}>
            Actualizado:{' '}
            {new Date(positionsData.positions_as_of).toLocaleDateString(
              'es-CO',
            )}
          </span>
        </div>
      </div>

      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Valor de Mercado en Acciones</span>
          <span className={styles.kpiValue}>
            {formatPortfolioUsd(totalMarketVal)}
          </span>
          <span className={styles.kpiHint}>
            {positionsData.positions.length} posiciones abiertas en EE. UU.
          </span>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Costo Base Invertido</span>
          <span className={styles.kpiValue}>
            {formatPortfolioUsd(totalCostBasis)}
          </span>
          <span className={styles.kpiHint}>
            Precio promedio ponderado de adquisición
          </span>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>
            Rendimiento Latente (Ganancia / Pérdida)
          </span>
          <span
            className={`${styles.kpiValue} ${totalUnrealizedPnl >= 0 ? styles.kpiValueGain : styles.kpiValueLoss}`}
          >
            {totalUnrealizedPnl >= 0 ? '+' : ''}
            {formatPortfolioUsd(totalUnrealizedPnl)} ({pnlPct}%)
          </span>
          <span className={styles.kpiHint}>
            Variación frente a la cotización actual de mercado
          </span>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Clasificación de Riesgo (90d)</span>
          <span className={styles.kpiValue}>
            {formatRiskClassLabel(riskProfile.classification)}
          </span>
          <span className={styles.kpiHint}>
            Índice global: {riskProfile.risk_score ?? 'N/A'} ·{' '}
            {riskProfile.metrics.execution_count} operaciones
          </span>
        </div>
      </div>

      {statusMessage && (
        <div className={styles.statusToast} role="status">
          {statusMessage}
        </div>
      )}

      <div className={styles.tabsNav}>
        <div
          className={styles.tabButtons}
          role="tablist"
          aria-label="Secciones de portafolio"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'positions'}
            className={`${styles.tabBtn} ${activeTab === 'positions' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('positions')}
          >
            Posiciones Activas ({positionsData.positions.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'statistics'}
            className={`${styles.tabBtn} ${activeTab === 'statistics' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('statistics')}
          >
            Estadísticas y Distribución
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'risk'}
            className={`${styles.tabBtn} ${activeTab === 'risk' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('risk')}
          >
            Perfil de Riesgo
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'executions'}
            className={`${styles.tabBtn} ${activeTab === 'executions' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('executions')}
          >
            Historial de Ejecuciones ({executions.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'reports'}
            className={`${styles.tabBtn} ${activeTab === 'reports' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('reports')}
          >
            Reportes Consolidados ({reports.length})
          </button>
        </div>

        {activeTab === 'positions' && (
          <div className={styles.viewSwitcher}>
            <button
              type="button"
              className={`${styles.viewBtn} ${viewMode === 'table' ? styles.viewBtnActive : ''}`}
              onClick={() => setViewMode('table')}
            >
              Tabla
            </button>
            <button
              type="button"
              className={`${styles.viewBtn} ${viewMode === 'cards' ? styles.viewBtnActive : ''}`}
              onClick={() => setViewMode('cards')}
            >
              Tarjetas
            </button>
            <button
              type="button"
              className={`${styles.viewBtn} ${viewMode === 'chart' ? styles.viewBtnActive : ''}`}
              onClick={() => setViewMode('chart')}
            >
              Participación %
            </button>
          </div>
        )}
      </div>

      {activeTab === 'positions' && (
        <PortfolioPositionsTab
          positionsData={positionsData}
          viewMode={viewMode}
          totalMarketVal={totalMarketVal}
          {...(onNavigateToOrder ? { onNavigateToOrder } : {})}
        />
      )}

      {activeTab === 'statistics' && (
        <PortfolioStatisticsTab
          statistics={statistics}
          periodFrom={periodFrom}
          periodTo={periodTo}
          onPeriodFromChange={setPeriodFrom}
          onPeriodToChange={setPeriodTo}
        />
      )}

      {activeTab === 'risk' && <PortfolioRiskTab riskProfile={riskProfile} />}

      {activeTab === 'executions' && (
        <PortfolioExecutionsTab
          executions={filteredExecutions}
          symbolFilter={symbolFilter}
          onSymbolFilterChange={setSymbolFilter}
        />
      )}

      {activeTab === 'reports' && (
        <PortfolioReportsTab
          reports={reports}
          selectedReport={selectedReport}
          positionsData={positionsData}
          periodFrom={periodFrom}
          periodTo={periodTo}
          onPeriodFromChange={setPeriodFrom}
          onPeriodToChange={setPeriodTo}
          onGenerateReport={handleGenerateReport}
          onSelectReport={setSelectedReport}
        />
      )}
    </div>
  );
}
