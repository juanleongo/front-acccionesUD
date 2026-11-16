'use client';

import { z } from 'zod';
import { browserHttp } from '@/lib/api/client';
import type {
  OrderPreview,
  OrderRecord,
  OrderSide,
  OrderStatus,
  OrderType,
  TimeInForce,
} from './trading-mock';

const previewOutSchema = z.object({
  reference_price: z.string(),
  estimated_amount: z.string(),
  reference_commission: z.string(),
  reference_commission_estimated: z.boolean().optional(),
  available_buying_power: z.string(),
  requires_extra_authorization: z.boolean(),
  authorization_method: z.enum(['none', 'totp', 'acknowledgement']),
  market_open: z.boolean(),
  scheduled_for: z.string().nullable(),
});

const orderSummarySchema = z.object({
  id: z.string(),
  status: z.string(),
  created_at: z.string(),
  symbol: z.string(),
  exchange: z.string().optional(),
  side: z.enum(['buy', 'sell']),
  qty: z.string(),
  filled_avg_price: z.string().nullable().optional(),
  type: z.string(),
  time_in_force: z.string(),
  limit_price: z.string().nullable().optional(),
  stop_price: z.string().nullable().optional(),
  reference_price: z.string(),
  estimated_amount: z.string(),
});

const orderPageOutSchema = z.object({
  items: z.array(orderSummarySchema),
  next_cursor: z.string().nullable().optional(),
});

function mapBackendStatus(status: string): OrderStatus {
  const upper = status.toUpperCase();
  if (upper === 'FILLED' || upper === 'EXECUTED' || upper === 'COMPLETED')
    return 'FILLED';
  if (
    upper === 'SCHEDULED' ||
    upper === 'QUEUED' ||
    upper === 'QUEUED_OUT_OF_HOURS'
  )
    return 'QUEUED_OUT_OF_HOURS';
  if (
    upper === 'AWAITING_REAUTHORIZATION' ||
    upper === 'REAUTHORIZATION_REQUIRED'
  )
    return 'REAUTHORIZATION_REQUIRED';
  if (
    upper === 'CANCELLED' ||
    upper === 'CANCELED' ||
    upper === 'REJECTED' ||
    upper === 'EXPIRED'
  )
    return 'CANCELLED';
  return 'OPEN';
}

function mapBackendType(type: string): OrderType {
  if (type === 'limit') return 'limit';
  if (type === 'stop' || type === 'stop_limit') return 'stop_loss';
  if (type === 'trailing_stop') return 'take_profit';
  return 'market';
}

function mapOrderSummaryToRecord(
  item: z.infer<typeof orderSummarySchema>,
): OrderRecord {
  const tifUpper = item.time_in_force.toUpperCase();
  const tif: TimeInForce =
    tifUpper === 'GTC' ? 'GTC' : tifUpper === 'IOC' ? 'IOC' : 'DAY';
  return {
    id: item.id,
    client_order_id: item.id.slice(0, 12),
    symbol: item.symbol,
    side: item.side,
    order_type: mapBackendType(item.type),
    time_in_force: tif,
    quantity: Number(item.qty) || 1,
    execution_price_usd: item.filled_avg_price
      ? Number(item.filled_avg_price)
      : null,
    limit_price_usd: item.limit_price ? Number(item.limit_price) : null,
    stop_price_usd: item.stop_price ? Number(item.stop_price) : null,
    total_usd: Number(item.estimated_amount) || 0,
    status: mapBackendStatus(item.status),
    execution_source: 'Alpaca Sandbox (US)',
    created_at: new Date(item.created_at).toLocaleString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }),
  };
}

function buildBackendOrderPayload(params: {
  symbol: string;
  side: OrderSide;
  orderType: OrderType;
  quantity: number;
  timeInForce: TimeInForce;
  limitPrice?: string | undefined;
  stopPrice?: string | undefined;
  scheduleIfClosed: boolean;
  confirmed: boolean;
}) {
  const isBracketStop = params.orderType === 'stop_loss';
  const isBracketTp = params.orderType === 'take_profit';
  return {
    symbol: params.symbol,
    side: params.side,
    qty: String(params.quantity),
    type:
      params.orderType === 'limit'
        ? 'limit'
        : isBracketStop
          ? 'stop'
          : 'market',
    order_class: isBracketTp ? 'bracket' : 'simple',
    time_in_force: params.timeInForce.toLowerCase(),
    ...(params.orderType === 'limit' && params.limitPrice
      ? { limit_price: String(Number(params.limitPrice).toFixed(2)) }
      : {}),
    ...(isBracketStop && params.stopPrice
      ? { stop_price: String(Number(params.stopPrice).toFixed(2)) }
      : {}),
    ...(isBracketTp && params.stopPrice
      ? {
          take_profit: {
            limit_price: String(Number(params.stopPrice).toFixed(2)),
          },
        }
      : {}),
    schedule_if_closed: params.scheduleIfClosed,
    confirmed: params.confirmed,
    high_amount_acknowledged: true,
  };
}

