import type { Locale } from '@/lib/i18n/locale';

export const linkStatusLabels: Record<string, string> = {
  requested: 'Solicitud enviada',
  active: 'Vínculo activo',
  declined: 'Declinado',
  canceled: 'Cancelado',
  expired: 'Expirado',
  ended: 'Finalizado',
};

const LINK_STATUS_EN: Record<string, string> = {
  requested: 'Request sent',
  active: 'Active link',
  declined: 'Declined',
  canceled: 'Canceled',
  expired: 'Expired',
  ended: 'Ended',
};

export function formatLinkStatus(
  status: string,
  locale: Locale = 'es',
): string {
  if (locale === 'en') return LINK_STATUS_EN[status] ?? status;
  return linkStatusLabels[status] ?? status;
}

export const proposalStatusLabels: Record<string, string> = {
  sent: 'Pendiente de firma',
  accepted: 'Aceptada',
  rejected: 'Rechazada',
  withdrawn: 'Retirada',
  approved: 'Orden creada',
  declined_by_broker: 'Declinada',
  conversion_failed: 'Con observaciones',
  expired: 'Expirada',
};

const PROPOSAL_STATUS_EN: Record<string, string> = {
  sent: 'Pending signature',
  accepted: 'Accepted',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
  approved: 'Order created',
  declined_by_broker: 'Declined',
  conversion_failed: 'Needs attention',
  expired: 'Expired',
};

export function formatProposalStatus(
  status: string,
  locale: Locale = 'es',
): string {
  if (locale === 'en') return PROPOSAL_STATUS_EN[status] ?? status;
  return proposalStatusLabels[status] ?? status;
}

export function getProposalStatusTone(
  status: string,
): 'success' | 'error' | 'warning' {
  if (status === 'approved' || status === 'accepted') return 'success';
  if (
    status === 'rejected' ||
    status === 'declined_by_broker' ||
    status === 'conversion_failed' ||
    status === 'expired'
  ) {
    return 'error';
  }
  return 'warning';
}

const LOCAL_BROKER_AVATARS: Record<string, string> = {
  'a0112233-4455-6677-8899-aabbccddeeff': '/advisors/advisor-1.jpg',
  'b1223344-5566-7788-99aa-bbccddeeff00': '/advisors/advisor-2.jpg',
  'c2334455-6677-8899-aabb-ccddeeff0011': '/advisors/advisor-3.jpg',
};

const ALLOWED_EXTERNAL_AVATAR_PREFIX = 'https://images.unsplash.com/';

export function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function resolveBrokerAvatar(
  brokerId: string,
  avatarUrl?: string,
): string | null {
  if (LOCAL_BROKER_AVATARS[brokerId]) {
    return LOCAL_BROKER_AVATARS[brokerId];
  }
  if (
    avatarUrl &&
    (avatarUrl.startsWith('/') ||
      avatarUrl.startsWith(ALLOWED_EXTERNAL_AVATAR_PREFIX))
  ) {
    return avatarUrl;
  }
  return null;
}
