// @vitest-environment jsdom
import {
  fireEvent,
  render,
  screen,
  waitFor,
  act,
} from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { setAppLocale } from '@/lib/i18n';
import { getPublicMarketPage } from '@/lib/market-explorer';
import { MarketExplorer } from './MarketExplorer';
vi.mock('@/lib/market-explorer', () => ({ getPublicMarketPage: vi.fn() }));
const page = {
  results: [
    {
      symbol: 'AAPL',
      name: 'Apple Inc.',
      exchange: 'NASDAQ',
      tradable: true,
      price: 150,
      change_ratio: 0.02,
      as_of: '2026-11-25T15:00:00Z',
      feed: 'iex',
      is_delayed: false,
      is_stale: false,
    },
  ],
  markets: [{ code: 'NASDAQ', name: 'NASDAQ' }],
  total: 12,
  page: 1,
  page_size: 6,
  retrieved_at: '2026-11-25T15:00:00Z',
  market_open: true,
  quotes_unavailable: false,
  source: 'alpaca' as const,
  currency: 'USD',
};
beforeEach(() => {
  vi.mocked(getPublicMarketPage).mockReset().mockResolvedValue(page);
});
afterEach(() => {
  setAppLocale('es');
  localStorage.clear();
});
function setup() {
  render(
    <QueryClientProvider
      client={
        new QueryClient({
          defaultOptions: { queries: { retry: false, gcTime: 0 } },
        })
      }
    >
      <MarketExplorer />
    </QueryClientProvider>,
  );
}
it('shows the Alpaca catalog, freshness and sign-in links without an embedded provider', async () => {
  setup();
  await screen.findByRole('table');
  expect(screen.getByRole('link', { name: 'AAPL' })).toHaveAttribute(
    'href',
    '/login',
  );
  expect(screen.getByText('Apple Inc.')).toBeVisible();
  expect(document.querySelector('iframe')).toBeNull();
  expect(screen.getByText(/iex/)).toBeVisible();
});
it('sends search, exchange and pagination filters to the API and hides previous rows during a request', async () => {
  setup();
  await screen.findByRole('table');
  fireEvent.change(screen.getByLabelText('Empresa o símbolo'), {
    target: { value: 'Apple' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Buscar' }));
  await waitFor(() =>
    expect(getPublicMarketPage).toHaveBeenLastCalledWith(
      'Apple',
      '',
      1,
      expect.any(AbortSignal),
    ),
  );
  await screen.findByRole('table');
  fireEvent.change(screen.getByLabelText('Bolsa'), {
    target: { value: 'NASDAQ' },
  });
  await waitFor(() =>
    expect(getPublicMarketPage).toHaveBeenLastCalledWith(
      'Apple',
      'NASDAQ',
      1,
      expect.any(AbortSignal),
    ),
  );
  await screen.findByRole('table');
  fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
  await waitFor(() =>
    expect(getPublicMarketPage).toHaveBeenLastCalledWith(
      'Apple',
      'NASDAQ',
      2,
      expect.any(AbortSignal),
    ),
  );
});
it('shows API failures without invented quotes and supports English', async () => {
  vi.mocked(getPublicMarketPage).mockRejectedValue(new Error('offline'));
  setup();
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'No pudimos actualizar el mercado.',
  );
  expect(screen.queryByRole('table')).not.toBeInTheDocument();
  act(() => setAppLocale('en'));
  expect(screen.getByRole('alert')).toHaveTextContent(
    'Could not refresh market data.',
  );
});
