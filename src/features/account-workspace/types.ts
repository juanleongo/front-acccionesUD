/** Presentation models only. API adapters must validate and map server responses. */
export type ViewState = 'ready' | 'loading' | 'empty' | 'error' | 'restricted';
export type Tone = 'neutral' | 'success' | 'warning' | 'error';
export interface InstrumentSummary {
  symbol: string;
  name: string;
  exchange: string;
}
export interface WatchlistSummary {
  id: string;
  name: string;
  instruments: readonly InstrumentSummary[];
}
export interface PriceAlertSummary {
  id: string;
  symbol: string;
  comparator: 'above' | 'below' | 'crosses';
  threshold: string;
  status: 'active' | 'triggered' | 'inactive';
}
export interface NoticeSummary {
  id: string;
  title: string;
  body: string;
  createdAt: string;
}
export interface SessionSummary {
  id: string;
  agent: string;
  ip: string;
  createdAt: string;
  lastUsedAt: string;
  current: boolean;
}
export const notificationEvents = [
  'market_open',
  'market_close',
  'proposals',
  'approval_requests',
  'price_changes',
  'execution_confirmations',
  'daily_summary',
  'balance_changes',
  'order_executions',
  'order_updates',
  'broker_link_updates',
  'proposal_updates',
  'market_schedule_changes',
] as const;
export type NotificationEvent = (typeof notificationEvents)[number];
export type Channel = 'in_app' | 'email' | 'sms' | 'telegram';
export interface ChannelPreference {
  event_type: NotificationEvent;
  channel: Channel;
  enabled: boolean;
}
export interface OrderPreferences {
  default_order_type:
    'market' | 'limit' | 'stop' | 'stop_limit' | 'trailing_stop';
  daily_order_limit: string;
  high_order_threshold_usd: string;
  extra_confirmation: boolean;
}
export interface PortfolioPreferences {
  view_type: 'table' | 'cards' | 'chart';
  sort_by: 'symbol' | 'market_value' | 'gain_loss' | 'allocation';
  sort_direction: 'asc' | 'desc';
  hide_threshold: string;
}
export interface PlanSummary {
  code: 'monthly' | 'annual';
  price: string;
  currency: string;
}
export interface SubscriptionSummary {
  plan: PlanSummary['code'];
  status:
    | 'active'
    | 'trialing'
    | 'past_due'
    | 'pending_checkout'
    | 'canceled'
    | 'incomplete'
    | 'unpaid'
    | 'incomplete_expired'
    | 'paused';
  periodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  nextChargeAt: string | null;
}
export interface PaymentSummary {
  id: string;
  plan: PlanSummary['code'];
  amount: string;
  currency: string;
  result: 'paid' | 'failed';
  occurredAt: string;
}
export interface CommissionSummary {
  id: string;
  symbol: string;
  exchange: string;
  side: 'buy' | 'sell';
  investorName: string;
  executedAt: string;
  gross: string;
  commission: string | null;
  platformShare: string | null;
  brokerShare: string | null;
  status: 'official' | 'historical_terms_unknown';
}
export interface CommissionFilters {
  from: string;
  to: string;
  symbol: string;
  investorId: string;
}
export interface CommissionTotals {
  commission: string;
  platformShare: string;
  brokerShare: string;
  complete: boolean;
}

/** Commands describe intent; only an external integration may perform a mutation. */
export type WorkspaceCommand =
  | { type: 'watchlist.create'; name: string }
  | { type: 'watchlist.add'; listId: string; symbol: string }
  | { type: 'watchlist.remove'; listId: string; symbol: string }
  | {
      type: 'alert.create';
      symbol: string;
      comparator: PriceAlertSummary['comparator'];
      threshold: string;
    }
  | { type: 'alert.activate' | 'alert.deactivate' | 'alert.delete'; id: string }
  | { type: 'session.revoke'; id: string }
  | { type: 'session.revokeOthers' | 'recovery.regenerate' }
  | { type: 'preferences.channels'; preferences: readonly ChannelPreference[] }
  | { type: 'preferences.orders'; values: OrderPreferences }
  | { type: 'preferences.portfolio'; values: PortfolioPreferences }
  | { type: 'preferences.telegram'; chatId: string | null }
  | { type: 'subscription.checkout'; plan: PlanSummary['code'] }
  | { type: 'subscription.cancel'; reason: string }
  | { type: 'payments.next' | 'payments.previous' }
  | {
      type: 'commissions.query';
      filters: CommissionFilters;
      audience: 'investor' | 'broker';
    }
  | { type: 'commissions.next' | 'commissions.previous' };
export type CommandHandler = (command: WorkspaceCommand) => void;
