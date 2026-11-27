import { formatMarketDateTime } from '@/lib/formatters';
import { tx, type Locale } from '@/lib/i18n/locale';

export type AdminTab =
  | 'kpi'
  | 'brokers'
  | 'users'
  | 'rbac'
  | 'markets'
  | 'create-admin'
  | 'audit'
  | 'commissions'
  | 'fees'
  | 'halts'
  | 'compliance'
  | 'trail';

export const actionLabels: Record<string, string> = {
  administrator_created: 'Administrador creado',
  broker_activated: 'Comisionista activado',
  premium_changed: 'Plan prémium actualizado',
  role_assignment_created: 'Rol asignado',
  role_assignment_revoked: 'Rol revocado',
  kyc_reconciled: 'Verificación de identidad actualizada',
};

const ACTION_LABELS_EN: Record<string, string> = {
  administrator_created: 'Administrator created',
  broker_activated: 'Broker activated',
  premium_changed: 'Premium plan updated',
  role_assignment_created: 'Role assigned',
  role_assignment_revoked: 'Role revoked',
  kyc_reconciled: 'Identity verification reconciled',
};

export function formatActionLabel(
  action: string,
  locale: Locale = 'es',
): string {
  if (locale === 'en') {
    return ACTION_LABELS_EN[action] ?? 'Administrative action';
  }
  return actionLabels[action] ?? 'Acción administrativa';
}

export const permissionLabels: Record<string, string> = {
  'admin:users': 'Gestionar usuarios',
  'admin:rbac': 'Administrar roles',
  'admin:markets': 'Configurar mercados',
  'account:manage': 'Gestionar cuenta',
  'orders:execute': 'Gestionar órdenes',
  'portfolio:view': 'Consultar portafolio',
  'markets:read': 'Consultar mercados',
  'advisors:propose': 'Crear propuestas',
};

const PERMISSION_LABELS_EN: Record<string, string> = {
  'admin:users': 'Manage users',
  'admin:rbac': 'Manage roles',
  'admin:markets': 'Configure markets',
  'account:manage': 'Manage account',
  'orders:execute': 'Execute orders',
  'portfolio:view': 'View portfolio',
  'markets:read': 'View markets',
  'advisors:propose': 'Create proposals',
};

const PERMISSION_DESC_EN: Record<string, string> = {
  'admin:users':
    'Manage platform users, activate broker accounts, and toggle premium plans.',
  'admin:rbac': 'Review and manage role definitions and permissions.',
  'admin:markets':
    'Configure default exchange hours and market calendar overrides.',
  'account:manage': 'Manage own account, profile, and KYC verification.',
  'orders:execute':
    'Preview, submit, cancel, and reauthorize brokerage orders.',
  'portfolio:view': 'View portfolio positions, analytics, and reports.',
  'markets:read': 'Read market clock, calendar, and quote series.',
  'advisors:propose': 'Issue investment proposals to linked investors.',
};

export function formatPermissionLabel(
  code: string,
  locale: Locale = 'es',
): string {
  if (locale === 'en') return PERMISSION_LABELS_EN[code] ?? code;
  return permissionLabels[code] ?? code;
}

export function formatPermissionDescription(
  code: string,
  locale: Locale = 'es',
  fallback = '',
): string {
  if (locale === 'en') return PERMISSION_DESC_EN[code] ?? fallback;
  return fallback;
}

export const roleLabels: Record<string, string> = {
  administrator: 'Administrador',
  broker: 'Comisionista',
  investor: 'Inversionista',
};

const ROLE_LABELS_EN: Record<string, string> = {
  administrator: 'Administrator',
  broker: 'Broker',
  investor: 'Investor',
};

export function formatRoleLabel(role: string, locale: Locale = 'es'): string {
  if (locale === 'en') return ROLE_LABELS_EN[role] ?? role;
  return roleLabels[role] ?? role;
}

export const roleDescriptions: Record<string, string> = {
  administrator:
    'Control total de identidades, aprobación de asesores AMV y calendario bursátil.',
  broker:
    'Estructuración de carteras recomendadas y asesoramiento en mercados de Wall Street.',
  investor:
    'Simulación bursátil, transmisión de órdenes en vivo y consulta de portafolio.',
};

export function formatRoleDescription(
  role: string,
  locale: Locale = 'es',
): string {
  if (locale === 'en') {
    switch (role) {
      case 'administrator':
        return 'Full control of user identities, broker activations, and market calendars.';
      case 'broker':
        return 'Portfolio recommendations and advisory across Wall Street equities.';
      case 'investor':
        return 'Equity simulation, live order routing, and portfolio analytics.';
      default:
        return '';
    }
  }
  return roleDescriptions[role] ?? '';
}

export function formatTodayLabel(locale: Locale = 'es'): string {
  return tx(locale, 'Hoy', 'Today');
}

export function formatAdminDate(
  rawValue: string,
  locale: Locale = 'es',
  includeTime = false,
): string {
  if (rawValue === 'Hoy' || rawValue === 'Today') {
    return formatTodayLabel(locale);
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(rawValue)) {
    return formatMarketDateTime(rawValue, locale, { includeTime });
  }
  return rawValue;
}
