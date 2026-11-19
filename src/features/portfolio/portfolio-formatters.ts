export const reportTypeLabels: Record<string, string> = {
  on_demand: 'Bajo demanda',
  daily_summary: 'Resumen diario',
  monthly: 'Mensual',
  broker: 'Comisionista',
};

export const ownerRoleLabels: Record<string, string> = {
  investor: 'Inversionista',
  broker: 'Comisionista',
};

export function formatPortfolioUsd(val: string | number): string {
  const num = typeof val === 'number' ? val : Number(val);
  if (!Number.isFinite(num)) return '$0.00 USD';
  return `$${num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} USD`;
}

export function formatRiskClassLabel(classification: string): string {
  switch (classification) {
    case 'conservative':
      return 'Conservador';
    case 'moderate':
      return 'Moderado';
    case 'aggressive':
      return 'Agresivo';
    default:
      return 'En evaluación';
  }
}
