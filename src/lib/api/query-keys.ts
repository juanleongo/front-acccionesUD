/** Hierarchical React Query keys shared across authenticated and market modules. */
export const queryKeys = {
  users: {
    all: ['users'] as const,
    me: () => ['users', 'me'] as const,
  },
  kyc: {
    all: ['kyc'] as const,
    status: () => ['kyc', 'status'] as const,
  },
  wallet: {
    all: ['wallet'] as const,
    summary: () => ['wallet', 'balances', 'summary'] as const,
    funding: () => ['wallet', 'funding'] as const,
    banks: () => ['wallet', 'banks'] as const,
  },
  markets: {
    all: ['markets'] as const,
    list: () => ['markets', 'list'] as const,
    clock: (tz: string) => ['markets', 'clock', tz] as const,
    status: (code: string, date: string, tz: string) =>
      ['markets', 'status', code, date, tz] as const,
    calendar: (code: string, start: string, end: string, tz: string) =>
      ['markets', 'calendar', code, start, end, tz] as const,
  },
  instruments: {
    options: (exchange: string, letter: string, page: number) =>
      ['instrument-options', exchange, letter, page] as const,
    search: (q: string, exchange: string, page: number) =>
      ['trading-assets', q, exchange, page] as const,
    priceHistory: (symbol: string, period: string, timeframe: string) =>
      ['price-history', symbol, period, timeframe] as const,
    quote: (symbol: string) => ['instruments', 'quote', symbol] as const,
  },
  orders: {
    all: ['orders'] as const,
    list: (cursor: string, symbol: string, status: string) =>
      ['orders', cursor, symbol, status] as const,
    detail: (id: string) => ['order-detail', id] as const,
    positions: () => ['trading-positions'] as const,
    estimate: (input: object) => ['orders', 'estimate', input] as const,
  },
  portfolio: {
    all: ['portfolio'] as const,
    positions: () => ['portfolio', 'positions'] as const,
    statistics: (from: string, to: string) =>
      ['portfolio', 'statistics', from, to] as const,
    riskProfile: () => ['portfolio', 'risk-profile'] as const,
    executions: (from: string, to: string, symbol: string) =>
      ['portfolio', 'executions', from, to, symbol] as const,
    reports: () => ['portfolio', 'reports'] as const,
  },
  brokers: {
    all: ['brokers'] as const,
    directory: (q = '') => ['brokers', 'directory', q] as const,
    currentLink: () => ['brokers', 'current-link'] as const,
    proposals: () => ['brokers', 'proposals'] as const,
    linkRequests: () => ['brokers', 'link-requests'] as const,
    clients: () => ['brokers', 'clients'] as const,
  },
  admin: {
    all: ['admin'] as const,
    users: () => ['admin', 'users'] as const,
    auditLog: (action = '') => ['admin', 'audit-log', action] as const,
    roles: () => ['admin', 'roles'] as const,
    permissions: () => ['admin', 'permissions'] as const,
    overrides: (market: string) => ['admin', 'overrides', market] as const,
  },
} as const;
