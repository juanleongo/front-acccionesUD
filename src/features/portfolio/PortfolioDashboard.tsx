'use client';

import { useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from './portfolio-api';
import { portfolioErrorMessage } from './portfolio-errors';
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
  const client = useQueryClient();
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  const [viewMode, setViewMode] = useState<'table' | 'cards' | 'chart'>(
    'table',
  );
  const [symbolFilter, setSymbolFilter] = useState('');
  const [periodFrom, setPeriodFrom] = useState(today.slice(0, 7) + '-01');
  const [periodTo, setPeriodTo] = useState(today);
  const validPeriod = Boolean(periodFrom && periodTo && periodFrom <= periodTo);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const generation = useRef(false);
  const [selectedReportId, setSelectedReportId] = useState('');
  const [executionCursors, setExecutionCursors] = useState(['']);
  const [reportCursors, setReportCursors] = useState(['']);
  const positionQuery = useQuery({
    queryKey: ['portfolio', 'positions'],
    queryFn: ({ signal }) => api.fetchPortfolioPositions(signal),
    retry: false,
    refetchInterval: 30000,
  });
  const riskQuery = useQuery({
    queryKey: ['portfolio', 'risk'],
    queryFn: ({ signal }) => api.fetchPortfolioRiskProfile(signal),
    retry: false,
    enabled: activeTab === 'risk',
  });
  const statisticsQuery = useQuery({
    queryKey: ['portfolio', 'statistics', periodFrom, periodTo],
    queryFn: ({ signal }) =>
      api.fetchPortfolioStatistics(periodFrom, periodTo, signal),
    enabled: activeTab === 'statistics' && validPeriod,
    retry: false,
  });
  const executionsQuery = useQuery({
    queryKey: [
      'portfolio',
      'executions',
      periodFrom,
      periodTo,
      symbolFilter,
      executionCursors.at(-1),
    ],
    queryFn: ({ signal }) =>
      api.fetchPortfolioExecutions(
        periodFrom,
        periodTo,
        symbolFilter,
        executionCursors.at(-1) ?? '',
        signal,
      ),
    enabled: activeTab === 'executions' && validPeriod,
    retry: false,
  });
  const reportsQuery = useQuery({
    queryKey: ['portfolio', 'reports', reportCursors.at(-1)],
    queryFn: ({ signal }) =>
      api.fetchPortfolioReports(reportCursors.at(-1) ?? '', signal),
    enabled: activeTab === 'reports',
    retry: false,
  });
  const detailQuery = useQuery({
    queryKey: ['portfolio', 'report', selectedReportId],
    queryFn: ({ signal }) => api.fetchPortfolioReport(selectedReportId, signal),
    enabled: Boolean(selectedReportId) && activeTab === 'reports',
    retry: false,
  });
  const positionsData = positionQuery.data;
  const riskProfile = riskQuery.isError ? undefined : riskQuery.data;
  const statistics = statisticsQuery.data;
  const executions = executionsQuery.data?.items ?? [];
  const reports = reportsQuery.data?.items ?? [];
  const selectedReport = detailQuery.data ?? null;
  function changeFrom(value: string) {
    setPeriodFrom(value);
    setExecutionCursors(['']);
  }
  function changeTo(value: string) {
    setPeriodTo(value);
    setExecutionCursors(['']);
  }
  async function handleGenerateReport() {
    if (generation.current || !validPeriod) return;
    generation.current = true;
    setGenerating(true);
    setStatusMessage(null);
    try {
      const result = await api.createPortfolioReport(periodFrom, periodTo);
      setSelectedReportId(result.id);
      client.setQueryData(['portfolio', 'report', result.id], result);
      setReportCursors(['']);
      await client.invalidateQueries({ queryKey: ['portfolio', 'reports'] });
      setStatusMessage('Reporte generado correctamente.');
    } catch (cause) {
      setStatusMessage(
        cause instanceof Error
          ? cause.message
          : 'No se pudo generar el reporte.',
      );
    } finally {
      generation.current = false;
      setGenerating(false);
    }
  }
  if (!positionsData)
    return (
      <div className={styles.panelCard}>
        <h2 className={styles.headerTitle}>Mi portafolio</h2>
        {positionQuery.isPending ? (
          <p role="status">Consultando tus posiciones…</p>
        ) : (
          <>
            <p role="alert">{portfolioErrorMessage(positionQuery.error)}</p>
            <button
              type="button"
              className={styles.tabBtn}
              onClick={() => {
                void positionQuery.refetch();
              }}
            >
              Reintentar
            </button>
          </>
        )}
      </div>
    );
  const activeQuery =
    activeTab === 'statistics'
      ? statisticsQuery
      : activeTab === 'risk'
        ? riskQuery
        : activeTab === 'executions'
          ? executionsQuery
          : activeTab === 'reports'
            ? reportsQuery
            : positionQuery;
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
            {new Date(positionsData.positions_as_of).toLocaleString('es-CO')}
          </span>
        </div>
      </div>

      <button
        type="button"
        className={styles.tabBtn}
        disabled={positionQuery.isFetching}
        onClick={() => {
          void client.invalidateQueries({ queryKey: ['portfolio'] });
        }}
      >
        Actualizar portafolio
      </button>
      {activeQuery.isFetching && <p role="status">Actualizando datos…</p>}
      {activeQuery.isError && (
        <p role="alert">
          No se pudo actualizar esta sección.{' '}
          {activeQuery.data
            ? 'Se conserva la última información recibida.'
            : ''}{' '}
          <button
            type="button"
            onClick={() => {
              void activeQuery.refetch();
            }}
          >
            Reintentar
          </button>
        </p>
      )}
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
          <span className={styles.kpiLabel}>Clasificación de Riesgo</span>
          <span className={styles.kpiValue}>
            {riskProfile
              ? formatRiskClassLabel(riskProfile.classification)
              : 'Ver perfil'}
          </span>
          <span className={styles.kpiHint}>
            Índice global: {riskProfile?.risk_score ?? 'N/A'} ·{' '}
            {riskProfile?.metrics.execution_count ?? '—'} operaciones
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

      {(activeTab === 'executions' ||
        (activeTab === 'statistics' && !statistics) ||
        (activeTab === 'reports' && !validPeriod)) && (
        <div className={styles.filterRow}>
          <label>
            Desde{' '}
            <input
              type="date"
              className={styles.filterInput}
              value={periodFrom}
              onChange={(e) => changeFrom(e.target.value)}
            />
          </label>
          <label>
            Hasta{' '}
            <input
              type="date"
              className={styles.filterInput}
              value={periodTo}
              onChange={(e) => changeTo(e.target.value)}
            />
          </label>
          {!validPeriod && (
            <p role="alert">
              Selecciona un rango válido: Desde debe ser anterior o igual a
              Hasta.
            </p>
          )}
        </div>
      )}
      {activeTab === 'positions' &&
        positionsData.positions.some(
          (position) => position.reconciliation_mismatch,
        ) && (
          <p role="status">
            Hay diferencias de conciliación en algunas posiciones. Revisa los
            datos antes de operar.
          </p>
        )}
      {activeTab === 'positions' && positionsData.positions.length === 0 && (
        <p>
          No tienes posiciones abiertas. Las compras aparecerán aquí cuando se
          ejecuten.
        </p>
      )}
      {activeTab === 'positions' && (
        <PortfolioPositionsTab
          positionsData={positionsData}
          viewMode={viewMode}
          totalMarketVal={totalMarketVal}
          {...(onNavigateToOrder ? { onNavigateToOrder } : {})}
        />
      )}

      {activeTab === 'statistics' && statistics && validPeriod && (
        <PortfolioStatisticsTab
          statistics={statistics}
          periodFrom={periodFrom}
          periodTo={periodTo}
          onPeriodFromChange={changeFrom}
          onPeriodToChange={changeTo}
        />
      )}

      {activeTab === 'risk' && riskProfile && (
        <PortfolioRiskTab riskProfile={riskProfile} />
      )}

      {activeTab === 'executions' && (
        <PortfolioExecutionsTab
          executions={filteredExecutions}
          symbolFilter={symbolFilter}
          onSymbolFilterChange={(value) => {
            setSymbolFilter(value.trim().toUpperCase());
            setExecutionCursors(['']);
          }}
        />
      )}

      {activeTab === 'reports' && (
        <fieldset
          disabled={generating || !validPeriod}
          style={{ border: 0, padding: 0, minWidth: 0 }}
        >
          <PortfolioReportsTab
            reports={reports}
            selectedReport={selectedReport}
            periodFrom={periodFrom}
            periodTo={periodTo}
            onPeriodFromChange={changeFrom}
            onPeriodToChange={changeTo}
            onGenerateReport={() => {
              void handleGenerateReport();
            }}
            onSelectReport={(report) => setSelectedReportId(report.id)}
          />
        </fieldset>
      )}
      {activeTab === 'reports' && detailQuery.isFetching && (
        <p role="status">Consultando reporte…</p>
      )}
      {activeTab === 'reports' && detailQuery.isError && (
        <p role="alert">No se pudo consultar el reporte seleccionado.</p>
      )}
      {['executions', 'reports'].includes(activeTab) && (
        <div className={styles.filterRow}>
          <button
            type="button"
            className={styles.tabBtn}
            disabled={
              activeQuery.isFetching ||
              (activeTab === 'executions' ? executionCursors : reportCursors)
                .length === 1
            }
            onClick={() =>
              activeTab === 'executions'
                ? setExecutionCursors((previous) => previous.slice(0, -1))
                : setReportCursors((previous) => previous.slice(0, -1))
            }
          >
            Anterior
          </button>
          <span>
            Página{' '}
            {
              (activeTab === 'executions' ? executionCursors : reportCursors)
                .length
            }{' '}
            · 10 registros por página
          </span>
          <button
            type="button"
            className={styles.tabBtn}
            disabled={
              activeQuery.isFetching ||
              !(activeTab === 'executions'
                ? executionsQuery.data?.next_cursor
                : reportsQuery.data?.next_cursor)
            }
            onClick={() => {
              const next =
                activeTab === 'executions'
                  ? executionsQuery.data?.next_cursor
                  : reportsQuery.data?.next_cursor;
              if (next) {
                if (activeTab === 'executions')
                  setExecutionCursors((previous) => [...previous, next]);
                else setReportCursors((previous) => [...previous, next]);
              }
            }}
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}
