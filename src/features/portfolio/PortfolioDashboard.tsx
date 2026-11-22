'use client';

import { useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from './portfolio-api';
import { portfolioErrorMessage } from './portfolio-errors';
import { formatMarketDateTime, formatPercent } from '@/lib/formatters';
import { Icon } from '@/components/ui/Icon';
import { PortfolioDateFilters } from './components/PortfolioDateFilters';
import { LoadingState } from '@/components/ui/LoadingState';
import { useLocale } from '@/lib/i18n';
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
  const { locale, tx } = useLocale();
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
  const [reportError, setReportError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const generation = useRef(false);
  const [selectedReportId, setSelectedReportId] = useState('');
  const [executionCursors, setExecutionCursors] = useState(['']);
  const [reportCursors, setReportCursors] = useState(['']);
  // Poll live sections silently, including while the tab is in the background.
  // Initial loads still have a loader; cached snapshots remain visible on refresh.
  const refreshPolicy = {
    refetchInterval: 30000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  } as const;
  const positionQuery = useQuery({
    ...refreshPolicy,
    queryKey: ['portfolio', 'positions'],
    queryFn: ({ signal }) => api.fetchPortfolioPositions(signal),
    retry: false,
  });
  const riskQuery = useQuery({
    ...refreshPolicy,
    queryKey: ['portfolio', 'risk'],
    queryFn: ({ signal }) => api.fetchPortfolioRiskProfile(signal),
    retry: false,
    enabled: activeTab === 'risk',
  });
  const statisticsQuery = useQuery({
    ...refreshPolicy,
    queryKey: ['portfolio', 'statistics', periodFrom, periodTo],
    queryFn: ({ signal }) =>
      api.fetchPortfolioStatistics(periodFrom, periodTo, signal),
    enabled: activeTab === 'statistics' && validPeriod,
    retry: false,
  });
  const executionsQuery = useQuery({
    ...refreshPolicy,
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
    ...refreshPolicy,
    queryKey: ['portfolio', 'reports', reportCursors.at(-1)],
    queryFn: ({ signal }) =>
      api.fetchPortfolioReports(reportCursors.at(-1) ?? '', signal),
    enabled: activeTab === 'reports',
    retry: false,
  });
  const detailQuery = useQuery({
    ...refreshPolicy,
    queryKey: ['portfolio', 'report', selectedReportId],
    queryFn: ({ signal }) => api.fetchPortfolioReport(selectedReportId, signal),
    enabled: Boolean(selectedReportId) && activeTab === 'reports',
    retry: false,
  });
  const positionsData = positionQuery.data;
  const riskProfile = riskQuery.data;
  const statistics = statisticsQuery.data;
  const executions = executionsQuery.data?.items ?? [];
  const reports = reportsQuery.data?.items ?? [];
  const selectedReport = detailQuery.isError
    ? null
    : (detailQuery.data ?? null);
  function changeFrom(value: string) {
    setPeriodFrom(value);
    setReportError(null);
    setExecutionCursors(['']);
  }
  function changeTo(value: string) {
    setPeriodTo(value);
    setReportError(null);
    setExecutionCursors(['']);
  }
  async function handleGenerateReport() {
    if (generation.current) return;
    if (!validPeriod) {
      setReportError(
        tx(
          'Selecciona un rango válido: Desde debe ser anterior o igual a Hasta.',
          'Select a valid range: From must be on or before To.',
        ),
      );
      return;
    }
    setReportError(null);
    generation.current = true;
    setGenerating(true);
    setStatusMessage(null);
    try {
      const result = await api.createPortfolioReport(periodFrom, periodTo);
      setSelectedReportId(result.id);
      client.setQueryData(['portfolio', 'report', result.id], result);
      setReportCursors(['']);
      await client.invalidateQueries({ queryKey: ['portfolio', 'reports'] });
      setStatusMessage(
        tx('Reporte generado correctamente.', 'Report generated successfully.'),
      );
    } catch (cause) {
      setReportError(portfolioErrorMessage(cause, locale));
    } finally {
      generation.current = false;
      setGenerating(false);
    }
  }
  if (!positionsData)
    return (
      <div className={styles.panelCard}>
        <h2 className={styles.headerTitle}>
          {tx('Mi portafolio', 'My portfolio')}
        </h2>
        {positionQuery.isPending ? (
          <LoadingState
            label={tx('Consultando tus posiciones…', 'Loading your positions…')}
          />
        ) : (
          <>
            <p role="alert" className={styles.alertError}>
              {portfolioErrorMessage(positionQuery.error, locale)}
            </p>
            <button
              type="button"
              className={styles.tabBtn}
              onClick={() => {
                void positionQuery.refetch();
              }}
            >
              {tx('Reintentar', 'Retry')}
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
  const pnlRatio = totalCostBasis > 0 ? totalUnrealizedPnl / totalCostBasis : 0;

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
            {tx(
              'Portafolio de Inversión y Rendimiento',
              'Investment Portfolio & Performance',
            )}
          </h2>
          <p className={styles.headerSubtitle}>
            {tx(
              'Consulta la valoración de tus posiciones en NYSE y NASDAQ, la distribución por sector y tu perfil de riesgo en dólares (USD).',
              'Review your NYSE and NASDAQ holdings valuation, sector allocation, and risk profile in USD.',
            )}
          </p>
        </div>
        <div className={styles.headerBadges}>
          <span className={`${styles.sourceBadge} ${styles.sourceBadgeLive}`}>
            {tx(
              'Valoración en USD · NYSE & NASDAQ',
              'USD Valuation · NYSE & NASDAQ',
            )}
          </span>
          <span className={styles.sourceBadge}>
            {tx('Actualizado:', 'Updated:')}{' '}
            {formatMarketDateTime(positionsData.positions_as_of, locale, {
              includeTime: false,
            })}
          </span>
          <button
            type="button"
            className={styles.refreshButton}
            disabled={positionQuery.isFetching}
            onClick={() => {
              void client.invalidateQueries({ queryKey: ['portfolio'] });
            }}
          >
            <Icon name="exchange" size={16} />
            {tx('Actualizar portafolio', 'Refresh portfolio')}
          </button>
        </div>
      </div>

      {activeQuery.isPending && activeTab !== 'positions' && (
        <LoadingState
          mode="compact"
          label={tx('Consultando esta sección…', 'Loading this section…')}
        />
      )}
      {activeQuery.isError && (
        <p role="alert" className={styles.alertError}>
          {tx(
            'No se pudo actualizar esta sección.',
            'Could not refresh this section.',
          )}
          {activeQuery.data
            ? tx(
                'Se conserva la última información recibida.',
                'Showing the last received information.',
              )
            : ''}{' '}
          <button
            type="button"
            onClick={() => {
              void activeQuery.refetch();
            }}
          >
            {tx('Reintentar', 'Retry')}
          </button>
        </p>
      )}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>
            {tx('Valor de Mercado en Acciones', 'Equity Market Value')}
          </span>
          <span className={styles.kpiValue}>
            {formatPortfolioUsd(totalMarketVal)}
          </span>
          <span className={styles.kpiHint}>
            {positionsData.positions.length}{' '}
            {tx('posiciones abiertas en EE. UU.', 'open US positions')}
          </span>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>
            {tx('Costo Base Invertido', 'Invested Cost Basis')}
          </span>
          <span className={styles.kpiValue}>
            {formatPortfolioUsd(totalCostBasis)}
          </span>
          <span className={styles.kpiHint}>
            {tx(
              'Precio promedio ponderado de adquisición',
              'Weighted average entry cost',
            )}
          </span>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>
            {tx(
              'Rendimiento Latente (Ganancia / Pérdida)',
              'Unrealized Return (P&L)',
            )}
          </span>
          <span
            className={`${styles.kpiValue} ${totalUnrealizedPnl >= 0 ? styles.kpiValueGain : styles.kpiValueLoss}`}
          >
            {totalUnrealizedPnl >= 0 ? '+' : ''}
            {formatPortfolioUsd(totalUnrealizedPnl)} (
            {formatPercent(pnlRatio, locale)})
          </span>
          <span className={styles.kpiHint}>
            {tx(
              'Ganancia o pérdida no realizada frente al costo invertido',
              'Unrealized gain or loss relative to invested cost',
            )}
          </span>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>
            {tx('Clasificación de Riesgo', 'Risk Profile')}
          </span>
          <span className={styles.kpiValue}>
            {riskProfile ? (
              formatRiskClassLabel(riskProfile.classification, locale)
            ) : (
              <button
                type="button"
                className={styles.riskLink}
                onClick={() => setActiveTab('risk')}
              >
                {tx('Ver perfil', 'View profile')}{' '}
                <Icon name="arrow" size={16} />
              </button>
            )}
          </span>
          <span className={styles.kpiHint}>
            {tx('Índice global:', 'Global score:')}{' '}
            {riskProfile?.risk_score ?? 'N/A'} ·{' '}
            {riskProfile?.metrics.execution_count ?? '—'}{' '}
            {tx('operaciones', 'trades')}
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
          aria-label={tx('Secciones de portafolio', 'Portfolio sections')}
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'positions'}
            className={`${styles.tabBtn} ${activeTab === 'positions' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('positions')}
          >
            {tx('Posiciones Activas', 'Active Positions')} (
            {positionsData.positions.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'statistics'}
            className={`${styles.tabBtn} ${activeTab === 'statistics' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('statistics')}
          >
            {tx('Estadísticas y Distribución', 'Statistics & Breakdown')}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'risk'}
            className={`${styles.tabBtn} ${activeTab === 'risk' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('risk')}
          >
            {tx('Perfil de Riesgo', 'Risk Profile')}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'executions'}
            className={`${styles.tabBtn} ${activeTab === 'executions' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('executions')}
          >
            {tx('Historial de Ejecuciones', 'Execution History')} (
            {executions.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'reports'}
            className={`${styles.tabBtn} ${activeTab === 'reports' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('reports')}
          >
            {tx('Reportes Consolidados', 'Consolidated Reports')} (
            {reports.length})
          </button>
        </div>

        {activeTab === 'positions' && (
          <div className={styles.viewSwitcher}>
            <button
              type="button"
              className={`${styles.viewBtn} ${viewMode === 'table' ? styles.viewBtnActive : ''}`}
              onClick={() => setViewMode('table')}
            >
              {tx('Tabla', 'Table')}
            </button>
            <button
              type="button"
              className={`${styles.viewBtn} ${viewMode === 'cards' ? styles.viewBtnActive : ''}`}
              onClick={() => setViewMode('cards')}
            >
              {tx('Tarjetas', 'Cards')}
            </button>
            <button
              type="button"
              className={`${styles.viewBtn} ${viewMode === 'chart' ? styles.viewBtnActive : ''}`}
              onClick={() => setViewMode('chart')}
            >
              {tx('Participación %', 'Allocation %')}
            </button>
          </div>
        )}
      </div>

      {(activeTab === 'executions' || activeTab === 'statistics') && (
        <PortfolioDateFilters
          from={periodFrom}
          to={periodTo}
          onFrom={changeFrom}
          onTo={changeTo}
        />
      )}
      {activeTab === 'positions' &&
        positionsData.positions.some(
          (position) => position.reconciliation_mismatch,
        ) && (
          <p role="status" className={styles.warningNotice}>
            {tx(
              'Hay diferencias de conciliación en algunas posiciones. Revisa los datos antes de operar.',
              'Some positions have reconciliation differences. Review the data before trading.',
            )}
          </p>
        )}
      {activeTab === 'positions' && positionsData.positions.length === 0 && (
        <p className={styles.emptyNotice}>
          {tx(
            'No tienes posiciones abiertas. Las compras aparecerán aquí cuando se ejecuten.',
            'You have no open positions. Purchases appear here once executed.',
          )}
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
        <PortfolioStatisticsTab statistics={statistics} />
      )}

      {activeTab === 'risk' && riskProfile && (
        <PortfolioRiskTab riskProfile={riskProfile} />
      )}

      {activeTab === 'executions' &&
        validPeriod &&
        !executionsQuery.isPending &&
        !executionsQuery.isError && (
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
        <fieldset disabled={generating} className={styles.reportFieldset}>
          <PortfolioReportsTab
            reportError={reportError}
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
      {activeTab === 'reports' &&
        ((detailQuery.isPending && Boolean(selectedReportId)) ||
          generating) && (
          <LoadingState
            mode="compact"
            label={
              generating
                ? tx('Generando reporte…', 'Generating report…')
                : tx('Consultando reporte…', 'Loading report…')
            }
          />
        )}
      {activeTab === 'reports' && detailQuery.isError && (
        <p role="alert" className={styles.alertError}>
          {tx(
            'No se pudo consultar el reporte seleccionado.',
            'Could not load the selected report.',
          )}
        </p>
      )}
      {['executions', 'reports'].includes(activeTab) && (
        <nav
          className={styles.pagination}
          aria-label={tx('Páginas de resultados', 'Result pages')}
        >
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
            {tx('Anterior', 'Previous')}
          </button>
          <span>
            {tx('Página', 'Page')}{' '}
            {
              (activeTab === 'executions' ? executionCursors : reportCursors)
                .length
            }{' '}
            · {tx('10 registros por página', '10 records per page')}
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
            {tx('Siguiente', 'Next')}
          </button>
        </nav>
      )}
    </div>
  );
}
