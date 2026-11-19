'use client';

/**
 * Plantilla de contratos e integración API — Módulo 05 (Portafolio y Seguimiento de Activos).
 *
 * NOTA PARA EL INTEGRADOR DE APIs:
 * Las vistas de `PortfolioDashboard.tsx` están completamente maquetadas y operan
 * sobre los datos de diseño de `portfolio-mock.ts`.
 * Conecta cada función inferior usando `browserHttp.request` de `@/lib/api/client`.
 */

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

export async function fetchPortfolioPositions(): Promise<PortfolioPositionsData> {
  // TODO(integración-api): Conectar con GET /api/v1/portfolio/positions
  return INITIAL_PORTFOLIO_POSITIONS;
}

export async function fetchPortfolioExecutions(): Promise<
  PortfolioExecution[]
> {
  // TODO(integración-api): Conectar con GET /api/v1/portfolio/executions?from=&to=&symbol=
  return INITIAL_PORTFOLIO_EXECUTIONS;
}

export async function fetchPortfolioStatistics(): Promise<PortfolioStatistics> {
  // TODO(integración-api): Conectar con GET /api/v1/portfolio/statistics?from=&to=
  return INITIAL_PORTFOLIO_STATISTICS;
}

export async function fetchPortfolioRiskProfile(): Promise<PortfolioRiskProfile> {
  // TODO(integración-api): Conectar con GET /api/v1/portfolio/risk-profile
  return INITIAL_PORTFOLIO_RISK;
}

export async function fetchPortfolioReports(): Promise<
  PortfolioReportSummary[]
> {
  // TODO(integración-api): Conectar con GET /api/v1/portfolio/reports
  return INITIAL_PORTFOLIO_REPORTS;
}