export async function fetchOrdersList(
  signal?: AbortSignal,
): Promise<OrderRecord[]> {
  const page = await browserHttp.request({
    path: '/api/v1/orders',
    method: 'GET',
    response: 'json',
    parse: orderPageOutSchema.parse,
    ...(signal ? { signal } : {}),
  });
  return page.items.map(mapOrderSummaryToRecord);
}

export async function requestOrderPreview(params: {
  symbol: string;
  side: OrderSide;
  orderType: OrderType;
  quantity: number;
  timeInForce: TimeInForce;
  limitPrice?: string | undefined;
  stopPrice?: string | undefined;
  scheduleIfClosed: boolean;
  ttlSeconds: number;
}): Promise<OrderPreview> {
  const res = await browserHttp.request({
    path: '/api/v1/orders/preview',
    method: 'POST',
    body: buildBackendOrderPayload({ ...params, confirmed: false }),
    response: 'json',
    parse: previewOutSchema.parse,
  });
  const refPrice = Number(res.reference_price) || 0;
  const subtotal = Number(res.estimated_amount) || refPrice * params.quantity;
  const commission = Number(res.reference_commission) || subtotal * 0.02;
  const platformFee = Number((commission * 0.6).toFixed(2));
  const advisorFee = Number((commission * 0.4).toFixed(2));
  const total =
    params.side === 'buy' ? subtotal + commission : subtotal - commission;

  return {
    preview_id: `prv-${Date.now().toString(36)}`,
    symbol: params.symbol,
    side: params.side,
    order_type: params.orderType,
    quantity: params.quantity,
    quoted_price_usd: refPrice,
    limit_price_usd:
      params.orderType === 'limit' && params.limitPrice
        ? Number(params.limitPrice)
        : null,
    stop_price_usd:
      (params.orderType === 'stop_loss' ||
        params.orderType === 'take_profit') &&
      params.stopPrice
        ? Number(params.stopPrice)
        : null,
    subtotal_usd: subtotal,
    platform_fee_usd: platformFee,
    advisor_fee_usd: advisorFee,
    total_usd: total,
    expires_at_ms: Date.now() + params.ttlSeconds * 1000,
    ttl_seconds: params.ttlSeconds,
    market_open: res.market_open,
    available_buying_power_usd: Number(res.available_buying_power) || 0,
    from_backend: true,
  };
}

export async function createBackendOrder(params: {
  symbol: string;
  side: OrderSide;
  orderType: OrderType;
  quantity: number;
  timeInForce: TimeInForce;
  limitPrice?: string | undefined;
  stopPrice?: string | undefined;
  scheduleIfClosed: boolean;
  idempotencyKey: string;
}): Promise<OrderRecord> {
  const res = await browserHttp.request({
    path: '/api/v1/orders',
    method: 'POST',
    headers: { 'Idempotency-Key': params.idempotencyKey },
    body: buildBackendOrderPayload({ ...params, confirmed: true }),
    response: 'json',
    parse: orderSummarySchema.parse,
  });
  return mapOrderSummaryToRecord(res);
}

export async function cancelBackendOrder(
  orderId: string,
): Promise<OrderRecord> {
  const res = await browserHttp.request({
    path: `/api/v1/orders/${encodeURIComponent(orderId)}/cancel`,
    method: 'POST',
    body: {
      reason: 'no_longer_needed',
      confirmed: true,
    },
    response: 'json',
    parse: orderSummarySchema.parse,
  });
  return mapOrderSummaryToRecord(res);
}

export async function reauthorizeBackendOrder(
  orderId: string,
  decision: 'accept' | 'reject',
): Promise<OrderRecord> {
  const res = await browserHttp.request({
    path: `/api/v1/orders/${encodeURIComponent(orderId)}/reauthorization`,
    method: 'POST',
    body: { decision },
    response: 'json',
    parse: orderSummarySchema.parse,
  });
  return mapOrderSummaryToRecord(res);
}
