import { z } from 'zod';
import { browserHttp } from '@/lib/api/client';

export const roleAssignmentSchema = z.object({
  id: z.string(),
  role: z.string(),
  valid_from: z.string(),
  valid_to: z.string().nullable(),
  effective: z.boolean(),
  status: z.enum(['ACTIVE', 'CANCELLED', 'EXPIRED', 'PENDING']),
  cancelled_at: z.string().nullable().optional(),
  cancelled_by: z.string().nullable().optional(),
});
export type RoleAssignment = z.infer<typeof roleAssignmentSchema>;

export const brokerActivationSchema = z.object({
  user_id: z.string(),
  account_status: z.literal('active'),
  role_assignment: roleAssignmentSchema,
});
export type BrokerActivation = z.infer<typeof brokerActivationSchema>;

export const premiumOutSchema = z.object({
  user_id: z.string(),
  is_premium: z.boolean(),
});
export type PremiumOut = z.infer<typeof premiumOutSchema>;

export const roleOutSchema = z.object({
  role: z.string(),
  permissions: z.array(z.string()),
});
export type RoleOut = z.infer<typeof roleOutSchema>;

export const permissionOutSchema = z.object({
  code: z.string(),
  description: z.string(),
});
export type PermissionOut = z.infer<typeof permissionOutSchema>;

export const defaultScheduleSchema = z.object({
  market: z.string(),
  open_time: z.string(),
  close_time: z.string(),
});
export type DefaultSchedule = z.infer<typeof defaultScheduleSchema>;

export const scheduleOverrideSchema = z.object({
  id: z.string(),
  market: z.string(),
  date: z.string(),
  closed: z.boolean(),
  open_time: z.string().nullable(),
  close_time: z.string().nullable(),
});
export type ScheduleOverride = z.infer<typeof scheduleOverrideSchema>;

export const adminCreateAdminSchema = z.object({
  first_names: z.string().min(2),
  last_names: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(8),
  country: z.string().length(2),
  password: z.string().min(8),
});
export type AdminCreateAdminIn = z.infer<typeof adminCreateAdminSchema>;

export interface PendingBrokerItem {
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  country: string;
  licenseAMV: string;
  specialty: string;
  requestedAt: string;
  status: 'pending_broker_activation' | 'active';
}

export interface ManagedUserItem {
  userId: string;
  fullName: string;
  email: string;
  role: string;
  isPremium: boolean;
  accountStatus: string;
  registeredAt: string;
}

export const initialPendingBrokers: PendingBrokerItem[] = [
  {
    userId: 'aa3e17f1-1963-4f0c-adae-326154e65482',
    fullName: 'Juan José León',
    email: 'sursomartinez@gmail.com',
    phone: '+573115775108',
    country: 'CO',
    licenseAMV: 'AMV-11111 (Firma: leon)',
    specialty: 'Acciones de Crecimiento & ETFs en NYSE / NASDAQ',
    requestedAt: '12/Nov/2026 01:30',
    status: 'pending_broker_activation',
  },
  {
    userId: '89b43566-7fd8-4c7e-ac95-20a490c4de8e',
    fullName: 'Test Broker AR',
    email: 'test@test.com',
    phone: '+5711111111',
    country: 'AR',
    licenseAMV: 'AMV-AR-9901 (Firma Internacional)',
    specialty: 'Renta Variable y ADRs Latinoamericanos en Wall Street',
    requestedAt: '11/Nov/2026 13:12',
    status: 'pending_broker_activation',
  },
  {
    userId: '19f5fcb4-9a1d-4d3e-affe-96da0057cf2d',
    fullName: 'Prueba Ti (Comisionista Senior)',
    email: 'broker.ti@accionesud.com',
    phone: '+573001112235',
    country: 'CO',
    licenseAMV: 'LIC-001 (Firma de Prueba)',
    specialty: 'Activos de Alta Capitalización del S&P 500',
    requestedAt: '11/Nov/2026 15:03',
    status: 'active',
  },
  {
    userId: '39bf8e8a-d3ec-4172-82c5-99e9508ffce1',
    fullName: 'Broker Dos (Asesor Bursátil)',
    email: 'broker2.ti@accionesud.com',
    phone: '+573001112237',
    country: 'CO',
    licenseAMV: 'LIC-002 (Firma Dos)',
    specialty: 'Tecnología & Semiconductores en NASDAQ',
    requestedAt: '11/Nov/2026 15:09',
    status: 'active',
  },
];

