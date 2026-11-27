// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { afterAll, afterEach, beforeAll, beforeEach, expect, it } from 'vitest';
import { setAppLocale } from '@/lib/i18n';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { applyTheme } from '@/lib/theme';
import { mockServer } from '../../../tests/fixtures/http';
import { AdminPanel } from './AdminPanel';

beforeAll(() => mockServer.listen({ onUnhandledFrame: 'bypass' }));
afterEach(() => mockServer.resetHandlers());
afterAll(() => mockServer.close());

beforeEach(() => {
  window.localStorage.clear();
  setAppLocale('es');
  applyTheme('dark', false);
  const market = {
    code: 'NYSE',
    name: 'NYSE',
    timezone: 'America/New_York',
    default_schedule: { open_time: '09:30', close_time: '16:00' },
    overrides: [],
    commission_terms: {
      fee_version_id: null,
      commission_rate_pct: '2',
      platform_share_pct: '60',
    },
    fee_origin: 'default',
    trading_halts: [],
  };
  mockServer.use(
    http.get('*/api/v1/admin/kpis', () =>
      HttpResponse.json({
        period: {},
        definitions_version: 'kpi-v1',
        computed_at: '2026-11-26T15:00:00Z',
        as_of: '2026-11-26T15:00:00Z',
        cache_hit: false,
        stale: false,
        metrics: {},
      }),
    ),
    http.get('*/api/v1/admin/markets', () => HttpResponse.json([market])),
    http.get('*/api/v1/admin/markets/NYSE', () => HttpResponse.json(market)),
    http.get('*/api/v1/admin/markets/NYSE/schedule-overrides', () =>
      HttpResponse.json([]),
    ),
    http.get('*/api/v1/admin/markets/NYSE/schedule-changes', () =>
      HttpResponse.json({ items: [], next_cursor: null }),
    ),
  );
});

const sampleUsersPage = {
  items: [
    {
      user_id: 'usr-admin-1',
      email: 'admin@accionesud.edu.co',
      first_names: 'DANIEL',
      last_names: 'SANABRIA',
      phone: '+573001112233',
      country: 'CO',
      account_status: 'active',
      is_premium: true,
      roles: ['administrator'],
      broker_requested: false,
      registered_at: '2026-11-10T10:00:00Z',
      kyc_link_state: 'linked',
      kyc_alpaca_account_id: 'alp-1',
      kyc_status: 'ACTIVE',
    },
    {
      user_id: 'usr-inv-1',
      email: 'inversor@accionesud.edu.co',
      first_names: 'JUAN',
      last_names: 'LEON',
      phone: '+573004445566',
      country: 'CO',
      account_status: 'active',
      is_premium: false,
      roles: ['investor'],
      broker_requested: false,
      registered_at: '2026-11-11T12:00:00Z',
      kyc_link_state: 'linked',
      kyc_alpaca_account_id: 'alp-2',
      kyc_status: 'ACTIVE',
    },
    {
      user_id: 'usr-brk-1',
      email: 'asesor@accionesud.edu.co',
      first_names: 'MARIA',
      last_names: 'VELEZ',
      phone: '+573007778899',
      country: 'CO',
      account_status: 'pending_broker_activation',
      is_premium: false,
      roles: ['investor'],
      broker_requested: true,
      registered_at: '2026-11-12T15:00:00Z',
      kyc_link_state: 'none',
      kyc_alpaca_account_id: null,
      kyc_status: null,
    },
  ],
  total: 3,
  limit: 50,
  offset: 0,
};

