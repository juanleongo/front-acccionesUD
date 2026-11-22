import { tx, type Locale } from '@/lib/i18n/locale';

export const orderTypeLabels = {
  market: 'Mercado',
  limit: 'Límite / take profit simple',
  stop: 'Stop loss',
  stop_limit: 'Stop-limit',
  trailing_stop: 'Trailing stop',
};

export function getOrderTypeLabels(locale: Locale = 'es') {
  if (locale === 'en') {
    return {
      market: 'Market',
      limit: 'Limit / simple take profit',
      stop: 'Stop loss',
      stop_limit: 'Stop-limit',
      trailing_stop: 'Trailing stop',
    };
  }
  return orderTypeLabels;
}

export const ORDER_STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Pendiente', labelEn: 'Pending' },
  { value: 'SUBMITTED', label: 'Enviada', labelEn: 'Submitted' },
  {
    value: 'BROKER_SIGNED',
    label: 'Autorizada por comisionista',
    labelEn: 'Broker approved',
  },
  { value: 'EXECUTING', label: 'En ejecución', labelEn: 'Executing' },
  { value: 'CANCELED', label: 'Cancelada', labelEn: 'Canceled' },
  { value: 'REJECTED', label: 'Rechazada', labelEn: 'Rejected' },
  { value: 'EXPIRED', label: 'Expirada', labelEn: 'Expired' },
  { value: 'IN_REVIEW', label: 'En revisión', labelEn: 'In review' },
  { value: 'FAILED', label: 'Fallida', labelEn: 'Failed' },
  {
    value: 'HELD',
    label: 'Retenida por variación',
    labelEn: 'Held for slippage',
  },
] as const;

export function getOrderStatusOptions(locale: Locale = 'es') {
  return ORDER_STATUS_OPTIONS.map((opt) => ({
    value: opt.value,
    label: locale === 'en' ? opt.labelEn : opt.label,
  }));
}

const ORDER_STATUS_LABELS: Record<string, { es: string; en: string }> = {
  PENDING: { es: 'Pendiente', en: 'Pending' },
  SUBMITTED: { es: 'Enviada', en: 'Submitted' },
  BROKER_SIGNED: { es: 'Autorizada por comisionista', en: 'Broker approved' },
  EXECUTING: { es: 'En ejecución', en: 'Executing' },
  FILLED: { es: 'Ejecutada', en: 'Filled' },
  PARTIALLY_FILLED: { es: 'Ejecución parcial', en: 'Partially filled' },
  CANCELED: { es: 'Cancelada', en: 'Canceled' },
  CANCELLED: { es: 'Cancelada', en: 'Canceled' },
  REJECTED: { es: 'Rechazada', en: 'Rejected' },
  EXPIRED: { es: 'Expirada', en: 'Expired' },
  IN_REVIEW: { es: 'En revisión', en: 'In review' },
  FAILED: { es: 'Fallida', en: 'Failed' },
  HELD: { es: 'Retenida por variación', en: 'Held for slippage' },
  ACCEPTED: { es: 'Aceptada', en: 'Accepted' },
  NEW: { es: 'Registrada', en: 'Registered' },
};

