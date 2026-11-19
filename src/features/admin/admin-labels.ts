export type AdminTab =
  'kpi' | 'brokers' | 'users' | 'rbac' | 'markets' | 'create-admin' | 'audit';

export const actionLabels: Record<string, string> = {
  administrator_created: 'Administrador creado',
  broker_activated: 'Comisionista activado',
  premium_changed: 'Plan prémium actualizado',
  role_assignment_created: 'Rol asignado',
  role_assignment_revoked: 'Rol revocado',
  kyc_reconciled: 'Verificación de identidad actualizada',
};

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

export const roleLabels: Record<string, string> = {
  administrator: 'Administrador',
  broker: 'Comisionista',
  investor: 'Inversionista',
};

export const roleDescriptions: Record<string, string> = {
  administrator:
    'Control total de identidades, aprobación de asesores AMV y calendario bursátil.',
  broker:
    'Estructuración de carteras recomendadas y asesoramiento en mercados de Wall Street.',
  investor:
    'Simulación bursátil, transmisión de órdenes en vivo y consulta de portafolio.',
};
