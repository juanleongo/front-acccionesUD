import { expect, type Page } from '@playwright/test';
const scenarios = [
  { symbol: 'UP', count: 1100, base: 100, delta: 0.02 },
  { symbol: 'DOWN', count: 100, base: 100, delta: -0.2 },
  { symbol: 'DOJI', count: 60, base: 5, delta: 0 },
  { symbol: 'SMALL', count: 10, base: 0.00001, delta: 0.00000001 },
  { symbol: 'HIGH', count: 100, base: 100000, delta: 100 },
  { symbol: 'ONE', count: 1, base: 3.475, delta: 0 },
  { symbol: 'TWO', count: 2, base: 2, delta: 1 },
  { symbol: 'JUMP', count: 100, base: 1, delta: 0 },
];
async function marketsFixture(page: Page) {
  const requests: URL[] = [];
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    let json: unknown = {};
    if (url.pathname === '/api/v1/public/market-explorer')
      json = {
        results: [
          {
            symbol: 'UP',
            name: 'Fixture UP',
            exchange: 'NASDAQ',
            tradable: true,
            price: '121.98',
            change_ratio: '0.02',
            as_of: '2026-11-19T15:00:00Z',
            feed: 'iex',
            is_delayed: false,
            is_stale: false,
          },
        ],
        markets: [{ code: 'NASDAQ', name: 'NASDAQ' }],
        total: 1,
        page: 1,
        page_size: 6,
        retrieved_at: '2026-11-19T15:00:00Z',
        market_open: true,
        quotes_unavailable: false,
        source: 'alpaca',
        currency: 'USD',
      };
    else if (url.pathname === '/api/v1/markets')
      json = [{ code: 'NASDAQ', name: 'NASDAQ' }];
    else if (url.pathname.includes('instruments/search'))
      json = {
        total: 9,
        page_size: 8,
        results:
          url.searchParams.get('page') === '2'
            ? [{ symbol: 'BATCH', name: 'Second catalog page' }]
            : scenarios.map((s) => ({
                symbol: s.symbol,
                name: `Fixture ${s.symbol}`,
              })),
      };
    else if (url.pathname.endsWith('/candles')) {
      requests.push(url);
      const symbol = url.pathname.split('/').at(-2);
      const s =
        scenarios.find((item) => item.symbol === symbol) ?? scenarios[0]!;
      const step =
        url.searchParams.get('timeframe') === '1Day' ? 86400000 : 60000;
      json = {
        currency: 'USD',
        source: 'alpaca',
        is_delayed: false,
        next_page_token: null,
        bars: Array.from({ length: s.count }, (_, i) => {
          const value = Number(
            (
              s.base +
              i * s.delta +
              (s.symbol === 'UP' ? Math.sin(i / 4) * 0.4 : 0) +
              (s.symbol === 'JUMP' && i > 50 ? 50 : 0)
            ).toFixed(s.base < 1 ? 8 : 2),
          );
          const close = Number(
            (
              value + (s.delta === 0 ? 0 : Math.cos(i) * Math.abs(s.delta) * 6)
            ).toFixed(s.base < 1 ? 8 : 2),
          );
          const wiggle = s.delta === 0 ? 0 : Math.abs(s.delta) * 2;
          return {
            timestamp: new Date(
              Date.UTC(2026, 10, 19, 15) - (s.count - i) * step,
            ).toISOString(),
            open: value,
            high: Number((Math.max(value, close) + wiggle).toFixed(8)),
            low: Number((Math.min(value, close) - wiggle).toFixed(8)),
            close,
            volume: 100 + i,
          };
        }),
      };
    } else if (url.pathname.includes('/calendar'))
      json = { time_zone: 'America/New_York', days: [] };
    else if (url.pathname.includes('/clock'))
      json = {
        is_open: true,
        timestamp: '2026-11-19T15:00:00Z',
        next_open: '2026-11-20T14:30:00Z',
        next_close: '2026-11-19T21:00:00Z',
        time_zone: 'America/New_York',
      };
    else {
      await route.fallback();
      return;
    }
    await route.fulfill({ json });
  });
  return { requests, errors };
}