const ORDER_CAUSE_LABELS: Record<string, { es: string; en: string }> = {
  schedule_change: {
    es: 'Ajuste por horario de mercado',
    en: 'Market schedule adjustment',
  },
  new: { es: 'Registrada en mercado', en: 'Registered on exchange' },
  pending_new: {
    es: 'En espera de apertura o confirmación',
    en: 'Awaiting market open or confirmation',
  },
  accepted: { es: 'Aceptada en bolsa', en: 'Accepted by exchange' },
  filled: { es: 'Completada en su totalidad', en: 'Completely filled' },
  partially_filled: {
    es: 'Ejecución parcial en curso',
    en: 'Partially filled',
  },
  canceled: { es: 'Cancelada', en: 'Canceled' },
  cancelled: { es: 'Cancelada', en: 'Canceled' },
  expired: { es: 'Vigencia expirada', en: 'Time-in-force expired' },
  rejected: { es: 'Rechazada en validación', en: 'Rejected in validation' },
  held: {
    es: 'Pendiente de confirmación por cambio de precio',
    en: 'Pending price change confirmation',
  },
  replaced: { es: 'Modificada y reemplazada', en: 'Modified and replaced' },
  pending_cancel: { es: 'Cancelación en proceso', en: 'Cancel pending' },
  pending_replace: { es: 'Modificación en proceso', en: 'Replace pending' },
  broker_review: {
    es: 'En revisión del comisionista',
    en: 'Under broker review',
  },
  returned_for_changes: {
    es: 'Devuelta para corrección',
    en: 'Returned for changes',
  },
  slippage_exceeded: {
    es: 'Variación de precio superó el umbral',
    en: 'Price slippage exceeded threshold',
  },
  price_slippage: {
    es: 'Variación de precio detectada',
    en: 'Price slippage detected',
  },
  no_longer_needed: {
    es: 'Ya no se requiere la orden',
    en: 'Order no longer needed',
  },
  price_changed: {
    es: 'Cambió el precio del mercado',
    en: 'Market price changed',
  },
  input_error: {
    es: 'Corrección de datos ingresados',
    en: 'Input details correction',
  },
};

const TIME_IN_FORCE_LABELS: Record<string, { es: string; en: string }> = {
  day: { es: 'Día de sesión', en: 'Session day (DAY)' },
  gtc: { es: 'Vigente hasta cancelar', en: 'Good til canceled (GTC)' },
  ioc: { es: 'Inmediata o cancelar', en: 'Immediate or cancel (IOC)' },
  fok: { es: 'Completa o cancelar', en: 'Fill or kill (FOK)' },
};

export type OrderBadgeTone =
  'filled' | 'open' | 'queued' | 'reauth' | 'cancelled';

export function formatOrderStatus(
  status: string,
  fullyFilled = false,
  locale: Locale = 'es',
): string {
  if (fullyFilled) return tx(locale, 'Ejecutada', 'Filled');
  const entry = ORDER_STATUS_LABELS[status.toUpperCase()];
  if (entry) return locale === 'en' ? entry.en : entry.es;
  return tx(locale, 'En proceso', 'In progress');
}

export function getOrderStatusTone(
  status: string,
  fullyFilled = false,
): OrderBadgeTone {
  if (fullyFilled || status.toUpperCase() === 'FILLED') return 'filled';
  switch (status.toUpperCase()) {
    case 'SUBMITTED':
    case 'BROKER_SIGNED':
    case 'EXECUTING':
    case 'ACCEPTED':
      return 'open';
    case 'PENDING':
    case 'IN_REVIEW':
      return 'queued';
    case 'HELD':
    case 'REJECTED':
    case 'FAILED':
      return 'reauth';
    case 'CANCELED':
    case 'CANCELLED':
    case 'EXPIRED':
    default:
      return 'cancelled';
  }
}

export function formatOrderCause(
  cause: string | null | undefined,
  locale: Locale = 'es',
): string {
  if (!cause) return tx(locale, 'Sin observaciones', 'No notes');
  const normalized = cause.trim().toLowerCase();
  const entry = ORDER_CAUSE_LABELS[normalized];
  if (entry) return locale === 'en' ? entry.en : entry.es;
  const cleaned = normalized.replace(/[_-]+/g, ' ').trim();
  if (!cleaned) return tx(locale, 'Sin observaciones', 'No notes');
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

export function formatTimeInForce(tif: string, locale: Locale = 'es'): string {
  const entry = TIME_IN_FORCE_LABELS[tif.toLowerCase()];
  if (entry) return locale === 'en' ? entry.en : entry.es;
  return tif.toUpperCase();
}
