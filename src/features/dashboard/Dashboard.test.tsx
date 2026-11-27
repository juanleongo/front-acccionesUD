// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  expect,
  it,
  vi,
} from 'vitest';
import { RecoveryCodesProvider } from '@/features/login';
import { mockServer } from '../../../tests/fixtures/http';
import { Dashboard } from './Dashboard';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

beforeAll(() => mockServer.listen({ onUnhandledFrame: 'bypass' }));
afterEach(() => mockServer.resetHandlers());
afterAll(() => mockServer.close());

beforeEach(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  });
  window.scrollTo = vi.fn();
  mockServer.use(
    http.get('*/api/v1/portfolio/positions', () =>
      HttpResponse.json({
        positions: [],
        positions_as_of: '2026-11-26T15:00:00Z',
      }),
    ),
    http.get('*/api/v1/markets/clock', () =>
      HttpResponse.json({ code: 'TEST_UNAVAILABLE' }, { status: 503 }),
    ),
    http.get('*/api/v1/broker-links', () =>
      HttpResponse.json({ items: [], next_cursor: null }),
    ),
    http.get('*/api/v1/broker-links/current', () =>
      HttpResponse.json({
        link: null,
        trading_authorization: null,
        pending_broker_selection: false,
        suggestions: [],
      }),
    ),
    http.get('*/api/v1/brokers', () =>
      HttpResponse.json({ items: [], next_cursor: null }),
    ),
    http.get('*/api/v1/brokers/suggestions', () => HttpResponse.json([])),
  );
});

function renderDashboard(initialSection?: 'dashboard' | 'markets') {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return render(
    <QueryClientProvider client={client}>
      <RecoveryCodesProvider>
        <Dashboard {...(initialSection ? { initialSection } : {})} />
      </RecoveryCodesProvider>
    </QueryClientProvider>,
  );
}

const sampleProfile = {
  user_id: 'user-1',
  first_names: 'DANTE',
  last_names: 'santos',
  email: 'dante@example.com',
  phone: '+573001234567',
  country: 'CO',
  account_status: 'active',
  registered_at: '2026-10-01T12:00:00Z',
  contracted_plan: null,
  is_premium: false,
  broker_requested: false,
  associated_broker: null,
  roles: ['investor'],
  kyc_status: 'ACTIVE',
  kyc_status_unavailable: false,
  interests: ['NASDAQ'],
  investor_level: 'beginner',
  mfa_enrolled: true,
};

const sampleWalletBalance = {
  status: 'ACTIVE',
  currency: 'USD',
  cash: '1000.00',
  cash_withdrawable: '1000.00',
  buying_power: '1000.00',
  equity: '1000.00',
  portfolio_value: '1000.00',
  long_market_value: '0.00',
  retrieved_at: '2026-11-19T12:00:00Z',
  unavailable: false,
};

