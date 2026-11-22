// @vitest-environment jsdom
import { act, fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { expect, it, vi } from 'vitest';
import { ApiError } from '@/lib/api';
import { Markets } from './Markets';
import { getMarkets } from './api';

vi.mock('./api', () => ({ getMarkets: vi.fn() }));
vi.mock('./PriceChart', () => ({
  PriceChart: () => <p>Gráfico disponible</p>,
}));
vi.mock('./MarketClock', () => ({ MarketClock: () => null }));
vi.mock('./MarketSchedule', () => ({ MarketSchedule: () => null }));

it('muestra espera sin porcentajes falsos, termina al vencer la petición y permite reintentar', async () => {
  let reject!: (error: Error) => void;
  vi.mocked(getMarkets).mockImplementationOnce(
    () =>
      new Promise((_, fail) => {
        reject = fail;
      }),
  );
  const client = new QueryClient({
    defaultOptions: { queries: { retry: 2, gcTime: 0 } },
  });
  const { container } = render(
    <QueryClientProvider client={client}>
      <Markets />
    </QueryClientProvider>,
  );
  expect(screen.getByRole('status')).toHaveTextContent('Consultando mercados');
  expect(container.querySelector('circle')).toBeInTheDocument();
  expect(screen.queryByText(/\d+%/)).not.toBeInTheDocument();
  await act(async () =>
    reject(new ApiError('transport', 'timeout', { timeout: true })),
  );
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'La consulta tardó demasiado',
  );
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
  expect(getMarkets).toHaveBeenCalledTimes(1);
  vi.mocked(getMarkets).mockResolvedValueOnce([
    { code: 'NASDAQ', name: 'Nasdaq' },
  ]);
  fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
  expect(await screen.findByText('Gráfico disponible')).toBeVisible();
  expect(getMarkets).toHaveBeenCalledTimes(2);
  client.clear();
});
