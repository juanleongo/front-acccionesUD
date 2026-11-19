const BANK_STATUS_LABELS: Record<string, string> = {
  APPROVED: 'Aprobada',
  QUEUED: 'En validación',
  SENT_TO_VENDOR: 'En validación',
  APPROVAL_REQUIRED: 'Pendiente de aprobación',
  CANCELED: 'Cancelada',
  CANCELLED: 'Cancelada',
  REJECTED: 'Rechazada',
};

const TRANSFER_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  QUEUED: 'En cola',
  SENT_TO_CLEARING: 'En compensación',
  COMPLETE: 'Completado',
  COMPLETED: 'Completado',
  COMPLETADO: 'Completado',
  CANCELED: 'Cancelado',
  CANCELLED: 'Cancelado',
  REJECTED: 'Rechazado',
  RETURNED: 'Devuelto',
  FAILED: 'Fallido',
};

export type WalletStatusTone = 'success' | 'reserved' | 'error';

export function formatBankStatus(status: string): string {
  return BANK_STATUS_LABELS[status.toUpperCase()] ?? 'En verificación';
}

export function formatTransferStatus(status: string): string {
  return TRANSFER_STATUS_LABELS[status.toUpperCase()] ?? 'En proceso';
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
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
