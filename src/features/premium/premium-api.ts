'use client';
import { z } from 'zod';
import { browserHttp } from '@/lib/api/client';
const money = z
  .union([z.string().regex(/^\d+(\.\d+)?$/), z.number().nonnegative().finite()])
  .transform(String);
export const planSchema = z.object({
  code: z.enum(['monthly', 'annual']),
  price: money,
  currency: z.string(),
  interval: z.string(),
});
export const subscriptionSchema = z.object({
  id: z.string(),
  plan: z.enum(['monthly', 'annual']),
  status: z.string(),
  current_period_start: z.string().nullable(),
  current_period_end: z.string().nullable(),
  cancel_at_period_end: z.boolean(),
  cancel_reason: z.string().nullable(),
  cancel_requested_at: z.string().nullable(),
});
export const paymentSchema = z.object({
  id: z.string(),
  stripe_invoice_id: z.string(),
  plan: z.string(),
  amount: money,
  currency: z.string(),
  period_start: z.string().nullable(),
  period_end: z.string().nullable(),
  result: z.enum(['paid', 'failed']),
  occurred_at: z.string(),
});
export const currentSchema = z.object({
  subscription: subscriptionSchema.nullable(),
  plan: planSchema.nullable(),
  latest_payment: paymentSchema.nullable(),
  next_charge_at: z.string().nullable(),
});
export const paymentsSchema = z.object({
  items: z.array(paymentSchema),
  next_cursor: z.string().nullable(),
});
export const watchlistSchema = z.object({
  id: z.string(),
  name: z.string(),
  symbols: z.array(z.string()),
});
export const alertSchema = z.object({
  id: z.string(),
  symbol: z.string(),
  comparator: z.string(),
  threshold: money,
  status: z.string(),
  created_at: z.string().nullable(),
  triggered_at: z.string().nullable(),
});
export const entitlementSchema = z.object({
  user_id: z.string(),
  is_premium: z.boolean(),
  roles: z.array(z.string()),
});
export const checkoutSchema = z.object({
  checkout_session_id: z.string(),
  url: z.url().refine((value) => {
    const u = new URL(value);
    return (
      u.protocol === 'https:' &&
      u.hostname === 'checkout.stripe.com' &&
      !u.username &&
      !u.password
    );
  }, 'Invalid Stripe checkout URL'),
});
export function premiumRequest<T>(
  path: string,
  schema: z.ZodType<T>,
  method: 'GET' | 'POST' | 'DELETE' = 'GET',
  body?: unknown,
  query?: Record<string, string>,
  signal?: AbortSignal,
) {
  return browserHttp.request({
    path: `/api/v1/${path}`,
    method,
    response: 'json',
    parse: schema.parse,
    ...(body === undefined ? {} : { body }),
    ...(query ? { query } : {}),
    ...(signal ? { signal } : {}),
  });
}
export const startCheckout = (plan: 'monthly' | 'annual') =>
  premiumRequest('subscriptions/checkout', checkoutSchema, 'POST', { plan });
export const cancelSubscription = (reason: string) =>
  premiumRequest('subscriptions/me/cancel', subscriptionSchema, 'POST', {
    reason: z.string().trim().min(1).max(500).parse(reason),
  });
export const deleteAlert = (id: string) =>
  browserHttp.request({
    path: `/api/v1/price-alerts/${id}`,
    method: 'DELETE',
    response: 'empty',
  });
