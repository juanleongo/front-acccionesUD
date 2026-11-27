/** Isolated examples for /vista-previa. Never import into an API-backed dashboard. */
import type {
  ChannelPreference,
  CommissionSummary,
  InstrumentSummary,
  OrderPreferences,
  PaymentSummary,
  PlanSummary,
  PortfolioPreferences,
  PriceAlertSummary,
  SessionSummary,
  SubscriptionSummary,
  WatchlistSummary,
} from './types';

export const catalog: readonly InstrumentSummary[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', exchange: 'NASDAQ' },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', exchange: 'NYSE' },
];
export const lists: readonly WatchlistSummary[] = [
  {
    id: 'preview-technology',
    name: 'Tecnología / Technology',
    instruments: catalog.slice(0, 2),
  },
  {
    id: 'preview-finance',
    name: 'Finanzas / Finance',
    instruments: catalog.slice(2),
  },
  {
    id: 'preview-empty',
    name: 'Mi próxima idea / My next idea',
    instruments: [],
  },
];
export const alerts: readonly PriceAlertSummary[] = [
  {
    id: 'preview-alert-1',
    symbol: 'AAPL',
    comparator: 'above',
    threshold: '200.00',
    status: 'active',
  },
  {
    id: 'preview-alert-2',
    symbol: 'NVDA',
    comparator: 'below',
    threshold: '150.00',
    status: 'triggered',
  },
  {
    id: 'preview-alert-3',
    symbol: 'JPM',
    comparator: 'crosses',
    threshold: '230.00',
    status: 'inactive',
  },
];
export const sessions: readonly SessionSummary[] = [
  {
    id: 'preview-current',
    agent: 'Chrome · Windows',
    ip: '192.0.2.10',
    createdAt: '2026-11-27T13:00:00Z',
    lastUsedAt: '2026-11-27T15:40:00Z',
    current: true,
  },
  {
    id: 'preview-other',
    agent: 'Safari · iPhone',
    ip: '198.51.100.24',
    createdAt: '2026-11-25T13:00:00Z',
    lastUsedAt: '2026-11-26T23:10:00Z',
    current: false,
  },
];
export const channels: readonly ChannelPreference[] = [
  { event_type: 'price_changes', channel: 'in_app', enabled: true },
  { event_type: 'order_executions', channel: 'email', enabled: true },
];
export const orders: OrderPreferences = {
  default_order_type: 'market',
  daily_order_limit: '10',
  high_order_threshold_usd: '1000.00',
  extra_confirmation: true,
};
export const portfolio: PortfolioPreferences = {
  view_type: 'table',
  sort_by: 'market_value',
  sort_direction: 'desc',
  hide_threshold: '0.00',
};
export const plans: readonly PlanSummary[] = [
  { code: 'monthly', price: '12.00', currency: 'USD' },
  { code: 'annual', price: '120.00', currency: 'USD' },
];
export const subscription: SubscriptionSummary = {
  plan: 'monthly',
  status: 'active',
  periodEnd: '2026-12-01T05:00:00Z',
  cancelAtPeriodEnd: false,
  nextChargeAt: '2026-12-01T05:00:00Z',
};
export const payments: readonly PaymentSummary[] = [
  {
    id: 'preview-payment-1',
    plan: 'monthly',
    amount: '12.00',
    currency: 'USD',
    result: 'paid',
    occurredAt: '2026-11-01T14:10:00Z',
  },
  {
    id: 'preview-payment-2',
    plan: 'monthly',
    amount: '12.00',
    currency: 'USD',
    result: 'failed',
    occurredAt: '2026-10-01T14:10:00Z',
  },
];
export const commissions: readonly CommissionSummary[] = [
  {
    id: 'preview-execution-1',
    symbol: 'AAPL',
    exchange: 'NASDAQ',
    side: 'buy',
    investorName: 'María Fernanda Vélez',
    executedAt: '2026-11-26T15:35:00Z',
    gross: '100.00',
    commission: '2.00',
    platformShare: '1.20',
    brokerShare: '0.80',
    status: 'official',
  },
  {
    id: 'preview-execution-2',
    symbol: 'NVDA',
    exchange: 'NASDAQ',
    side: 'sell',
    investorName: 'Daniel Sanabria',
    executedAt: '2026-11-24T18:20:00Z',
    gross: '250.00',
    commission: null,
    platformShare: null,
    brokerShare: null,
    status: 'historical_terms_unknown',
  },
];
