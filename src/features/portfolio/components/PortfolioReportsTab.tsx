'use client';

import {
  formatPortfolioUsd,
  ownerRoleLabels,
  reportTypeLabels,
} from '../portfolio-formatters';
import type {
  PortfolioExecution,
  PortfolioReportSummary,
} from '../portfolio-mock';
import styles from '../portfolio.module.css';

export function PortfolioExecutionsTab({
  executions,
  symbolFilter,
  onSymbolFilterChange,
}: {
  executions: PortfolioExecution[];
  symbolFilter: string;
  onSymbolFilterChange: (value: string) => void;
}) {
  return (
    <div className={styles.panelCard}>
      <div className={styles.panelHeader}>
        <div>
          <h3 className={styles.panelTitle}>
            Libro Mayor de Ejecuciones Bursátiles
          </h3>
          <p className={styles.panelDesc}>
            Registro de órdenes liquidadas en Wall Street y desglose de comisión
            reportada por la API.
          </p>
        </div>
        <div className={styles.filterRow}>
          <input
            type="text"
            className={styles.filterInput}
            placeholder="Filtrar por símbolo (ej. NVDA)..."
            value={symbolFilter}
            onChange={(e) => onSymbolFilterChange(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Referencia</th>
              <th>Fecha / Hora</th>
              <th>Símbolo</th>
              <th>Operación</th>
              <th>Cantidad</th>
              <th>Precio Liquidación</th>
              <th>Comisión</th>
              <th>Tipo de Liquidación</th>
            </tr>
          </thead>
          <tbody>
            {executions.map((ex) => (
              <tr key={ex.execution_id}>
                <td className={styles.monoCell}>{ex.execution_id}</td>
                <td>{new Date(ex.executed_at).toLocaleString('es-CO')}</td>
                <td>
                  <span className={styles.symbolTicker}>{ex.symbol}</span>{' '}
                  <span className={styles.exchangeBadge}>{ex.exchange}</span>
                </td>
                <td>
                  <span
                    className={
                      ex.side === 'buy'
                        ? styles.pnlBadgeGain
                        : styles.pnlBadgeLoss
                    }
                  >
                    {ex.side === 'buy' ? 'Compra' : 'Venta'}
                  </span>
                </td>
                <td className={styles.monoCell}>{ex.qty}</td>
                <td className={styles.monoCell}>
                  {formatPortfolioUsd(ex.price)}
                </td>
                <td className={styles.monoCell}>
                  {formatPortfolioUsd(ex.commission)}
                </td>
                <td>
                  <span className={styles.exchangeBadge}>
                    {ex.commission_source === 'official'
                      ? 'Confirmada'
                      : 'Estimada'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function PortfolioReportsTab({
  reports,
  selectedReport,
  periodFrom,
  periodTo,
  onPeriodFromChange,
  onPeriodToChange,
  onGenerateReport,
  onSelectReport,
}: {
  reports: PortfolioReportSummary[];
  selectedReport: PortfolioReportSummary | null;
  periodFrom: string;
  periodTo: string;
  onPeriodFromChange: (val: string) => void;
  onPeriodToChange: (val: string) => void;
  onGenerateReport: () => void;
  onSelectReport: (rep: PortfolioReportSummary) => void;
}) {
  return (
    <div className={styles.panelCard}>
      <div className={styles.panelHeader}>
        <div>
          <h3 className={styles.panelTitle}>
            Extractos y Reportes de Portafolio
          </h3>
          <p className={styles.panelDesc}>
            Genera y consulta certificados consolidados de tus posiciones y
            operaciones por rango de fechas.
          </p>
        </div>
        <div className={styles.filterRow}>
          <input
            type="date"
            className={styles.filterInput}
            value={periodFrom}
            onChange={(e) => onPeriodFromChange(e.target.value)}
            aria-label="Fecha inicial del reporte"
          />
          <input
            type="date"
            className={styles.filterInput}
            value={periodTo}
            onChange={(e) => onPeriodToChange(e.target.value)}
            aria-label="Fecha final del reporte"
          />
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={onGenerateReport}
          >
            + Generar Reporte
          </button>
        </div>
      </div>

      <div className={styles.twoColGrid}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Tipo de Reporte</th>
                <th>Período</th>
                <th>Fecha de Emisión</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((rep) => (
                <tr key={rep.id}>
                  <td>
                    <span className={styles.exchangeBadge}>
                      {reportTypeLabels[rep.type] ?? rep.type}
                    </span>
                  </td>
                  <td className={styles.monoCell}>
                    {rep.period.from} → {rep.period.to}
                  </td>
                  <td>
                    {new Date(rep.generated_at).toLocaleDateString('es-CO')}
                  </td>
                  <td>
                    <button
                      type="button"
                      className={styles.secondaryBtn}
                      onClick={() => onSelectReport(rep)}
                    >
                      Ver resumen
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selectedReport && (
          <div className={styles.reportDetailBox}>
            <div className={styles.panelTitle}>
              Resumen del Período ({selectedReport.period.from} al{' '}
              {selectedReport.period.to})
            </div>
            <div className={styles.kpiHint}>
              Tipo:{' '}
              <strong>
                {reportTypeLabels[selectedReport.type] ?? selectedReport.type}
              </strong>{' '}
              · Titular:{' '}
              {ownerRoleLabels[selectedReport.owner_role] ??
                selectedReport.owner_role}
            </div>
            <div className={styles.factorsGrid}>
              <div className={styles.factorCard}>
                <span className={styles.factorName}>Valor de Mercado</span>
                <span className={styles.factorScore}>
                  {formatPortfolioUsd(
                    String(
                      selectedReport.content?.market_value ?? 'No disponible',
                    ),
                  )}
                </span>
              </div>
              <div className={styles.factorCard}>
                <span className={styles.factorName}>Costo Base</span>
                <span className={styles.factorScore}>
                  {formatPortfolioUsd(
                    String(
                      selectedReport.content?.cost_basis ?? 'No disponible',
                    ),
                  )}
                </span>
              </div>
              <div className={styles.factorCard}>
                <span className={styles.factorName}>Ganancia / Pérdida</span>
                <span className={styles.factorScore}>
                  {formatPortfolioUsd(
                    String(
                      selectedReport.content?.unrealized_pnl ?? 'No disponible',
                    ),
                  )}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
