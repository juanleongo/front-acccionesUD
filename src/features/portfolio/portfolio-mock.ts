export interface PortfolioPosition {
  symbol: string;
  exchange: string;
  sector: string | null;
  qty: string;
  reserved_qty: string;
  price: string;
  price_source: 'market_data' | 'alpaca_position';
  average_cost: string;
  market_value: string;
  cost_basis: string;
  unrealized_pnl: string;
  reconciliation_mismatch: boolean;
}

export interface PortfolioPositionsData {
  positions: PortfolioPosition[];
  totals: {
    market_value: string;
    cost_basis: string;
    unrealized_pnl: string;
  };
  view_type: 'table' | 'cards' | 'chart';
  positions_as_of: string;
  currency: 'USD';
}

export interface PortfolioExecution {
  execution_id: string;
  order_id: string;
  symbol: string;
  exchange: string;
  side: 'buy' | 'sell';
  qty: string;
  price: string;
  executed_at: string;
  commission: string;
  commission_source: 'reference' | 'official';
}

export interface PortfolioShareItem {
  key: string;
  volume: string;
  percentage: string;
}

export interface PortfolioStatistics {
  execution_count: number;
  buy_count: number;
  sell_count: number;
  volume: string;
  by_market: PortfolioShareItem[];
  by_instrument: PortfolioShareItem[];
  by_sector: PortfolioShareItem[];
}

export interface PortfolioRiskProfile {
  window_days: number;
  f: string;
  c: string;
  e: string;
  t: string;
  risk_score: string | null;
  classification:
    'conservative' | 'moderate' | 'aggressive' | 'insufficient_data';
  equity_unavailable: boolean;
  metrics: {
    execution_count: number;
    executions_per_week: string;
    volume: string;
    markets: string[];
    instruments: string[];
    asset_distribution: Record<string, string>;
    window_from: string;
    window_to: string;
  };
}

export interface PortfolioReportSummary {
  id: string;
  owner_id: string;
  owner_role: 'investor' | 'broker';
  type: 'on_demand' | 'daily_summary' | 'monthly' | 'broker';
  period: {
    from: string;
    to: string;
  };
  positions_as_of: string;
  generated_at: string;
  notified_at: string | null;
  content?: Record<string, unknown> | undefined;
}

export const INITIAL_PORTFOLIO_POSITIONS: PortfolioPositionsData = {
  positions: [
    {
      symbol: 'AAPL',
      exchange: 'NASDAQ',
      sector: 'Tecnología & Semiconductores',
      qty: '55',
      reserved_qty: '5',
      price: '178.40',
      price_source: 'market_data',
      average_cost: '164.20',
      market_value: '9812.00',
      cost_basis: '9031.00',
      unrealized_pnl: '781.00',
      reconciliation_mismatch: false,
    },
    {
      symbol: 'NVDA',
      exchange: 'NASDAQ',
      sector: 'Inteligencia Artificial & Semiconductores',
      qty: '14',
      reserved_qty: '0',
      price: '892.50',
      price_source: 'market_data',
      average_cost: '765.00',
      market_value: '12495.00',
      cost_basis: '10710.00',
      unrealized_pnl: '1785.00',
      reconciliation_mismatch: false,
    },
    {
      symbol: 'MSFT',
      exchange: 'NASDAQ',
      sector: 'Cloud & Software Empresarial',
      qty: '20',
      reserved_qty: '0',
      price: '422.10',
      price_source: 'market_data',
      average_cost: '395.50',
      market_value: '8442.00',
      cost_basis: '7910.00',
      unrealized_pnl: '532.00',
      reconciliation_mismatch: false,
    },
    {
      symbol: 'JPM',
      exchange: 'NYSE',
      sector: 'Banca & Servicios Financieros',
      qty: '25',
      reserved_qty: '0',
      price: '198.20',
      price_source: 'market_data',
      average_cost: '185.40',
      market_value: '4955.00',
      cost_basis: '4635.00',
      unrealized_pnl: '320.00',
      reconciliation_mismatch: false,
    },
  ],
  totals: {
    market_value: '35704.00',
    cost_basis: '32286.00',
    unrealized_pnl: '3418.00',
  },
  view_type: 'table',
  positions_as_of: '2026-11-18T14:30:00Z',
  currency: 'USD',
};

