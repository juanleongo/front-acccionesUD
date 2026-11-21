'use client';
import { z } from 'zod';
import { browserHttp } from '@/lib/api/client';
const money = z
  .string()
  .regex(/^[+-]?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?$/)
  .refine((value) => Number.isFinite(Number(value)), 'Decimal fuera de rango');
export const positionsSchema = z.object({
  positions: z.array(
    z.object({
      symbol: z.string(),
      exchange: z.string(),
      sector: z.string().nullable(),
      qty: money,
      reserved_qty: money,
      price: money,
      price_source: z.enum(['market_data', 'alpaca_position']),
      average_cost: money,
      market_value: money,
      cost_basis: money,
      unrealized_pnl: money,
      reconciliation_mismatch: z.boolean(),
    }),
  ),
  totals: z.object({
    market_value: money,
    cost_basis: money,
    unrealized_pnl: money,
  }),
  view_type: z.enum(['table', 'cards', 'chart']),
  positions_as_of: z.string(),
  currency: z.literal('USD'),
});
const execution = z.object({
  execution_id: z.string(),
  order_id: z.string(),
  symbol: z.string(),
  exchange: z.string(),
  side: z.enum(['buy', 'sell']),
  qty: money,
  price: money,
  executed_at: z.string(),
  commission: money,
  commission_source: z.enum(['reference', 'official']),
});
const share = z.object({ key: z.string(), volume: money, percentage: money });
const statistics = z.object({
  execution_count: z.number(),
  buy_count: z.number(),
  sell_count: z.number(),
  volume: money,
  by_market: z.array(share),
  by_instrument: z.array(share),
  by_sector: z.array(share),
});
const risk = z.object({
  window_days: z.number(),
  f: money,
  c: money,
  e: money,
  t: money,
  risk_score: money.nullable(),
  classification: z.enum([
    'conservative',
    'moderate',
    'aggressive',
    'insufficient_data',
  ]),
  equity_unavailable: z.boolean(),
  metrics: z.object({
    execution_count: z.number(),
    executions_per_week: money,
    volume: money,
    markets: z.array(z.string()),
    instruments: z.array(z.string()),
    asset_distribution: z.record(z.string(), money),
    window_from: z.string(),
    window_to: z.string(),
  }),
});
const report = z.object({
  id: z.string(),
  owner_id: z.string(),
  owner_role: z.enum(['investor', 'broker']),
  type: z.enum(['on_demand', 'daily_summary', 'monthly', 'broker']),
  period: z.object({ from: z.string(), to: z.string() }),
  positions_as_of: z.string(),
  generated_at: z.string(),
  notified_at: z.string().nullable(),
  content: z.record(z.string(), z.unknown()).optional(),
});
function read<T>(
  path: string,
  schema: z.ZodType<T>,
  signal?: AbortSignal,
  query: Record<string, string> = {},
) {
  return browserHttp.request({
    path: '/api/v1/portfolio/' + path,
    method: 'GET',
    query,
    response: 'json',
    parse: schema.parse,
    timeoutMs: 60000,
    ...(signal ? { signal } : {}),
  });
}
export function fetchPortfolioPositions(signal?: AbortSignal) {
  return read('positions', positionsSchema, signal);
}
export function fetchPortfolioExecutions(
  from: string,
  to: string,
  symbol: string,
  cursor: string,
  signal?: AbortSignal,
) {
  return read(
    'executions',
    z.object({ items: z.array(execution), next_cursor: z.string().nullable() }),
    signal,
    {
      from,
      to,
      page_size: '10',
      ...(symbol ? { symbol } : {}),
      ...(cursor ? { cursor } : {}),
    },
  );
}
export function fetchPortfolioStatistics(
  from: string,
  to: string,
  signal?: AbortSignal,
) {
  return read('statistics', statistics, signal, { from, to });
}
export function fetchPortfolioRiskProfile(signal?: AbortSignal) {
  return read('risk-profile', risk, signal);
}
export function fetchPortfolioReports(cursor: string, signal?: AbortSignal) {
  return read(
    'reports',
    z.object({ items: z.array(report), next_cursor: z.string().nullable() }),
    signal,
    { page_size: '10', ...(cursor ? { cursor } : {}) },
  );
}
export function fetchPortfolioReport(id: string, signal?: AbortSignal) {
  return read('reports/' + encodeURIComponent(id), report, signal);
}
export function createPortfolioReport(from: string, to: string) {
  return browserHttp.request({
    path: '/api/v1/portfolio/reports',
    method: 'POST',
    body: { from, to },
    response: 'json',
    parse: report.parse,
    timeoutMs: 60000,
  });
}