it('consulta GET /api/v1/admin/audit-log con el parámetro real action y filtra usuarios cargados en cliente', async () => {
  const auditActionsRequested: Array<string | null> = [];

  mockServer.use(
    http.get('*/api/v1/admin/users', () => HttpResponse.json(sampleUsersPage)),
    http.get('*/api/v1/admin/audit-log', ({ request }) => {
      const url = new URL(request.url);
      const action = url.searchParams.get('action');
      auditActionsRequested.push(action);

      const allItems = [
        {
          id: 'aud-1',
          actor_user_id: 'usr-admin-1',
          action: 'broker_activated',
          target_type: 'user',
          target_id: 'usr-brk-1',
          payload: { status: 'active' },
          occurred_at: '2026-11-12T16:00:00Z',
        },
        {
          id: 'aud-2',
          actor_user_id: 'usr-admin-1',
          action: 'premium_changed',
          target_type: 'user',
          target_id: 'usr-inv-1',
          payload: { is_premium: true },
          occurred_at: '2026-11-12T17:00:00Z',
        },
      ];

      const items = action
        ? allItems.filter((item) => item.action === action)
        : allItems;
      return HttpResponse.json({
        items,
        total: items.length,
        limit: 50,
        offset: 0,
      });
    }),
  );

  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <AdminPanel />
    </QueryClientProvider>,
  );

  await waitFor(() =>
    expect(screen.getByText('Maria Velez')).toBeInTheDocument(),
  );

  // Filtrado en cliente sobre usuarios cargados
  fireEvent.click(
    screen.getByRole('button', { name: /Usuarios & Plan Prémium/ }),
  );
  expect(screen.getByText('Mostrando 3 de 3 cuentas cargadas')).toBeVisible();

  fireEvent.change(screen.getByLabelText('Buscar usuario o correo'), {
    target: { value: 'inversor@' },
  });
  expect(screen.getByText('Mostrando 1 de 3 cuentas cargadas')).toBeVisible();
  expect(screen.getByText('Juan Leon')).toBeVisible();

  // Auditoría conectada con ?action=
  fireEvent.click(
    screen.getByRole('button', { name: /Bitácora de Auditoría/ }),
  );
  expect(await screen.findByText('2 eventos mostrados')).toBeVisible();

  const auditSelect = screen.getByLabelText('Filtrar por acción de auditoría');
  fireEvent.change(auditSelect, { target: { value: 'broker_activated' } });

  await waitFor(() =>
    expect(auditActionsRequested).toContain('broker_activated'),
  );
  expect(await screen.findByText('1 eventos mostrados')).toBeVisible();
});

it('alterna tema con @/lib/theme y valida formularios noValidate en Mercados y Alta Admin', async () => {
  mockServer.use(
    http.get('*/api/v1/admin/users', () => HttpResponse.json(sampleUsersPage)),
    http.get('*/api/v1/admin/audit-log', () =>
      HttpResponse.json({ items: [], total: 0, limit: 50, offset: 0 }),
    ),
  );

  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <AdminPanel />
    </QueryClientProvider>,
  );

  fireEvent.click(screen.getByRole('button', { name: 'Cambiar tema' }));
  expect(document.documentElement.dataset.theme).toBe('light');

  fireEvent.click(screen.getByRole('button', { name: /Horarios Bursátiles/ }));
  fireEvent.click(
    await screen.findByRole('button', {
      name: /\+ Agregar Excepción al Calendario/,
    }),
  );
  expect(await screen.findByRole('alert')).toHaveTextContent(
    /Debes seleccionar una fecha para la excepción/,
  );

  fireEvent.click(
    screen.getByRole('button', { name: /Alta de Administradores/ }),
  );
  fireEvent.click(
    screen.getByRole('button', { name: /Registrar Administrador Delegado/ }),
  );
  expect(await screen.findByRole('alert')).toHaveTextContent(
    /nombres y apellidos completos/,
  );
});

it('muestra SessionClosedOverlay cuando la sesión admin expira con 401', async () => {
  mockServer.use(
    http.get('*/api/v1/admin/users', () =>
      HttpResponse.json({ code: 'NOT_AUTHENTICATED' }, { status: 401 }),
    ),
    http.get('*/api/v1/admin/audit-log', () =>
      HttpResponse.json({ code: 'NOT_AUTHENTICATED' }, { status: 401 }),
    ),
  );

  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <AdminPanel />
    </QueryClientProvider>,
  );

  expect(await screen.findByRole('alertdialog')).toHaveTextContent(
    /Vuelve a iniciar sesión/,
  );
});
