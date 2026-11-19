export const ORDER_STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Pendiente' },
  { value: 'SUBMITTED', label: 'Enviada' },
  { value: 'BROKER_SIGNED', label: 'Autorizada por comisionista' },
  { value: 'EXECUTING', label: 'En ejecución' },
  { value: 'CANCELED', label: 'Cancelada' },
  { value: 'REJECTED', label: 'Rechazada' },
  { value: 'EXPIRED', label: 'Expirada' },
  { value: 'IN_REVIEW', label: 'En revisión' },
  { value: 'FAILED', label: 'Fallida' },
  { value: 'HELD', label: 'Retenida por variación' },
] as const;

const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  SUBMITTED: 'Enviada',
  BROKER_SIGNED: 'Autorizada por comisionista',
  EXECUTING: 'En ejecución',
  FILLED: 'Ejecutada',
  PARTIALLY_FILLED: 'Ejecución parcial',
  CANCELED: 'Cancelada',
  CANCELLED: 'Cancelada',
  REJECTED: 'Rechazada',
  EXPIRED: 'Expirada',
  IN_REVIEW: 'En revisión',
  FAILED: 'Fallida',
  HELD: 'Retenida por variación',
  ACCEPTED: 'Aceptada',
  NEW: 'Registrada',
};

const ORDER_CAUSE_LABELS: Record<string, string> = {
  schedule_change: 'Ajuste por horario de mercado',
  new: 'Registrada en mercado',
  pending_new: 'En espera de apertura o confirmación',
  accepted: 'Aceptada en bolsa',
  filled: 'Completada en su totalidad',
  partially_filled: 'Ejecución parcial en curso',
  canceled: 'Cancelada',
  cancelled: 'Cancelada',
  expired: 'Vigencia expirada',
  rejected: 'Rechazada en validación',
  held: 'Pendiente de confirmación por cambio de precio',
  replaced: 'Modificada y reemplazada',
  pending_cancel: 'Cancelación en proceso',
  pending_replace: 'Modificación en proceso',
  broker_review: 'En revisión del comisionista',
  returned_for_changes: 'Devuelta para corrección',
  slippage_exceeded: 'Variación de precio superó el umbral',
  price_slippage: 'Variación de precio detectada',
  no_longer_needed: 'Ya no se requiere la orden',
  price_changed: 'Cambió el precio del mercado',
  input_error: 'Corrección de datos ingresados',
};

const TIME_IN_FORCE_LABELS: Record<string, string> = {
  day: 'Día de sesión',
  gtc: 'Vigente hasta cancelar',
  ioc: 'Inmediata o cancelar',
  fok: 'Completa o cancelar',
};

export type OrderBadgeTone =
  'filled' | 'open' | 'queued' | 'reauth' | 'cancelled';

export function formatOrderStatus(status: string, fullyFilled = false): string {
  if (fullyFilled) return 'Ejecutada';
  return ORDER_STATUS_LABELS[status.toUpperCase()] ?? 'En proceso';
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

export function formatOrderCause(cause: string | null | undefined): string {
  if (!cause) return 'Sin observaciones';
  const normalized = cause.trim().toLowerCase();
  if (ORDER_CAUSE_LABELS[normalized]) return ORDER_CAUSE_LABELS[normalized];
  const cleaned = normalized.replace(/[_-]+/g, ' ').trim();
  if (!cleaned) return 'Sin observaciones';
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

export function formatTimeInForce(tif: string): string {
  return TIME_IN_FORCE_LABELS[tif.toLowerCase()] ?? tif.toUpperCase();
}
