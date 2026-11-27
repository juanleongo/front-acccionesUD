'use client';

import type { FormEvent } from 'react';
import { DatePicker } from '@/components/ui/DatePicker';
import { formatMarketDateTime } from '@/lib/formatters';
import { useLocale } from '@/lib/i18n';
import {
  formatOwnerRole,
  formatPortfolioUsd,
  formatReportType,
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
  const { locale, tx } = useLocale();
  return (
    <div className={styles.panelCard}>
      <div className={styles.panelHeader}>
        <div>
          <h3 className={styles.panelTitle}>
            {tx(
              'Libro Mayor de Ejecuciones Bursátiles',
              'Equity Trade Execution Ledger',
            )}
          </h3>
          <p className={styles.panelDesc}>
            {tx(
              'Registro de órdenes liquidadas en Wall Street y comisiones reportadas por la API.',
              'Settled Wall Street executions with fees reported by the API.',
            )}
          </p>
        </div>
        <div className={styles.filterRow}>
          <label className={styles.fieldGroup} htmlFor="portfolio-exec-symbol">
            <span className={styles.fieldLabel}>
              {tx('Filtrar por símbolo', 'Filter by symbol')}
            </span>
            <input
              id="portfolio-exec-symbol"
              type="search"
              className={styles.filterInput}
              placeholder={tx('Ej. NVDA, AAPL…', 'E.g. NVDA, AAPL…')}
              value={symbolFilter}
              onChange={(e) => onSymbolFilterChange(e.target.value)}
            />
          </label>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <table className={`${styles.table} ${styles.executionsTable}`}>
          <thead>
            <tr>
              <th>{tx('Referencia', 'Reference')}</th>
              <th>{tx('Fecha / Hora', 'Date / Time')}</th>
              <th>{tx('Símbolo', 'Symbol')}</th>
              <th>{tx('Operación', 'Side')}</th>
              <th>{tx('Cantidad', 'Qty')}</th>
              <th>{tx('Precio Liquidación', 'Execution Price')}</th>
              <th>{tx('Comisión', 'Commission')}</th>
              <th>{tx('Tipo de Liquidación', 'Settlement Source')}</th>
            </tr>
          </thead>
          <tbody>
            {executions.length === 0 ? (
              <tr>
                <td colSpan={8} className={styles.emptyCell}>
                  {tx(
                    'No hay ejecuciones que coincidan con el símbolo buscado.',
                    'No executions match the entered symbol.',
                  )}
                </td>
              </tr>
            ) : (
              executions.map((ex) => (
                <tr key={ex.execution_id}>
                  <td
                    className={styles.monoCell}
                    data-label={tx('Referencia', 'Reference')}
                  >
                    {ex.execution_id}
                  </td>
                  <td
                    className={styles.tabularNum}
                    data-label={tx('Fecha / Hora', 'Date / Time')}
                  >
                    {formatMarketDateTime(ex.executed_at, locale)}
                  </td>
                  <td data-label={tx('Símbolo', 'Symbol')}>
                    <span className={styles.symbolTicker}>{ex.symbol}</span>{' '}
                    <span className={styles.exchangeBadge}>{ex.exchange}</span>
                  </td>
                  <td data-label={tx('Operación', 'Side')}>
                    <span
                      className={
                        ex.side === 'buy'
                          ? styles.pnlBadgeGain
                          : styles.pnlBadgeLoss
                      }
                    >
                      {ex.side === 'buy'
                        ? tx('Compra', 'Buy')
                        : tx('Venta', 'Sell')}
                    </span>
                  </td>
                  <td
                    className={styles.monoCell}
                    data-label={tx('Cantidad', 'Qty')}
                  >
                    {ex.qty}
                  </td>
                  <td
                    className={styles.monoCell}
                    data-label={tx('Precio Liquidación', 'Execution Price')}
                  >
                    {formatPortfolioUsd(ex.price)}
                  </td>
                  <td
                    className={styles.monoCell}
                    data-label={tx('Comisión', 'Commission')}
                  >
                    {formatPortfolioUsd(ex.commission)}
                  </td>
                  <td
                    data-label={tx('Tipo de Liquidación', 'Settlement Source')}
                  >
                    <span className={styles.exchangeBadge}>
                      {ex.commission_source === 'official'
                        ? tx('Confirmada', 'Confirmed')
                        : tx('Estimada (2%)', 'Estimated (2%)')}
                    </span>
                  </td>
                </tr>
              ))
            )}
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
  reportError,
  onPeriodFromChange,
  onPeriodToChange,
  onGenerateReport,
  onSelectReport,
}: {
  reports: PortfolioReportSummary[];
  selectedReport: PortfolioReportSummary | null;
  periodFrom: string;
  periodTo: string;
  reportError?: string | null;
  onPeriodFromChange: (val: string) => void;
  onPeriodToChange: (val: string) => void;
  onGenerateReport: () => void;
  onSelectReport: (rep: PortfolioReportSummary) => void;
}) {
  const { locale, tx } = useLocale();

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onGenerateReport();
  }

  return (
    <div className={styles.panelCard}>
      <div className={styles.panelHeader}>
        <div>
          <h3 className={styles.panelTitle}>
            {tx(
              'Extractos y Reportes de Portafolio',
              'Portfolio Statements & Reports',
            )}
          </h3>
          <p className={styles.panelDesc}>
            {tx(
              'Genera y consulta certificados consolidados de tus posiciones y operaciones por rango de fechas.',
              'Generate and view consolidated position and trade statements by date range.',
            )}
          </p>
        </div>
        <form onSubmit={handleSubmit} className={styles.filterRow} noValidate>
          <label className={styles.fieldGroup} htmlFor="report-period-from">
            <span className={styles.fieldLabel}>{tx('Desde', 'From')}</span>
            <DatePicker
              id="report-period-from"
              label={tx('Desde', 'From')}
              value={periodFrom}
              onChange={onPeriodFromChange}
            />
          </label>
          <label className={styles.fieldGroup} htmlFor="report-period-to">
            <span className={styles.fieldLabel}>{tx('Hasta', 'To')}</span>
            <DatePicker
              id="report-period-to"
              label={tx('Hasta', 'To')}
              value={periodTo}
              onChange={onPeriodToChange}
            />
          </label>
          <button type="submit" className={styles.primaryBtn}>
            {tx('+ Generar Reporte', '+ Generate Report')}
          </button>
        </form>
      </div>

      {reportError && (
        <p role="alert" className={styles.alertError}>
          {reportError}
        </p>
      )}

      <div className={styles.twoColGrid}>
        <div className={styles.tableWrapper}>
          <table
            className={`${styles.table} ${styles.reportsTable}`}
            role="table"
          >
            <thead>
              <tr>
                <th>{tx('Tipo de Reporte', 'Report Type')}</th>
                <th>{tx('Período', 'Period')}</th>
                <th>{tx('Fecha de Emisión', 'Issued Date')}</th>
                <th>{tx('Acción', 'Action')}</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((rep) => (
                <tr key={rep.id}>
                  <td data-label={tx('Tipo de reporte', 'Report type')}>
                    <span className={styles.exchangeBadge}>
                      {formatReportType(rep.type, locale)}
                    </span>
                  </td>
                  <td
                    className={styles.monoCell}
                    data-label={tx('Período', 'Period')}
                  >
                    <time dateTime={rep.period.from}>{rep.period.from}</time> →{' '}
                    <time dateTime={rep.period.to}>{rep.period.to}</time>
                  </td>
                  <td
                    className={styles.tabularNum}
                    data-label={tx('Fecha de emisión', 'Issued date')}
                  >
                    {formatMarketDateTime(rep.generated_at, locale, {
                      includeTime: false,
                    })}
                  </td>
                  <td data-label={tx('Acción', 'Action')}>
                    <button
                      type="button"
                      className={styles.secondaryBtn}
                      onClick={() => onSelectReport(rep)}
                    >
                      {tx('Ver resumen', 'View summary')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selectedReport && (
          <div className={styles.reportDetailBox}>
            <div className={`${styles.panelTitle} ${styles.tabularNum}`}>
              {tx('Resumen del período', 'Period summary')}
            </div>
            <p className={styles.reportPeriod}>
              <time dateTime={selectedReport.period.from}>
                {selectedReport.period.from}
              </time>
              <span aria-hidden="true">→</span>
              <time dateTime={selectedReport.period.to}>
                {selectedReport.period.to}
              </time>
            </p>
            <div className={styles.kpiHint}>
              {tx('Tipo:', 'Type:')}{' '}
              <strong>{formatReportType(selectedReport.type, locale)}</strong> ·{' '}
              {tx('Titular:', 'Holder:')}{' '}
              {formatOwnerRole(selectedReport.owner_role, locale)}
            </div>
            <div className={styles.factorsGrid}>
              <div className={styles.factorCard}>
                <span className={styles.factorName}>
                  {tx('Valor de Mercado', 'Market Value')}
                </span>
                <span className={styles.factorScore}>
                  {formatPortfolioUsd(
                    String(
                      selectedReport.content?.market_value ?? 'No disponible',
                    ),
                  )}
                </span>
              </div>
              <div className={styles.factorCard}>
                <span className={styles.factorName}>
                  {tx('Costo Base', 'Cost Basis')}
                </span>
                <span className={styles.factorScore}>
                  {formatPortfolioUsd(
                    String(
                      selectedReport.content?.cost_basis ?? 'No disponible',
                    ),
                  )}
                </span>
              </div>
              <div className={styles.factorCard}>
                <span className={styles.factorName}>
                  {tx('Ganancia / Pérdida', 'Gain / Loss')}
                </span>
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
