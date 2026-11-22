import { formatUsd as formatSharedUsd } from '@/lib/formatters';
import { tx, type Locale } from '@/lib/i18n/locale';

const BANK_STATUS_LABELS: Record<string, { es: string; en: string }> = {
  APPROVED: { es: 'Aprobada', en: 'Approved' },
  QUEUED: { es: 'En validación', en: 'Validating' },
  SENT_TO_VENDOR: { es: 'En validación', en: 'Validating' },
  APPROVAL_REQUIRED: { es: 'Pendiente de aprobación', en: 'Pending approval' },
  CANCELED: { es: 'Cancelada', en: 'Canceled' },
  CANCELLED: { es: 'Cancelada', en: 'Canceled' },
  REJECTED: { es: 'Rechazada', en: 'Rejected' },
};

const TRANSFER_STATUS_LABELS: Record<string, { es: string; en: string }> = {
  PENDING: { es: 'Pendiente', en: 'Pending' },
  QUEUED: { es: 'En cola', en: 'Queued' },
  SENT_TO_CLEARING: { es: 'En compensación', en: 'Clearing' },
  COMPLETE: { es: 'Completado', en: 'Completed' },
  COMPLETED: { es: 'Completado', en: 'Completed' },
  COMPLETADO: { es: 'Completado', en: 'Completed' },
  LIQUIDADO: { es: 'Liquidado', en: 'Settled' },
  RESERVADO: { es: 'Reservado', en: 'Reserved' },
  CANCELED: { es: 'Cancelado', en: 'Canceled' },
  CANCELLED: { es: 'Cancelado', en: 'Canceled' },
  REJECTED: { es: 'Rechazado', en: 'Rejected' },
  RETURNED: { es: 'Devuelto', en: 'Returned' },
  FAILED: { es: 'Fallido', en: 'Failed' },
};

export type WalletStatusTone = 'success' | 'reserved' | 'error';

export function formatBankStatus(
  status: string,
  locale: Locale = 'es',
): string {
  const entry = BANK_STATUS_LABELS[status.toUpperCase()];
  if (entry) return locale === 'en' ? entry.en : entry.es;
  return tx(locale, 'En verificación', 'Verifying');
}

export function formatTransferStatus(
  status: string,
  locale: Locale = 'es',
): string {
  const entry = TRANSFER_STATUS_LABELS[status.toUpperCase()];
  if (entry) return locale === 'en' ? entry.en : entry.es;
  return tx(locale, 'En proceso', 'In progress');
}

export function formatCurrencyName(
  code: string,
  locale: Locale = 'es',
  fallback = code,
): string {
  const names: Record<string, { es: string; en: string }> = {
    COP: { es: 'Peso Colombiano', en: 'Colombian Peso' },
    EUR: { es: 'Euro', en: 'Euro' },
    GBP: { es: 'Libra Esterlina', en: 'British Pound' },
    USD: { es: 'Dólar Estadounidense', en: 'US Dollar' },
  };
  const entry = names[code.toUpperCase()];
  if (!entry) return fallback;
  return locale === 'en' ? entry.en : entry.es;
}

export function getTransferStatusTone(status: string): WalletStatusTone {
  switch (status.toUpperCase()) {
    case 'COMPLETE':
    case 'COMPLETED':
    case 'COMPLETADO':
    case 'APPROVED':
      return 'success';
    case 'CANCELED':
    case 'CANCELLED':
    case 'REJECTED':
    case 'RETURNED':
    case 'FAILED':
      return 'error';
    default:
      return 'reserved';
  }
}

export function formatUsd(amount: number): string {
  return formatSharedUsd(amount).replace(/^-?\$/, (prefix) =>
    prefix.startsWith('-') ? '-' : '',
  );
}
