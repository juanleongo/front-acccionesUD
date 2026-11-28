// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { expect, it, vi } from 'vitest';
import { browserHttp } from '@/lib/api/client';
import type { JsonRequest } from '@/lib/api/http-port';
import { PremiumTools } from './PremiumTools';
vi.mock('@/lib/api/client', () => ({ browserHttp: { request: vi.fn() } }));
it('crea listas, agrega instrumentos y permite eliminar alertas con confirmación', async () => {
  let lists: { id: string; name: string; symbols: string[] }[] = [];
  let alerts = [
    {
      id: 'a1',
      symbol: 'AAPL',
      comparator: 'above',
      threshold: '100',
      status: 'active',
      created_at: null,
      triggered_at: null,
    },
  ];
  vi.mocked(browserHttp.request).mockImplementation(async (input) => {
    const o = input as unknown as JsonRequest<unknown>;
    let data: unknown;
    if (o.path === '/api/v1/watchlists') {
      if (o.method === 'POST') {
        lists = [{ id: 'l1', name: 'Mis acciones', symbols: [] }];
        data = lists[0];
      } else data = lists;
    } else if (o.path === '/api/v1/watchlists/l1') data = lists[0];
    else if (o.path === '/api/v1/watchlists/l1/items') {
      lists[0]!.symbols = ['BRK.B'];
      data = lists[0];
    } else if (o.path === '/api/v1/price-alerts') data = alerts;
    else if (o.path === '/api/v1/price-alerts/a1' && o.method === 'DELETE') {
      alerts = [];
      return undefined as never;
    } else throw new Error('Unexpected path');
    return o.parse(data) as never;
  });
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <PremiumTools userId="u1" />
    </QueryClientProvider>,
  );
  await screen.findByText('Crea tu primera lista.');
  fireEvent.change(screen.getByLabelText('Nombre de la lista'), {
    target: { value: 'Mis acciones' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Crear lista' }));
  const symbol = await screen.findByLabelText('Símbolo para seguir');
  await waitFor(() => expect(symbol).toBeEnabled());
  fireEvent.change(symbol, { target: { value: 'BRK.B' } });
  fireEvent.click(screen.getByRole('button', { name: 'Agregar instrumento' }));
  await screen.findByRole('button', { name: 'Quitar BRK.B' });
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Eliminar' })).toBeEnabled(),
  );
  fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));
  expect(
    vi
      .mocked(browserHttp.request)
      .mock.calls.some(([o]) => o.method === 'DELETE'),
  ).toBe(false);
  fireEvent.click(
    screen.getByRole('button', { name: 'Confirmar eliminación' }),
  );
  await waitFor(() =>
    expect(browserHttp.request).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/api/v1/price-alerts/a1',
        method: 'DELETE',
        response: 'empty',
      }),
    ),
  );
});
