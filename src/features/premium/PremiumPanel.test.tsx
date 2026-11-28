// @vitest-environment jsdom
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, expect, it, vi } from 'vitest';
import { browserHttp } from '@/lib/api/client';
import type { JsonRequest } from '@/lib/api/http-port';
import { PremiumPanel } from './PremiumPanel';
import { checkoutSchema } from './premium-api';
vi.mock('@/lib/api/client', () => ({ browserHttp: { request: vi.fn() } }));
let premium = false;
let subscribed = false;
let canceled = false;
const subscription = () => ({
  id: 'sub-1',
  plan: 'monthly',
  status: 'active',
  current_period_start: '2026-11-01T00:00:00Z',
  current_period_end: '2026-12-01T00:00:00Z',
  cancel_at_period_end: canceled,
  cancel_reason: canceled ? 'Fin de prueba' : null,
  cancel_requested_at: null,
});
beforeEach(() => {
  vi.resetAllMocks();
  premium = false;
  subscribed = false;
  canceled = false;
  vi.mocked(browserHttp.request).mockImplementation(async (input) => {
    const options = input as unknown as JsonRequest<unknown>;
    let data: unknown;
    switch (options.path) {
      case '/api/v1/users/me':
        data = { user_id: 'u1', is_premium: premium, roles: ['investor'] };
        break;
      case '/api/v1/subscriptions/plans':
        data = [
          {
            code: 'monthly',
            price: '12.00',
            currency: 'USD',
            interval: 'month',
          },
          {
            code: 'annual',
            price: '120.00',
            currency: 'USD',
            interval: 'year',
          },
        ];
        break;
      case '/api/v1/subscriptions/me':
        data = {
          subscription: subscribed ? subscription() : null,
          plan: null,
          latest_payment: null,
          next_charge_at: null,
        };
        break;
      case '/api/v1/subscriptions/me/payments':
        data = {
          items: [],
          next_cursor: options.query?.cursor ? null : 'next',
        };
        break;
      case '/api/v1/subscriptions/me/cancel':
        canceled = true;
        data = subscription();
        break;
      case '/api/v1/subscriptions/checkout':
        throw new Error('Stripe no disponible');
      case '/api/v1/watchlists':
      case '/api/v1/price-alerts':
        data = [];
        break;
      default:
        throw new Error('Unexpected ' + options.path);
    }
    return options.parse(data) as never;
  });
});
function mount(returnStatus?: 'success' | 'cancel') {
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <PremiumPanel {...(returnStatus ? { returnStatus } : {})} />
    </QueryClientProvider>,
  );
}
it('volver de Stripe no concede premium ni consulta herramientas restringidas', async () => {
  mount('success');
  await screen.findByText('Cuenta estándar');
  expect(screen.queryByText('Herramientas Premium')).not.toBeInTheDocument();
  expect(
    vi
      .mocked(browserHttp.request)
      .mock.calls.some(([o]) => o.path === '/api/v1/watchlists'),
  ).toBe(false);
});
it('contrata el plan elegido solo tras confirmar y muestra errores sin éxito ficticio', async () => {
  mount();
  const buttons = await screen.findAllByRole('button', {
    name: 'Contratar plan',
  });
  await waitFor(() => expect(buttons[1]).toBeEnabled());
  fireEvent.click(buttons[1]!);
  expect(screen.getByRole('button', { name: 'Confirmar' })).toBeDisabled();
  fireEvent.click(screen.getByRole('checkbox'));
  fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));
  await screen.findByText('Stripe no disponible');
  expect(browserHttp.request).toHaveBeenCalledWith(
    expect.objectContaining({
      path: '/api/v1/subscriptions/checkout',
      body: { plan: 'annual' },
    }),
  );
});
it('cancela con motivo sin quitar anticipadamente el acceso premium', async () => {
  premium = true;
  subscribed = true;
  mount();
  fireEvent.click(
    await screen.findByRole('button', { name: 'Cancelar renovación' }),
  );
  fireEvent.change(screen.getByLabelText('Motivo'), {
    target: { value: 'Fin de prueba' },
  });
  fireEvent.click(screen.getByRole('checkbox'));
  fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));
  await screen.findByText(
    'Cancelación programada al finalizar el período contratado.',
  );
  expect(screen.getByText('Herramientas Premium')).toBeVisible();
  expect(browserHttp.request).toHaveBeenCalledWith(
    expect.objectContaining({
      path: '/api/v1/subscriptions/me/cancel',
      body: { reason: 'Fin de prueba' },
    }),
  );
});
it('pagina pagos con 10 registros usando el cursor del servidor', async () => {
  mount();
  const next = await screen.findByRole('button', { name: 'Siguiente' });
  await waitFor(() => expect(next).toBeEnabled());
  fireEvent.click(next);
  await waitFor(() =>
    expect(browserHttp.request).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/api/v1/subscriptions/me/payments',
        query: { page_size: '10', cursor: 'next' },
      }),
    ),
  );
});
it('rechaza URLs de checkout ajenas a Stripe', () => {
  for (const url of [
    'javascript:alert(1)',
    'https://checkout.stripe.com.evil.test',
    'https://evil.test',
    'http://checkout.stripe.com',
  ])
    expect(
      checkoutSchema.safeParse({ checkout_session_id: 'cs', url }).success,
    ).toBe(false);
  expect(
    checkoutSchema.safeParse({
      checkout_session_id: 'cs',
      url: 'https://checkout.stripe.com/c/pay/cs_test',
    }).success,
  ).toBe(true);
});
