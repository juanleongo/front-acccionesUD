import { z } from 'zod';
const text = z.string();
const nullable = text.nullable();
const money = z.union([z.string(), z.number().finite()]).transform(String);
const person = z.object({ id: text, name: text });
export const reputationSchema = z.object({
  broker_id: text,
  name: text,
  average: money.nullable(),
  reviews_count: z.number(),
  converted_proposals: z.number(),
  distinct_investors: z.number(),
  years_experience: z.number(),
  broker_since: text,
});
export const brokerSchema = z.object({
  id: text,
  name: text,
  firm_name: text,
  specialty: text,
  years_experience: z.number(),
  certifications: z.array(text),
  description: text.optional(),
  reputation: reputationSchema,
});
export const linkSchema = z.object({
  id: text,
  investor_id: text,
  broker_id: text,
  broker: person.extend({ firm_name: text }),
  status: z.enum([
    'requested',
    'active',
    'declined',
    'canceled',
    'expired',
    'ended',
  ]),
  requested_at: text,
  expires_at: text,
  responded_at: nullable,
  started_at: nullable,
  ended_at: nullable,
  decline_reason: nullable,
  end_reason: nullable,
  consent_version: text,
  consent_accepted_at: text,
  order_review_enabled: z.boolean(),
});
export const authorizationSchema = z.object({
  id: text,
  link_id: text,
  consent_version: text,
  granted_at: text,
  revoked_at: nullable,
  revoke_reason: z.enum(['investor', 'link_ended']).nullable(),
});
export const currentLinkSchema = z.object({
  link: linkSchema.nullable(),
  trading_authorization: authorizationSchema.nullable(),
  pending_broker_selection: z.boolean(),
  suggestions: z.array(brokerSchema),
});
const proposalBase = z.object({
  id: text,
  link_id: text,
  status: z.enum([
    'sent',
    'accepted',
    'rejected',
    'withdrawn',
    'approved',
    'declined_by_broker',
    'conversion_failed',
    'expired',
  ]),
  status_reason: nullable,
  current_version: z.number().int(),
  accepted_version: z.number().nullable(),
  order_id: nullable,
  failure_code: nullable,
  broker: person,
  investor: person,
  created_at: text,
  updated_at: text,
  expires_at: text,
});
const content = z.object({
  symbol: text,
  side: z.enum(['buy', 'sell']),
  qty: money,
  type: z.enum(['market', 'limit']),
  estimated_cost: money,
});
export const proposalSchema = proposalBase.extend(content.shape);
export const proposalDetailSchema = proposalBase.extend({
  versions: z.array(
    content.extend({
      version: z.number().int(),
      limit_price: money.nullable(),
      reference_price: money,
      created_at: text,
    }),
  ),
  decisions: z.array(
    z.object({
      id: text,
      version: z.number(),
      actor_role: text,
      decision: text,
      comment: text,
      evidence_text: text,
      at: text,
    }),
  ),
});
export const messageSchema = z.object({
  id: text,
  proposal_id: text,
  author_id: text,
  body: text,
  created_at: text,
});
export const reviewSchema = z.object({
  stars: z.number().int().min(1).max(5),
  comment: text,
  created_at: text,
  updated_at: text,
});
export const requestSchema = z.object({
  id: text,
  investor_id: text,
  investor_name: text,
  requested_at: text,
});
export const clientSchema = z.object({
  investor_id: text,
  name: text,
  link_id: text,
  since: text,
  trading_authorized: z.boolean(),
  order_review_enabled: z.boolean(),
});
export const profileInput = z.object({
  specialty: text.trim().min(1).max(100),
  years_experience: z.number().int().min(0).max(60),
  certifications: z.array(text.trim().min(1).max(100)).max(10),
  description: text.max(1000),
});
export type ProfileInput = z.infer<typeof profileInput>;
export const orderSchema = z.object({
  id: text,
  symbol: text,
  side: text,
  qty: money,
  type: text,
  status: text,
  limit_price: money.nullable(),
  estimated_amount: money,
  created_at: text,
});
export const positionsSchema = z.object({
  positions: z.array(
    z.object({
      symbol: text,
      qty: money,
      market_value: money,
      unrealized_pnl: money,
    }),
  ),
  currency: z.literal('USD'),
});
export const pageSchema = <T extends z.ZodType>(item: T) =>
  z.object({ items: z.array(item), next_cursor: text.nullable() });