export async function installResponsiveFixtures(page: Page, brokerMode = true) {
  const instant = '2026-11-26T15:00:00Z';
  const userId = '00000000-0000-4000-8000-000000000001';
  const brokerId = '00000000-0000-4000-8000-000000000002';
  const reputation = {
    broker_id: brokerId,
    name: 'María Vélez',
    average: '4.75',
    reviews_count: 1,
    converted_proposals: 3,
    distinct_investors: 2,
    years_experience: 5,
    broker_since: instant,
  };
  const broker = {
    id: brokerId,
    name: 'María Vélez',
    firm_name: 'Asesoría UD',
    specialty: 'Acciones estadounidenses',
    years_experience: 5,
    certifications: ['AMV'],
    description: 'Acompañamiento para tus decisiones de inversión.',
    reputation,
  };
  const link = {
    id: 'link-1',
    investor_id: userId,
    broker_id: brokerId,
    broker: {
      id: brokerId,
      name: broker.name,
      firm_name: broker.firm_name,
    },
    status: 'active',
    requested_at: instant,
    expires_at: instant,
    responded_at: instant,
    started_at: instant,
    ended_at: null,
    decline_reason: null,
    end_reason: null,
    consent_version: 'v1',
    consent_accepted_at: instant,
    order_review_enabled: false,
  };
  let personal = {
    first_names: 'Daniel',
    last_names: 'Prueba',
    phone: '+573001234567',
    country: 'CO',
  };
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    let data: unknown;
    if (path === '/api/v1/users/me') {
      if (request.method() === 'PATCH') {
        personal = { ...personal, ...request.postDataJSON() };
        data = personal;
      } else
        data = {
          user_id: userId,
          ...personal,
          email: 'test@example.org',
          account_status: 'active',
          registered_at: instant,
          is_premium: false,
          roles: brokerMode ? ['broker', 'investor'] : ['investor'],
          kyc_status: 'ACTIVE',
          kyc_status_unavailable: false,
          interests: ['NASDAQ'],
          investor_level: 'experienced',
          mfa_enrolled: true,
          associated_broker: null,
        };
    } else if (path === '/api/v1/kyc/status')
      data = { has_account: false, status: null, can_trade: false };
    else if (path === '/api/v1/wallet/balances')
      data = {
        status: 'ACTIVE',
        currency: 'USD',
        cash: '1000',
        cash_withdrawable: '1000',
        buying_power: '1000',
        equity: '1000',
        portfolio_value: '1000',
        long_market_value: '0',
        retrieved_at: instant,
        unavailable: false,
      };
    else if (path === '/api/v1/auth/interest-options')
      data = { markets: ['NYSE', 'NASDAQ'], sectors: ['Tecnología'] };
    else if (path === '/api/v1/broker-links/current')
      data = {
        link,
        trading_authorization: null,
        pending_broker_selection: false,
        suggestions: [broker],
      };
    else if (path === '/api/v1/broker-links')
      data = { items: [link], next_cursor: null };
    else if (path === '/api/v1/brokers')
      data = { items: [broker], next_cursor: null };
    else if (path === '/api/v1/brokers/suggestions') data = [broker];
    else if (path.endsWith('/reputation')) data = reputation;
    else if (path.endsWith('/reviews'))
      data = {
        items: [
          {
            stars: 5,
            comment: 'Asesoría clara y oportuna.',
            created_at: instant,
            updated_at: instant,
          },
        ],
        next_cursor: null,
      };
    else if (
      path === `/api/v1/brokers/${brokerId}` ||
      path === `/api/v1/brokers/${userId}`
    )
      data = broker;
    else if (path === '/api/v1/broker/link-requests') data = [];
    else if (path === '/api/v1/broker/clients')
      data = [
        {
          investor_id: userId,
          name: 'Daniel Prueba',
          link_id: link.id,
          since: instant,
          trading_authorized: true,
          order_review_enabled: false,
        },
      ];
    else if (path === `/api/v1/portfolio/broker/clients/${userId}/positions`)
      data = {
        currency: 'USD',
        positions: [
          {
            symbol: 'AAPL',
            qty: '2',
            market_value: '200',
            unrealized_pnl: '10',
          },
        ],
      };
    else if (path === `/api/v1/broker/clients/${userId}/orders`)
      data = {
        items: [
          {
            id: 'order-1',
            symbol: 'AAPL',
            side: 'buy',
            qty: '2',
            type: 'market',
            status: 'FILLED',
            limit_price: null,
            estimated_amount: '204',
            created_at: instant,
          },
        ],
        next_cursor: null,
      };
    else return route.fallback();
    return route.fulfill({ json: data });
  });

  const fee = {
    id: '00000000-0000-4000-8000-000000000701',
    scope: 'default',
    version_no: 1,
    commission_rate_pct: '2',
    platform_share_pct: '60',
    broker_share_pct: '40',
    effective_from: instant,
    status: 'in_force',
    reason: 'Tarifa vigente',
    created_at: instant,
  };
  const market = {
    code: 'NYSE',
    name: 'New York Stock Exchange',
    timezone: 'America/New_York',
    default_schedule: { open_time: '09:30', close_time: '16:00' },
    overrides: [],
    commission_terms: {
      fee_version_id: fee.id,
      commission_rate_pct: '2',
      platform_share_pct: '60',
    },
    fee_origin: 'default',
    trading_halts: [],
  };

  await page.route('**/api/v1/admin/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    if (request.method() !== 'GET') {
      return route.fulfill({
        status: 409,
        json: { code: 'FEE_VERSION_CONFLICT' },
      });
    }
    let data: unknown = { items: [], next_cursor: null };
    if (path === '/api/v1/admin/users' || path === '/api/v1/admin/audit-log')
      data = { items: [], total: 0, offset: 0, limit: 50 };
    else if (path === '/api/v1/admin/kpis') {
      expect(url.searchParams.get('from')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      data = {
        period: {},
        definitions_version: 'kpi-v1',
        computed_at: instant,
        as_of: instant,
        cache_hit: false,
        stale: false,
        metrics: {
          registered_users: {
            value: 12,
            unit: 'users',
            definition: 'kpi-v1.registered_users',
          },
          traded_volume_usd: {
            value: '5000.25',
            unit: 'USD',
            definition: 'kpi-v1.traded_volume_usd',
          },
        },
      };
    } else if (path === '/api/v1/admin/fee-schedules')
      data = {
        items: [
          {
            scope: 'default',
            terms: market.commission_terms,
            current: fee,
            origin: 'default',
            scheduled: [],
          },
          {
            scope: 'NYSE',
            terms: market.commission_terms,
            current: fee,
            origin: 'default',
            scheduled: [],
          },
        ],
      };
    else if (path.endsWith('/versions'))
      data = { items: [fee], next_cursor: null };
    else if (path === '/api/v1/admin/markets') data = [market];
    else if (path === '/api/v1/admin/markets/NYSE') data = market;
    else if (path.endsWith('/schedule-overrides')) data = [];
    else if (path === '/api/v1/admin/commissions')
      data = {
        items: [],
        next_cursor: null,
        totals: {
          commission: '100',
          platform_share: '60',
          broker_share: '40',
          gross_amount: '5000',
          historical_terms_unknown_count: 0,
          complete: true,
        },
        by_market: {},
        by_broker: {},
      };
    return route.fulfill({ json: data });
  });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await page.route('**/api/public/**', (route) =>
    route.fulfill({
      json: new URL(route.request().url()).pathname.endsWith('/currencies')
        ? ['USD', 'COP', 'EUR', 'GBP'].map((iso_code) => ({
            iso_code,
            type: 'currency',
          }))
        : [
            {
              date: new Date().toISOString().slice(0, 10),
              base: 'USD',
              quote: 'COP',
              rate: 4000,
            },
            {
              date: new Date().toISOString().slice(0, 10),
              base: 'USD',
              quote: 'EUR',
              rate: 0.9,
            },
          ],
    }),
  );
  await marketsFixture(page);
  await page.route('**/api/v1/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    const position = {
      symbol: 'AAPL',
      exchange: 'NASDAQ',
      sector: 'Technology and information services',
      qty: '2',
      reserved_qty: '0',
      price: '100',
      price_source: 'market_data',
      average_cost: '90',
      market_value: '200',
      cost_basis: '180',
      unrealized_pnl: '20',
      reconciliation_mismatch: false,
    };
    const report = {
      id: 'report-1',
      owner_id: userId,
      owner_role: 'investor',
      type: 'monthly',
      period: { from: '2026-10-01', to: '2026-10-31' },
      positions_as_of: instant,
      generated_at: instant,
      notified_at: null,
      content: { market_value: '200', cost_basis: '180', unrealized_pnl: '20' },
    };
    const proposal = {
      id: 'proposal-1',
      link_id: 'link-1',
      status: 'sent',
      status_reason: null,
      current_version: 1,
      accepted_version: null,
      order_id: null,
      failure_code: null,
      broker: { id: brokerId, name: 'María Fernanda Vélez Benítez' },
      investor: { id: userId, name: 'Daniel Alejandro Sanabria Rivera' },
      created_at: instant,
      updated_at: instant,
      expires_at: '2026-12-27T15:00:00Z',
      symbol: 'AAPL',
      side: 'buy',
      qty: '2',
      type: 'limit',
      estimated_cost: '204',
    };
    const order = {
      id: 'order-1',
      status: 'FILLED',
      status_cause: null,
      provider_status: 'filled',
      symbol: 'AAPL',
      exchange: 'NASDAQ',
      side: 'buy',
      qty: '2',
      filled_qty: '2',
      filled_avg_price: '100',
      fully_filled: true,
      type: 'market',
      order_class: 'simple',
      time_in_force: 'day',
      limit_price: null,
      stop_price: null,
      trail_price: null,
      trail_percent: null,
      reference_price: '100',
      estimated_amount: '204',
      created_at: instant,
      scheduled_for: null,
      returned_for_changes: false,
    };
    let data: unknown;

    if (path === '/api/v1/kyc/status')
      data = { has_account: true, status: 'ACTIVE', can_trade: true };
    else if (path === '/api/v1/instruments/search')
      data = {
        results: [
          { symbol: 'UP', name: 'Fixture UP', exchange: 'NASDAQ' },
          { symbol: 'AAPL', name: 'Apple Incorporated', exchange: 'NASDAQ' },
          {
            symbol: 'NVDA',
            name: 'NVIDIA Corporation Common Stock',
            exchange: 'NASDAQ',
          },
        ],
        total: 3,
        page_size: 20,
      };
    else if (path.endsWith('/quote'))
      data = {
        symbol: path.split('/').at(-2),
        last_trade_price: '100',
        ask_price: '100.05',
        bid_price: '99.95',
        updated_at: instant,
        as_of: instant,
        currency: 'USD',
        source: 'Alpaca',
        is_delayed: true,
        is_stale: false,
      };
    else if (/\/api\/v1\/instruments\/[^/]+$/.test(path))
      data = {
        symbol: path.split('/').at(-1),
        tradable: true,
        fractionable: true,
        exchange: 'NASDAQ',
      };
    else if (path.endsWith('/status'))
      data = {
        market: 'NASDAQ',
        date: '2026-11-26',
        open: true,
        open_at: instant,
        close_at: '2026-11-26T21:00:00Z',
        override: false,
      };
    else if (path === '/api/v1/portfolio/positions')
      data = {
        positions: [position],
        totals: {
          market_value: '200',
          cost_basis: '180',
          unrealized_pnl: '20',
        },
        view_type: 'table',
        positions_as_of: instant,
        currency: 'USD',
      };
    else if (path === '/api/v1/portfolio/statistics')
      data = {
        execution_count: 3,
        buy_count: 2,
        sell_count: 1,
        volume: '10000',
        by_market: [{ key: 'NASDAQ', volume: '10000', percentage: '100' }],
        by_instrument: [{ key: 'AAPL', volume: '10000', percentage: '100' }],
        by_sector: [
          { key: position.sector, volume: '10000', percentage: '100' },
        ],
      };
    else if (path === '/api/v1/portfolio/risk-profile')
      data = {
        window_days: 30,
        f: '0.5',
        c: '0.5',
        e: '0.5',
        t: '0.5',
        risk_score: '0.5',
        classification: 'moderate',
        equity_unavailable: false,
        metrics: {
          execution_count: 3,
          executions_per_week: '1',
          volume: '10000',
          markets: ['NASDAQ'],
          instruments: ['AAPL'],
          asset_distribution: { AAPL: '100' },
          window_from: '2026-10-01',
          window_to: '2026-10-31',
        },
      };
    else if (path === '/api/v1/portfolio/executions')
      data = {
        items: [
          {
            execution_id: 'execution-00000000-long-id',
            order_id: 'order-1',
            symbol: 'AAPL',
            exchange: 'NASDAQ',
            side: 'buy',
            qty: '2',
            price: '100',
            executed_at: instant,
            commission: '4',
            commission_source: 'official',
          },
        ],
        next_cursor: null,
      };
    else if (path === '/api/v1/portfolio/reports')
      data = { items: [report], next_cursor: null };
    else if (path === '/api/v1/portfolio/reports/report-1') data = report;
    else if (path === '/api/v1/wallet/bank-relationships')
      data = [
        {
          id: 'bank-1',
          alpaca_relationship_id: 'relationship-1',
          owner_name: 'Daniel Alejandro Sanabria Rivera',
          account_type: 'SAVINGS',
          account_last4: '1234',
          status: 'APPROVED',
          created_at: instant,
        },
      ];
    else if (path === '/api/v1/wallet/transfers')
      data = {
        items: [
          {
            id: 'transfer-1',
            alpaca_transfer_id: '00000000-0000-4000-8000-000000000045',
            bank_relationship_id: 'bank-1',
            direction: 'INCOMING',
            amount: '1000',
            currency: 'USD',
            status: 'COMPLETE',
            description: 'Depósito de fondos en la cuenta de inversión',
            created_at: instant,
          },
        ],
        next_cursor: null,
      };
    else if (path === '/api/v1/orders')
      data = { items: [order], next_cursor: null };
    else if (path === '/api/v1/orders/order-1')
      data = {
        ...order,
        reference_commission: '4',
        legs: [],
        executions: [
          {
            alpaca_execution_id: 'exec-1',
            qty: '2',
            price: '100',
            executed_at: instant,
          },
        ],
        events: [
          {
            id: 'event-1',
            to_status: 'FILLED',
            cause: 'EXECUTED',
            at: instant,
          },
        ],
        reauthorizations: [],
      };
    else if (path === '/api/v1/broker/order-reviews')
      data = { items: [], next_cursor: null };
    else if (path.endsWith('/proposals') || path.endsWith('/proposals/sent'))
      data = { items: [proposal], next_cursor: null };
    else if (path.endsWith('/proposals/proposal-1'))
      data = {
        ...proposal,
        versions: [
          {
            ...proposal,
            version: 1,
            limit_price: '100',
            reference_price: '100',
          },
        ],
        decisions: [],
      };
    else if (path.endsWith('/proposals/proposal-1/messages'))
      data = {
        items: [
          {
            id: 'message-1',
            proposal_id: 'proposal-1',
            author_id: brokerId,
            body: 'Revisemos esta propuesta y su impacto en tu portafolio antes de continuar.',
            created_at: instant,
          },
        ],
        next_cursor: null,
      };
    else if (path.endsWith('/calendar'))
      data = {
        time_zone: 'America/New_York',
        days: Array.from({ length: 7 }, (_, i) => ({
          date: `2026-11-${String(20 + i).padStart(2, '0')}`,
          open_at: i === 1 || i === 2 ? null : instant,
          close_at: i === 1 || i === 2 ? null : '2026-11-26T21:00:00Z',
          override: false,
          kind: i === 1 || i === 2 ? 'weekend' : 'trading',
        })),
      };
    else if (path === '/api/v1/admin/trading-halts')
      data = {
        items: [
          {
            id: 'halt-1',
            scope: 'NYSE',
            status: 'active',
            reason:
              'Revisión de las condiciones de negociación del instrumento',
            starts_at: instant,
            ends_at: null,
          },
        ],
        next_cursor: null,
      };
    else if (path === '/api/v1/admin/compliance/restrictions')
      data = {
        items: [
          {
            id: 'restriction-1',
            user_id: userId,
            status: 'active',
            reason: 'Verificación de los documentos de la cuenta',
            evidence_text: 'Documentación pendiente de verificación',
            restricted_at: instant,
            lifted_at: null,
          },
        ],
        next_cursor: null,
      };
    else if (path === '/api/v1/admin/compliance/atypical-operations')
      data = {
        items: [
          {
            event_id: 'atypical-1',
            user_id: userId,
            at: instant,
            reasons: ['Revisión por volumen de operaciones'],
            observed: { volume: '10000' },
            references: ['order-1'],
            rules_version: 'v1',
          },
        ],
        next_cursor: null,
      };
    else if (path === '/api/v1/admin/audit-trail')
      data = {
        items: [
          {
            source: 'orders',
            event_id: 'event-1',
            occurred_at: instant,
            actor_type: 'user',
            actor_id: userId,
            subject_user_id: userId,
            action: 'ORDER_FILLED',
            entity_type: 'order',
            entity_id: 'order-1',
            from_state: 'ACCEPTED',
            to_state: 'FILLED',
            details: { symbol: 'AAPL' },
          },
        ],
        next_cursor: null,
      };
    else if (
      path ===
      '/api/v1/admin/audit-trail/orders/00000000-0000-4000-8000-000000000001'
    )
      data = {
        order: { ...order, user_id: userId },
        events: [{ action: 'ORDER_FILLED', at: instant }],
        executions: [],
        cancel_requests: [],
        reauthorizations: [],
        proposals: [],
        created_by: userId,
        signed_by: userId,
        signed_at: instant,
        authorization_method: 'totp',
        first_submitted_at: instant,
      };
    else if (path.endsWith('/audit-reports'))
      data = {
        items: [
          {
            id: 'report-1',
            user_id: userId,
            period_from: '2026-10-01',
            period_to: '2026-10-31',
            rules_version: 'v1',
            content: {
              review: 'Revisión de la actividad y evidencias del período',
            },
            content_sha256:
              '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
            generated_at: instant,
          },
        ],
        next_cursor: null,
      };
    else if (path === '/api/v1/admin/users')
      data = {
        items: [
          {
            user_id: userId,
            email: 'daniel.sanabria.inversionista@example.org',
            first_names: 'Daniel Alejandro',
            last_names: 'Sanabria Rivera',
            phone: '+573001234567',
            country: 'CO',
            account_status: 'pending_broker_activation',
            is_premium: false,
            roles: ['investor'],
            broker_requested: true,
            registered_at: instant,
            kyc_link_state: 'none',
            kyc_alpaca_account_id: null,
            kyc_status: null,
          },
        ],
        total: 1,
        offset: 0,
        limit: 50,
      };
    else if (path === '/api/v1/admin/roles')
      data = [
        {
          role: 'administrator',
          permissions: ['admin:users', 'admin:rbac', 'admin:markets'],
        },
        { role: 'investor', permissions: ['portfolio:view'] },
      ];
    else if (path === '/api/v1/admin/permissions')
      data = [
        {
          code: 'admin:users',
          description:
            'Administrar cuentas y credenciales de los usuarios registrados',
        },
      ];
    else if (path === '/api/v1/admin/audit-log')
      data = {
        items: [
          {
            id: 'audit-1',
            actor_user_id: userId,
            action: 'BROKER_ACTIVATED',
            target_type: 'user',
            target_id: brokerId,
            payload: { status: 'active' },
            occurred_at: instant,
          },
        ],
        total: 1,
        offset: 0,
        limit: 50,
      };
    else return route.fallback();
    return route.fulfill({ json: data });
  });
}
