import { formatUsd } from '@/lib/formatters';
import { tx, type Locale } from '@/lib/i18n/locale';

export const reportTypeLabels: Record<string, string> = {
  on_demand: 'Bajo demanda',
  daily_summary: 'Resumen diario',
  monthly: 'Mensual',
  broker: 'Comisionista',
};

const REPORT_TYPE_EN: Record<string, string> = {
  on_demand: 'On demand',
  daily_summary: 'Daily summary',
  monthly: 'Monthly',
  broker: 'Broker',
};

export function formatReportType(type: string, locale: Locale = 'es'): string {
  if (locale === 'en') return REPORT_TYPE_EN[type] ?? type;
  return reportTypeLabels[type] ?? type;
}

export const ownerRoleLabels: Record<string, string> = {
  investor: 'Inversionista',
  broker: 'Comisionista',
};

export function formatOwnerRole(role: string, locale: Locale = 'es'): string {
  if (locale === 'en') {
    if (role === 'investor') return 'Investor';
    if (role === 'broker') return 'Broker';
    return role;
  }
  return ownerRoleLabels[role] ?? role;
}

const SECTOR_EN: Record<string, string> = {
  'Tecnología & Semiconductores': 'Technology & Semiconductors',
  'Inteligencia Artificial & Semiconductores': 'AI & Semiconductors',
  'Cloud & Software Empresarial': 'Cloud & Enterprise Software',
  'Banca & Servicios Financieros': 'Banking & Financial Services',
};

export function formatSectorLabel(
  sector: string | null,
  locale: Locale = 'es',
): string {
  if (!sector) return tx(locale, 'Renta Variable EE. UU.', 'US Equities');
  if (locale === 'en') return SECTOR_EN[sector] ?? sector;
  return sector;
}

export function formatPortfolioUsd(val: string | number): string {
  if (!Number.isFinite(Number(val))) return 'No disponible';
  return formatUsd(val, { withCode: true });
}

export function formatRiskClassLabel(
  classification: string,
  locale: Locale = 'es',
): string {
  switch (classification) {
    case 'conservative':
      return tx(locale, 'Conservador', 'Conservative');
    case 'moderate':
      return tx(locale, 'Moderado', 'Moderate');
    case 'aggressive':
      return tx(locale, 'Agresivo', 'Aggressive');
    default:
      return tx(locale, 'En evaluación', 'Evaluating');
  }
}
