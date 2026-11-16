import { z } from 'zod';
import { browserHttp } from '@/lib/api/client';

export const userProfileSchema = z.object({
  user_id: z.string(),
  first_names: z.string(),
  last_names: z.string(),
  email: z.string(),
  phone: z.string(),
  country: z.string(),
  account_status: z.string(),
  registered_at: z.string(),
  contracted_plan: z.string().nullable().optional(),
  is_premium: z.boolean(),
  broker_requested: z.boolean().optional(),
  associated_broker: z.string().nullable().optional(),
  roles: z.array(z.string()),
  kyc_status: z.string().nullable(),
  kyc_status_unavailable: z.boolean(),
  interests: z.array(z.string()),
  investor_level: z.string().nullable(),
  mfa_enrolled: z.boolean(),
});

export type UserProfile = z.infer<typeof userProfileSchema>;

export function getCurrentUser(signal: AbortSignal) {
  return browserHttp.request({
    path: '/api/v1/users/me',
    response: 'json',
    signal,
    parse: userProfileSchema.parse,
  });
}

export function logoutCurrentSession() {
  return browserHttp.request({
    path: '/api/v1/auth/logout',
    method: 'POST',
    response: 'empty',
  });
}

export const interestsInSchema = z.object({
  interests: z.array(z.string().min(1).max(50)).min(1).max(20),
  level: z.enum(['beginner', 'experienced']),
});

export type InterestsIn = z.infer<typeof interestsInSchema>;

export function updateUserInterests(body: InterestsIn) {
  return browserHttp.request({
    path: '/api/v1/users/me/interests',
    method: 'PUT',
    response: 'json',
    body,
    parse: interestsInSchema.parse,
  });
}

export const kycStatusSchema = z.object({
  has_account: z.boolean(),
  status: z.string().nullable(),
  status_updated_at: z.string().nullable().optional(),
  can_trade: z.boolean().optional(),
  stale: z.boolean().optional(),
});

export type KycStatus = z.infer<typeof kycStatusSchema>;

export function fetchKycStatus(signal?: AbortSignal) {
  return browserHttp.request({
    path: '/api/v1/kyc/status',
    method: 'GET',
    response: 'json',
    parse: kycStatusSchema.parse,
    ...(signal ? { signal } : {}),
  });
}

export function submitKycApplication(body: Record<string, unknown>) {
  return browserHttp.request({
    path: '/api/v1/kyc/account',
    method: 'POST',
    body,
    response: 'json',
    parse: z.object({ alpaca_account_id: z.string(), status: z.string() })
      .parse,
  });
}