export const INITIAL_PORTFOLIO_EXECUTIONS: PortfolioExecution[] = [
  {
    execution_id: 'exec-alp-90812',
    order_id: '41e92a11-7b20-4c9a-88ef-001122334455',
    symbol: 'NVDA',
    exchange: 'NASDAQ',
    side: 'buy',
    qty: '14',
    price: '765.00',
    executed_at: '2026-11-10T15:14:22Z',
    commission: '214.20',
    commission_source: 'official',
  },
  {
    execution_id: 'exec-alp-90754',
    order_id: '28f71b22-6c10-4b88-91aa-556677889900',
    symbol: 'AAPL',
    exchange: 'NASDAQ',
    side: 'buy',
    qty: '55',
    price: '164.20',
    executed_at: '2026-11-05T14:42:10Z',
    commission: '180.62',
    commission_source: 'official',
  },
  {
    execution_id: 'exec-alp-90611',
    order_id: '19c44d33-5a09-4e77-82bb-998877665544',
    symbol: 'MSFT',
    exchange: 'NASDAQ',
    side: 'buy',
    qty: '20',
    price: '395.50',
    executed_at: '2026-10-28T16:05:49Z',
    commission: '158.20',
    commission_source: 'official',
  },
  {
    execution_id: 'exec-alp-90509',
    order_id: '77b12e44-3d18-4f66-93cc-112233445566',
    symbol: 'JPM',
    exchange: 'NYSE',
    side: 'buy',
    qty: '25',
    price: '185.40',
    executed_at: '2026-10-21T13:50:15Z',
    commission: '92.70',
    commission_source: 'reference',
  },
];

export const INITIAL_PORTFOLIO_STATISTICS: PortfolioStatistics = {
  execution_count: 4,
  buy_count: 4,
  sell_count: 0,
  volume: '32286.00',
  by_market: [
    { key: 'NASDAQ', volume: '27651.00', percentage: '85.64' },
    { key: 'NYSE', volume: '4635.00', percentage: '14.36' },
  ],
  by_instrument: [
    { key: 'NVDA', volume: '10710.00', percentage: '33.17' },
    { key: 'AAPL', volume: '9031.00', percentage: '27.97' },
    { key: 'MSFT', volume: '7910.00', percentage: '24.50' },
    { key: 'JPM', volume: '4635.00', percentage: '14.36' },
  ],
  by_sector: [
    {
      key: 'Inteligencia Artificial & Semiconductores',
      volume: '10710.00',
      percentage: '33.17',
    },
    {
      key: 'Tecnología & Semiconductores',
      volume: '9031.00',
      percentage: '27.97',
    },
    {
      key: 'Cloud & Software Empresarial',
      volume: '7910.00',
      percentage: '24.50',
    },
    {
      key: 'Banca & Servicios Financieros',
      volume: '4635.00',
      percentage: '14.36',
    },
  ],
};

export const INITIAL_PORTFOLIO_RISK: PortfolioRiskProfile = {
  window_days: 90,
  f: '0.35',
  c: '0.52',
  e: '0.36',
  t: '0.41',
  risk_score: '0.42',
  classification: 'moderate',
  equity_unavailable: false,
  metrics: {
    execution_count: 4,
    executions_per_week: '1.25',
    volume: '32286.00',
    markets: ['NASDAQ', 'NYSE'],
    instruments: ['NVDA', 'AAPL', 'MSFT', 'JPM'],
    asset_distribution: {
      NVDA: '34.99',
      AAPL: '27.48',
      MSFT: '23.64',
      JPM: '13.89',
    },
    window_from: '2026-08-20T00:00:00Z',
    window_to: '2026-11-18T14:30:00Z',
  },
};

export const INITIAL_PORTFOLIO_REPORTS: PortfolioReportSummary[] = [
  {
    id: 'rep-01928374-aabb-44cc-99dd-112233445566',
    owner_id: 'inv-0001',
    owner_role: 'investor',
    type: 'monthly',
    period: {
      from: '2026-10-01',
      to: '2026-10-31',
    },
    positions_as_of: '2026-10-31T20:00:00Z',
    generated_at: '2026-11-01T01:00:00Z',
    notified_at: '2026-11-01T01:02:00Z',
    content: {
      market_value: '35704.00',
      cost_basis: '32286.00',
      unrealized_pnl: '3418.00',
      execution_count: 4,
      total_commissions: '645.72',
    },
  },
];