export const initialManagedUsers: ManagedUserItem[] = [
  {
    userId: '9e4e5c80-92cb-46ec-a795-868bae8a8ef0',
    fullName: 'Daniel Sanabria Rivera',
    email: 'moto46play@gmail.com',
    role: 'investor',
    isPremium: true,
    accountStatus: 'active',
    registeredAt: '12/Nov/2026',
  },
  {
    userId: '75613e9a-678f-40a6-877f-54ccf3db1010',
    fullName: 'Juan León',
    email: 'fabioagus52@gmail.com',
    role: 'investor',
    isPremium: false,
    accountStatus: 'active',
    registeredAt: '12/Nov/2026',
  },
  {
    userId: '52c952ac-3fe5-4b0d-932c-bf920e7a1b4b',
    fullName: 'Initial Administrator',
    email: 'admin@accionesud.com',
    role: 'administrator',
    isPremium: true,
    accountStatus: 'active',
    registeredAt: '11/Nov/2026',
  },
  {
    userId: '932792e8-d8b7-43ac-a268-122eb5cfaea7',
    fullName: 'Admin Bootstrap TI',
    email: 'admin.ti@accionesud.com',
    role: 'administrator',
    isPremium: true,
    accountStatus: 'active',
    registeredAt: '11/Nov/2026',
  },
  {
    userId: 'afe9aa95-8f19-4593-bb42-fe7613792d0c',
    fullName: 'Admin Dos TI',
    email: 'admin2.ti@accionesud.com',
    role: 'administrator',
    isPremium: true,
    accountStatus: 'active',
    registeredAt: '11/Nov/2026',
  },
  {
    userId: '8c3bb02c-0618-4ee2-a6e0-046003d10673',
    fullName: 'Admin MFA Active',
    email: 'adminmfa.ti@accionesud.com',
    role: 'administrator',
    isPremium: true,
    accountStatus: 'active',
    registeredAt: '12/Nov/2026',
  },
  {
    userId: 'c0674321-9a64-4f13-9070-e57dfb35b4e8',
    fullName: 'Investor Test TI',
    email: 'investor.ti@accionesud.com',
    role: 'investor',
    isPremium: false,
    accountStatus: 'active',
    registeredAt: '11/Nov/2026',
  },
];

export const defaultSystemRoles: RoleOut[] = [
  {
    role: 'administrator',
    permissions: [
      'admin:users',
      'admin:rbac',
      'admin:markets',
      'account:manage',
    ],
  },
  {
    role: 'broker',
    permissions: [
      'account:manage',
      'orders:execute',
      'advisors:propose',
      'portfolio:view',
    ],
  },
  {
    role: 'investor',
    permissions: [
      'account:manage',
      'orders:execute',
      'portfolio:view',
      'markets:read',
    ],
  },
];

export const defaultSystemPermissions: PermissionOut[] = [
  {
    code: 'admin:users',
    description: 'Alta de administradores y activación de comisionistas AMV.',
  },
  {
    code: 'admin:rbac',
    description: 'Asignación, modificación y revocación de roles del sistema.',
  },
  {
    code: 'admin:markets',
    description: 'Gestión de horarios bursátiles y excepciones de Wall Street.',
  },
  {
    code: 'account:manage',
    description: 'Administración de perfil personal, MFA y preferencias.',
  },
  {
    code: 'orders:execute',
    description: 'Transmisión y cancelación de órdenes en NYSE y NASDAQ.',
  },
  {
    code: 'portfolio:view',
    description: 'Consulta de saldos en USD, posiciones y rendimientos.',
  },
  {
    code: 'markets:read',
    description: 'Lectura de cotizaciones bursátiles y velas en tiempo real.',
  },
];

export const initialMarketOverrides: ScheduleOverride[] = [
  {
    id: 'ov-01',
    market: 'NYSE',
    date: '2026-11-26',
    closed: false,
    open_time: '09:30',
    close_time: '13:00',
  },
  {
    id: 'ov-02',
    market: 'NASDAQ',
    date: '2026-11-26',
    closed: false,
    open_time: '09:30',
    close_time: '13:00',
  },
  {
    id: 'ov-03',
    market: 'NYSE',
    date: '2026-12-25',
    closed: true,
    open_time: null,
    close_time: null,
  },
  {
    id: 'ov-04',
    market: 'NASDAQ',
    date: '2026-12-25',
    closed: true,
    open_time: null,
    close_time: null,
  },
  {
    id: 'ov-05',
    market: 'AMEX',
    date: '2027-01-01',
    closed: true,
    open_time: null,
    close_time: null,
  },
];

