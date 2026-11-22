// @vitest-environment jsdom
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { setAppLocale } from '@/lib/i18n';
import { MarketSessionSummary } from './MarketSessionSummary';
import { getClock, getMarkets, getStatus } from './api';

vi.mock('./api', () => ({
  getClock: vi.fn(),
  getMarkets: vi.fn(),
  getStatus: vi.fn(),
  tz: 'America/New_York',
}));
const day = '2026-11-20';
const clock = {
  timestamp: `${day}T16:00:00Z`,
  next_open: `${day}T14:30:00Z`,
  next_close: `${day}T21:00:00Z`,
  is_open: true,
  time_zone: 'America/New_York',
};
beforeEach(() => {
  vi.mocked(getMarkets)
    .mockReset()
    .mockResolvedValue([
      { code: 'NYSE', name: 'New York Stock Exchange' },
      { code: 'ARCA', name: 'NYSE Arca' },
      { code: 'AMEX', name: 'NYSE American' },
    ]);
  vi.mocked(getClock).mockReset().mockResolvedValue(clock);
  vi.mocked(getStatus)
    .mockReset()
    .mockImplementation(async (market) => ({
      market,
      date: day,
      open: market !== 'ARCA',
      open_at: market === 'ARCA' ? null : `${day}T14:30:00Z`,
      close_at: market === 'ARCA' ? null : `${day}T21:00:00Z`,
      override: market === 'ARCA',
    }));
});
afterEach(() => {
  setAppLocale('es');
  localStorage.clear();
});
function mount() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  const result = render(
    <QueryClientProvider client={client}>
      <MarketSessionSummary />
    </QueryClientProvider>,
  );
  return { ...result, client };
}

it('lists every API exchange and resolves independent statuses using the server New York date', async () => {
  mount();
  await waitFor(() => expect(screen.getAllByText('Abierta')).toHaveLength(2));
  expect(screen.getByText('Cerrada')).toBeVisible();
  expect(screen.getByText('ARCA')).toBeVisible();
  expect(screen.getByText('AMEX')).toBeVisible();
  expect(getStatus).toHaveBeenCalledWith('AMEX', day, expect.any(AbortSignal));
  expect(
    screen.queryByText(/Wall Street.*Abierta ahora/),
  ).not.toBeInTheDocument();
});

it('does not show cached open states after a failed refresh and recovers on retry in English', async () => {
  setAppLocale('en');
  const { client } = mount();
  await waitFor(() => expect(screen.getAllByText('Open')).toHaveLength(2));
  vi.mocked(getClock).mockRejectedValue(new Error('temporarily unavailable'));
  await act(async () => {
    await client.invalidateQueries({ queryKey: ['markets', 'clock'] });
  });
  expect(await screen.findAllByText('Unconfirmed')).toHaveLength(3);
  expect(screen.queryByText('Open')).not.toBeInTheDocument();
  vi.mocked(getClock).mockResolvedValue(clock);
  fireEvent.click(screen.getByRole('button', { name: 'Retry status' }));
  await waitFor(() => expect(screen.getAllByText('Open')).toHaveLength(2));
});

it('keeps a missing exchange schedule unconfirmed without losing the other exchange statuses', async () => {
  const previous = vi.mocked(getStatus).getMockImplementation()!;
  vi.mocked(getStatus).mockImplementation((market, date, signal) =>
    market === 'AMEX'
      ? Promise.reject(new Error('missing schedule'))
      : previous(market, date, signal),
  );
  mount();
  expect(await screen.findByText('Sin confirmar')).toBeVisible();
  expect(screen.getByText('Abierta')).toBeVisible();
  expect(screen.getByText('Cerrada')).toBeVisible();
});