it('muestra la pantalla oscura de sesión cerrada al expirar la sesión durante una recarga en Billetera', async () => {
  let expired = false;
  mockServer.use(
    http.get('*/api/v1/users/me', () =>
      expired
        ? HttpResponse.json({ code: 'NOT_AUTHENTICATED' }, { status: 401 })
        : HttpResponse.json(sampleProfile),
    ),
    http.get('*/api/v1/kyc/status', () =>
      HttpResponse.json({ has_account: true, status: 'ACTIVE' }),
    ),
    http.get('*/api/v1/wallet/balances', () =>
      expired
        ? HttpResponse.json({ code: 'NOT_AUTHENTICATED' }, { status: 401 })
        : HttpResponse.json(sampleWalletBalance),
    ),
    http.get('*/api/v1/wallet/transfers', () =>
      expired
        ? HttpResponse.json({ code: 'NOT_AUTHENTICATED' }, { status: 401 })
        : HttpResponse.json({ items: [], next_cursor: null }),
    ),
    http.get('*/api/v1/wallet/bank-relationships', () => HttpResponse.json([])),
  );

  renderDashboard('dashboard');

  expect(await screen.findByText(/¡Hola, Dante!/)).toBeVisible();
  expect(screen.getByTitle('Ver perfil de Dante Santos')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Depósitos & Retiros' }));
  const refreshButton = await screen.findByRole('button', {
    name: 'Actualizar saldos y transferencias',
  });
  await waitFor(() => expect(refreshButton).toBeEnabled());

  expired = true;
  fireEvent.click(refreshButton);

  expect(await screen.findByRole('alertdialog')).toHaveTextContent(
    'Vuelve a iniciar sesión',
  );
  expect(
    screen.getByRole('link', { name: /Iniciar sesión de nuevo/ }),
  ).toHaveAttribute('href', '/login');
  expect(
    screen.queryByText(/No se pudo consultar la billetera/),
  ).not.toBeInTheDocument();
});

it('bloquea /dashboard con el aviso oscuro si se abre sin sesión activa (401)', async () => {
  mockServer.use(
    http.get('*/api/v1/users/me', () =>
      HttpResponse.json({ code: 'NOT_AUTHENTICATED' }, { status: 401 }),
    ),
    http.get('*/api/v1/kyc/status', () =>
      HttpResponse.json({ code: 'NOT_AUTHENTICATED' }, { status: 401 }),
    ),
    http.get('*/api/v1/wallet/balances', () =>
      HttpResponse.json({ code: 'NOT_AUTHENTICATED' }, { status: 401 }),
    ),
  );

  renderDashboard('dashboard');

  expect(await screen.findByRole('alertdialog')).toHaveTextContent(
    'Vuelve a iniciar sesión',
  );
  expect(
    screen.getByRole('link', { name: /Iniciar sesión de nuevo/ }),
  ).toHaveAttribute('href', '/login');
});

it('mantiene el acceso público en /markets sin sesión iniciada', async () => {
  mockServer.use(
    http.get('*/api/v1/users/me', () =>
      HttpResponse.json({ code: 'NOT_AUTHENTICATED' }, { status: 401 }),
    ),
    http.get('*/api/v1/kyc/status', () =>
      HttpResponse.json({ code: 'NOT_AUTHENTICATED' }, { status: 401 }),
    ),
    http.get('*/api/v1/wallet/balances', () =>
      HttpResponse.json({ code: 'NOT_AUTHENTICATED' }, { status: 401 }),
    ),
    http.get('*/api/v1/markets', () =>
      HttpResponse.json({ code: 'UNAUTHORIZED' }, { status: 401 }),
    ),
  );

  renderDashboard('markets');

  const loginLink = await screen.findByRole('link', { name: 'Inicia sesión' });
  expect(loginLink).toHaveAttribute('href', '/login');
  expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
});

it('muestra saldos reales y permite explorar cuando no hay asesor asociado', async () => {
  mockServer.use(
    http.get('*/api/v1/users/me', () => HttpResponse.json(sampleProfile)),
    http.get('*/api/v1/kyc/status', () =>
      HttpResponse.json({ has_account: true, status: 'ACTIVE' }),
    ),
    http.get('*/api/v1/wallet/balances', () =>
      HttpResponse.json({
        ...sampleWalletBalance,
        cash: '10000.00',
        cash_withdrawable: '0.00',
        buying_power: '10000.00',
        equity: '10000.00',
        portfolio_value: '10000.00',
        long_market_value: '0.00',
      }),
    ),
    http.get('*/api/v1/markets', () => HttpResponse.json([])),
  );

  renderDashboard('dashboard');

  expect(await screen.findByText('Disponible para invertir')).toBeVisible();
  expect(
    screen.queryByText('Dinero en órdenes pendientes'),
  ).not.toBeInTheDocument();
  expect(
    screen.getByText('En liquidación bancaria: $10,000.00 USD'),
  ).toBeVisible();
  await waitFor(() =>
    expect(
      screen.getByText(/Aún no tienes un comisionista asociado/),
    ).toBeVisible(),
  );
  expect(
    screen.queryByAltText('Foto Carlos Rodríguez, CFA'),
  ).not.toBeInTheDocument();
  fireEvent.click(
    screen.getByRole('button', { name: 'Explorar comisionistas' }),
  );
  expect(
    await screen.findByRole('tab', { name: 'Directorio de Comisionistas' }),
  ).toHaveAttribute('aria-selected', 'true');
});