/* Llamadas al API Backend */
export async function activateBroker(
  userId: string,
): Promise<BrokerActivation> {
  return browserHttp.request({
    path: `/api/v1/admin/users/${userId}/broker-activation`,
    method: 'POST',
    response: 'json',
    parse: brokerActivationSchema.parse,
  });
}

export async function setUserPremium(
  userId: string,
  isPremium: boolean,
): Promise<PremiumOut> {
  return browserHttp.request({
    path: `/api/v1/admin/users/${userId}/premium`,
    method: 'PUT',
    response: 'json',
    body: { is_premium: isPremium },
    parse: premiumOutSchema.parse,
  });
}

export async function getAdminRoles(): Promise<RoleOut[]> {
  return browserHttp.request({
    path: '/api/v1/admin/roles',
    method: 'GET',
    response: 'json',
    parse: z.array(roleOutSchema).parse,
  });
}

export async function getAdminPermissions(): Promise<PermissionOut[]> {
  return browserHttp.request({
    path: '/api/v1/admin/permissions',
    method: 'GET',
    response: 'json',
    parse: z.array(permissionOutSchema).parse,
  });
}

export async function getUserRoleAssignments(
  userId: string,
): Promise<RoleAssignment[]> {
  return browserHttp.request({
    path: `/api/v1/admin/users/${userId}/roles`,
    method: 'GET',
    response: 'json',
    parse: z.array(roleAssignmentSchema).parse,
  });
}

export async function assignUserRole(
  userId: string,
  role: string,
): Promise<RoleAssignment> {
  return browserHttp.request({
    path: `/api/v1/admin/users/${userId}/roles`,
    method: 'POST',
    response: 'json',
    body: {
      role,
      valid_from: new Date().toISOString(),
      valid_to: null,
    },
    parse: roleAssignmentSchema.parse,
  });
}

export async function revokeUserRole(
  userId: string,
  assignmentId: string,
): Promise<RoleAssignment> {
  return browserHttp.request({
    path: `/api/v1/admin/users/${userId}/roles/${assignmentId}/revoke`,
    method: 'POST',
    response: 'json',
    parse: roleAssignmentSchema.parse,
  });
}

export async function setMarketDefaultSchedule(
  marketCode: string,
  openTime: string,
  closeTime: string,
): Promise<DefaultSchedule> {
  return browserHttp.request({
    path: `/api/v1/admin/markets/${marketCode}/default-schedule`,
    method: 'PUT',
    response: 'json',
    body: { open_time: openTime, close_time: closeTime },
    parse: defaultScheduleSchema.parse,
  });
}

export async function listMarketOverrides(
  marketCode: string,
): Promise<ScheduleOverride[]> {
  return browserHttp.request({
    path: `/api/v1/admin/markets/${marketCode}/schedule-overrides`,
    method: 'GET',
    response: 'json',
    parse: z.array(scheduleOverrideSchema).parse,
  });
}

export const registrationOutSchema = z.object({
  user_id: z.string(),
  account_status: z.string(),
});
export type RegistrationOut = z.infer<typeof registrationOutSchema>;

export async function createMarketOverride(
  marketCode: string,
  data: {
    date: string;
    closed: boolean;
    open_time?: string | null;
    close_time?: string | null;
  },
): Promise<ScheduleOverride> {
  return browserHttp.request({
    path: `/api/v1/admin/markets/${marketCode}/schedule-overrides`,
    method: 'POST',
    response: 'json',
    body: data,
    parse: scheduleOverrideSchema.parse,
  });
}

export async function deleteMarketOverride(
  marketCode: string,
  overrideId: string,
): Promise<void> {
  return browserHttp.request({
    path: `/api/v1/admin/markets/${marketCode}/schedule-overrides/${overrideId}`,
    method: 'DELETE',
    response: 'empty',
  });
}

export async function createAdministrator(
  body: AdminCreateAdminIn,
): Promise<RegistrationOut> {
  return browserHttp.request({
    path: '/api/v1/admin/users/administrators',
    method: 'POST',
    response: 'json',
    body,
    parse: registrationOutSchema.parse,
  });
}
