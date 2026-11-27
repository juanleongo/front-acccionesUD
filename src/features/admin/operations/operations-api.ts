'use client';

import { z } from 'zod';
import { browserHttp } from '@/lib/api/client';

// M07 contracts verified against the backend HTTP schemas; backend remains read-only.
export const decimal = z.union([
  z.string().regex(/^-?\d+(?:\.\d+)?$/),
  z.number().finite(),
]);
export const record = z.record(z.string(), z.unknown());
export const pageOf = <T extends z.ZodType>(item: T) =>
  z.object({
    items: z.array(item),
    next_cursor: z.string().nullable().optional(),
  });
export const feeSchema = z.object({
  id: z.string(),
  scope: z.string(),
  version_no: z.number().int(),
  commission_rate_pct: decimal,
  platform_share_pct: decimal,
  broker_share_pct: decimal,
  effective_from: z.string(),
  status: z.enum(['scheduled', 'in_force', 'superseded', 'canceled']),
  reason: z.string(),
  created_at: z.string(),
});
const terms = z.object({
  fee_version_id: z.string().nullable(),
  commission_rate_pct: decimal,
  platform_share_pct: decimal,
});
export const feeMatrixSchema = z.object({
  items: z.array(
    z.object({
      scope: z.string(),
      terms,
      current: feeSchema,
      origin: z.string(),
      scheduled: z.array(feeSchema),
    }),
  ),
});
export const haltSchema = z.object({
  id: z.string(),
  scope: z.string(),
  status: z.enum(['scheduled', 'active', 'released', 'expired']),
  reason: z.string(),
  starts_at: z.string(),
  ends_at: z.string().nullable(),
});
const totals = z.object({
  commission: decimal,
  platform_share: decimal,
  broker_share: decimal,
});
export const commissionSchema = z.object({
  execution_id: z.string(),
  order_id: z.string(),
  user_id: z.string(),
  investor_name: z.string().optional(),
  symbol: z.string(),
  exchange: z.string(),
  side: z.enum(['buy', 'sell']),
  qty: decimal,
  price: decimal,
  gross_amount: decimal,
  commission: decimal.nullable(),
  platform_share: decimal.nullable(),
  broker_share: decimal.nullable(),
  executed_at: z.string(),
  commission_status: z.enum(['official', 'historical_terms_unknown']),
});
export const commissionsSchema = pageOf(commissionSchema).extend({
  totals: totals.extend({
    gross_amount: decimal,
    historical_terms_unknown_count: z.number(),
    complete: z.boolean(),
  }),
  by_market: z.record(z.string(), totals),
  by_broker: z.record(z.string(), totals),
});
export const restrictionSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  status: z.enum(['active', 'lifted']),
  reason: z.string(),
  evidence_text: z.string(),
  restricted_at: z.string(),
  lifted_at: z.string().nullable(),
});
export const atypicalSchema = z.object({
  event_id: z.string(),
  user_id: z.string(),
  at: z.string(),
  reasons: z.array(z.string()),
  observed: record,
  references: z.array(z.string()),
  rules_version: z.string(),
});
export const reportSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  period_from: z.string(),
  period_to: z.string(),
  rules_version: z.string(),
  content: record,
  content_sha256: z.string(),
  generated_at: z.string(),
});
export const trailSchema = z.object({
  source: z.string(),
  event_id: z.string(),
  occurred_at: z.string(),
  actor_type: z.string(),
  actor_id: z.string().nullable(),
  subject_user_id: z.string().nullable(),
  action: z.string(),
  entity_type: z.string(),
  entity_id: z.string().nullable(),
  from_state: z.string().nullable(),
  to_state: z.string().nullable(),
  details: record,
});
export const custodySchema = z.object({
  order: z
    .object({
      id: z.string(),
      user_id: z.string(),
      symbol: z.string(),
      side: z.string(),
      status: z.string(),
      qty: decimal,
      filled_qty: decimal,
      filled_avg_price: decimal.nullable(),
      created_at: z.string(),
    })
    .passthrough(),
  events: z.array(record),
  executions: z.array(record),
  cancel_requests: z.array(record),
  reauthorizations: z.array(record),
  proposals: z.array(record),
  created_by: z.string().nullable(),
  signed_by: z.string().nullable(),
  signed_at: z.string().nullable(),
  authorization_method: z.string().nullable(),
  first_submitted_at: z.string().nullable(),
});
export const marketSchema = z.object({
  code: z.string(),
  name: z.string(),
  timezone: z.string(),
  default_schedule: record.nullable(),
  overrides: z.array(record),
  commission_terms: terms,
  fee_origin: z.string(),
  trading_halts: z.array(haltSchema),
});
export const scheduleSchema = z.object({
  id: z.string(),
  action: z.string(),
  occurred_at: z.string(),
  effective_from: z.string(),
  before: record.nullable(),
  after: record.nullable(),
  dispatch_status: z.enum(['pending', 'dispatched']),
  affected_orders: z.number().nullable(),
  notified_users: z.number().nullable(),
});
const metric = z
  .object({
    value: decimal,
    unit: z.string(),
    definition: z.string(),
    complete: z.boolean().optional(),
  })
  .passthrough();
export const kpiSchema = z.object({
  period: record,
  definitions_version: z.string(),
  computed_at: z.string(),
  as_of: z.string(),
  cache_hit: z.boolean(),
  stale: z.boolean(),
  metrics: z.record(z.string(), metric),
});
export function adminRead<T>(
  path: string,
  schema: z.ZodType<T>,
  params: Record<string, string> = {},
  signal?: AbortSignal,
) {
  const query = Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== ''),
  );
  return browserHttp.request({
    path: `/api/v1${path}`,
    query,
    response: 'json',
    parse: schema.parse,
    ...(signal ? { signal } : {}),
  });
}
export function adminWrite<T>(
  path: string,
  body: Record<string, unknown>,
  schema: z.ZodType<T>,
) {
  return browserHttp.request({
    path: `/api/v1${path}`,
    method: 'POST',
    body,
    response: 'json',
    parse: schema.parse,
  });
}
