'use client';
import { z } from 'zod';
import { browserHttp } from '@/lib/api/client';

const decimal = z.string().regex(/^-?\d+(?:\.\d+)?$/);
export const orderSchema = z.object({
  id: z.string(),
  status: z.string(),
  status_cause: z.string().nullable(),
  provider_status: z.string().nullable(),
  symbol: z.string(),
  exchange: z.string(),
  side: z.enum(['buy', 'sell']),
  qty: decimal,
  filled_qty: decimal,
  filled_avg_price: decimal.nullable(),
  fully_filled: z.boolean(),
  type: z.enum(['market', 'limit', 'stop', 'stop_limit', 'trailing_stop']),
  order_class: z.enum(['simple', 'bracket']),
  time_in_force: z.enum(['day', 'gtc', 'ioc', 'fok']),
  limit_price: decimal.nullable(),
  stop_price: decimal.nullable(),
  trail_price: decimal.nullable(),
  trail_percent: decimal.nullable(),
  reference_price: decimal,
  estimated_amount: decimal,
  created_at: z.string(),
  scheduled_for: z.string().nullable(),
  returned_for_changes: z.boolean(),
});
export const detailSchema = orderSchema.extend({
  reference_commission: decimal,
  legs: z.array(
    z.object({
      role: z.enum(['take_profit', 'stop_loss']),
      price: decimal,
      provider_status: z.string().nullable(),
    }),
  ),
  executions: z.array(
    z.object({
      alpaca_execution_id: z.string(),
      qty: decimal,
      price: decimal,
      executed_at: z.string(),
    }),
  ),
  events: z.array(
    z.object({
      id: z.string(),
      to_status: z.string(),
      cause: z.string(),
      at: z.string(),
    }),
  ),
  reauthorizations: z.array(
    z.object({
      id: z.string(),
      previous_price: decimal,
      updated_price: decimal,
      deadline: z.string(),
      decision: z.string().nullable(),
    }),
  ),
  review_comments: z.array(
    z.object({ id: z.string(), comment: z.string(), at: z.string() }),
  ),
});
export const previewSchema = z.object({
  reference_price: decimal,
  estimated_amount: decimal,
  reference_commission: decimal,
  available_buying_power: decimal,
  requires_extra_authorization: z.boolean(),
  authorization_method: z.enum(['none', 'totp', 'acknowledgement']),
  market_open: z.boolean(),
  scheduled_for: z.string().nullable(),
});
export type ApiOrder = z.infer<typeof orderSchema>;
export type OrderDetail = z.infer<typeof detailSchema>;
export type Preview = z.infer<typeof previewSchema>;
export type OrderInput = {
  symbol: string;
  side: 'buy' | 'sell';
  qty: string;
  type: ApiOrder['type'];
  order_class: 'simple' | 'bracket';
  time_in_force: ApiOrder['time_in_force'];
  limit_price?: string;
  stop_price?: string;
  trail_price?: string;
  trail_percent?: string;
  take_profit?: { limit_price: string };
  stop_loss?: { stop_price: string };
  schedule_if_closed: boolean;
  confirmed?: boolean;
  high_amount_acknowledged?: boolean;
  totp_code?: string;
};
export async function previewOrder(body: OrderInput) {
  return browserHttp.request({
    path: '/api/v1/orders/preview',
    method: 'POST',
    timeoutMs: 60_000,
    body,
    response: 'json',
    parse: previewSchema.parse,
  });
}
export async function submitOrder(body: OrderInput, key: string) {
  return browserHttp.request({
    path: '/api/v1/orders',
    method: 'POST',
    timeoutMs: 60_000,
    headers: { 'Idempotency-Key': key },
    body,
    response: 'json',
    parse: detailSchema.parse,
  });
}
export async function listOrders(
  cursor = '',
  symbol = '',
  status = '',
  signal?: AbortSignal,
  fromDate = '',
  toDate = '',
) {
  return browserHttp.request({
    path: '/api/v1/orders',
    method: 'GET',
    query: {
      page_size: '10',
      ...(fromDate ? { from: `${fromDate}T00:00:00-05:00` } : {}),
      ...(toDate ? { to: `${toDate}T23:59:59.999999-05:00` } : {}),
      ...(cursor ? { cursor } : {}),
      ...(symbol ? { symbol } : {}),
      ...(status ? { status } : {}),
    },
    response: 'json',
    parse: z.object({
      items: z.array(orderSchema),
      next_cursor: z.string().nullable(),
    }).parse,
    ...(signal ? { signal } : {}),
  });
}
export async function getOrder(id: string, signal?: AbortSignal) {
  return browserHttp.request({
    path: `/api/v1/orders/${encodeURIComponent(id)}`,
    method: 'GET',
    response: 'json',
    parse: detailSchema.parse,
    ...(signal ? { signal } : {}),
  });
}
export async function orderAction(
  id: string,
  action: 'cancel' | 'reauthorization' | 'resubmit' | 'resume',
  body?: object,
) {
  return browserHttp.request({
    path: `/api/v1/orders/${encodeURIComponent(id)}/${action}`,
    method: 'POST',
    timeoutMs: 60_000,
    ...(body ? { body } : {}),
    response: 'json',
    parse: detailSchema.parse,
  });
}
export function resubmitBody(input: OrderInput) {
  const {
    symbol: _symbol,
    side: _side,
    type: _type,
    order_class: _class,
    schedule_if_closed: _schedule,
    confirmed: _confirmed,
    ...changes
  } = input;
  void _symbol;
  void _side;
  void _type;
  void _class;
  void _schedule;
  void _confirmed;
  return changes;
}
export async function listTradingMarkets(signal?: AbortSignal) {
  return browserHttp.request({
    path: '/api/v1/markets',
    method: 'GET',
    response: 'json',
    parse: z.array(z.object({ code: z.string(), name: z.string() })).parse,
    ...(signal ? { signal } : {}),
  });
}
export async function searchAssets(
  q: string,
  page: number,
  signal?: AbortSignal,
  exchange = '',
) {
  return browserHttp.request({
    path: '/api/v1/instruments/search',
    method: 'GET',
    query: {
      q,
      page: String(page),
      classification: 'tradable',
      ...(exchange ? { exchange } : {}),
    },
    response: 'json',
    parse: z.object({
      results: z.array(
        z.object({
          symbol: z.string(),
          name: z.string(),
          exchange: z.string(),
        }),
      ),
      total: z.number(),
      page_size: z.number(),
    }).parse,
    ...(signal ? { signal } : {}),
  });
}
export async function getPositions(signal?: AbortSignal) {
  return browserHttp.request({
    path: '/api/v1/portfolio/positions',
    method: 'GET',
    response: 'json',
    parse: z.object({
      positions: z.array(
        z.object({
          symbol: z.string(),
          qty: decimal,
          reserved_qty: decimal,
          price: decimal,
        }),
      ),
      positions_as_of: z.string(),
    }).parse,
    ...(signal ? { signal } : {}),
  });
}
