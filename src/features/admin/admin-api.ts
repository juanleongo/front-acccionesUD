import { formatPersonName } from '@/lib/format-person-name';
import { z } from 'zod';
import { browserHttp } from '@/lib/api/client';

export {
  defaultSystemPermissions,
  defaultSystemRoles,
  initialAuditLogs,
  initialManagedUsers,
  initialMarketOverrides,
  initialPendingBrokers,
  type ManagedUserItem,
  type PendingBrokerItem,
} from './admin-mock';

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
  investor_assignment: roleAssignmentSchema.optional(),
});
export type BrokerActivation = z.infer<typeof brokerActivationSchema>;

export const userDirectoryEntrySchema = z.object({
  user_id: z.string(),
  email: z.string(),
  first_names: z.string(),
  last_names: z.string(),
  phone: z.string().nullable(),
  country: z.string().nullable(),
  account_status: z.string(),
  is_premium: z.boolean(),
  roles: z.array(z.string()),
  broker_requested: z.boolean(),
  registered_at: z.string(),
  kyc_link_state: z.enum(['none', 'unlinked', 'linked']),
  kyc_alpaca_account_id: z.string().nullable(),
  kyc_status: z.string().nullable(),
  kyc_status_updated_at: z.string().nullable().optional(),
  kyc_status_checked_at: z.string().nullable().optional(),
});
export type UserDirectoryEntry = z.infer<typeof userDirectoryEntrySchema>;

export const userDirectoryPageSchema = z.object({
  items: z.array(userDirectoryEntrySchema),
  total: z.number(),
  limit: z.number(),
  offset: z.number(),
});
export type UserDirectoryPage = z.infer<typeof userDirectoryPageSchema>;

export const kycReconcileOutSchema = z.object({
  user_id: z.string(),
  alpaca_account_id: z.string(),
  status: z.string().nullable(),
  outcome: z.enum(['linked', 'already_linked']),
});
export type KycReconcileOut = z.infer<typeof kycReconcileOutSchema>;

export const auditEntrySchema = z.object({
  id: z.string(),
  actor_user_id: z.string(),
  action: z.string(),
  target_type: z.string(),
  target_id: z.string(),
  payload: z.record(z.string(), z.unknown()),
  occurred_at: z.string(),
});
export type AuditEntry = z.infer<typeof auditEntrySchema>;

export const auditLogPageSchema = z.object({
  items: z.array(auditEntrySchema),
  total: z.number(),
  limit: z.number(),
  offset: z.number(),
});
export type AuditLogPage = z.infer<typeof auditLogPageSchema>;

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

export const registrationOutSchema = z.object({
  user_id: z.string(),
  account_status: z.string(),
});
export type RegistrationOut = z.infer<typeof registrationOutSchema>;

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

export async function clearMarketDefaultSchedule(
  marketCode: string,
): Promise<void> {
  return browserHttp.request({
    path: `/api/v1/admin/markets/${marketCode}/default-schedule`,
    method: 'DELETE',
    response: 'empty',
  });
}

export async function updateMarketOverride(
  marketCode: string,
  overrideId: string,
  data: {
    closed: boolean;
    open_time?: string | null;
    close_time?: string | null;
  },
): Promise<ScheduleOverride> {
  return browserHttp.request({
    path: `/api/v1/admin/markets/${marketCode}/schedule-overrides/${overrideId}`,
    method: 'PUT',
    response: 'json',
    body: data,
    parse: scheduleOverrideSchema.parse,
  });
}

export async function getAdminUsersDirectory(
  signal?: AbortSignal,
): Promise<UserDirectoryPage> {
  return browserHttp.request({
    path: '/api/v1/admin/users',
    method: 'GET',
    response: 'json',
    parse: userDirectoryPageSchema.parse,
    ...(signal ? { signal } : {}),
  });
}

export async function getAdminUserDetail(
  userId: string,
): Promise<UserDirectoryEntry> {
  return browserHttp.request({
    path: `/api/v1/admin/users/${encodeURIComponent(userId)}`,
    method: 'GET',
    response: 'json',
    parse: userDirectoryEntrySchema.parse,
  });
}

export async function reconcileUserKyc(
  userId: string,
  alpacaAccountId?: string | null,
): Promise<KycReconcileOut> {
  return browserHttp.request({
    path: `/api/v1/admin/kyc/${encodeURIComponent(userId)}/reconcile`,
    method: 'POST',
    response: 'json',
    body: alpacaAccountId ? { alpaca_account_id: alpacaAccountId } : {},
    parse: kycReconcileOutSchema.parse,
  });
}

export async function addRolePermission(
  role: string,
  permissionCode: string,
): Promise<RoleOut> {
  return browserHttp.request({
    path: `/api/v1/admin/roles/${encodeURIComponent(role)}/permissions`,
    method: 'POST',
    response: 'json',
    body: { permission_code: permissionCode },
    parse: roleOutSchema.parse,
  });
}

export async function removeRolePermission(
  role: string,
  permissionCode: string,
): Promise<RoleOut> {
  return browserHttp.request({
    path: `/api/v1/admin/roles/${encodeURIComponent(role)}/permissions/${encodeURIComponent(permissionCode)}`,
    method: 'DELETE',
    response: 'json',
    parse: roleOutSchema.parse,
  });
}

export async function getAdminAuditLog(
  action?: string,
  signal?: AbortSignal,
): Promise<AuditLogPage> {
  return browserHttp.request({
    path: '/api/v1/admin/audit-log',
    method: 'GET',
    ...(action ? { query: { action } } : {}),
    response: 'json',
    parse: auditLogPageSchema.parse,
    ...(signal ? { signal } : {}),
  });
}

export async function createAdministrator(
  body: AdminCreateAdminIn,
): Promise<RegistrationOut> {
  return browserHttp.request({
    path: '/api/v1/admin/users/administrators',
    method: 'POST',
    response: 'json',
    body: {
      ...body,
      first_names: formatPersonName(body.first_names),
      last_names: formatPersonName(body.last_names),
      terms_accepted: true,
      monthly_report: false,
      interests: [],
      investor_level: null,
      broker_requested: false,
      premium_requested: false,
    },
    parse: registrationOutSchema.parse,
  });
}
