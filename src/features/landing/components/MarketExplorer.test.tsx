// @vitest-environment jsdom
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { setAppLocale } from '@/lib/i18n';
import { applyTheme } from '@/lib/theme';
import { MarketExplorer } from './MarketExplorer';

afterEach(() => {
  vi.useRealTimers();
  setAppLocale('es');
  localStorage.clear();
  delete document.documentElement.dataset.theme;
});

it('embeds the official U.S. screener with search tools and sends stock links through sign in', async () => {
  render(<MarketExplorer />);
  const frame = await screen.findByTitle(
    'Explorador de acciones de TradingView',
  );
  const url = new URL(frame.getAttribute('src')!);
  expect(url.origin).toBe('https://www.tradingview-widget.com');
  expect(url.searchParams.get('locale')).toBe('es');
  expect(JSON.parse(decodeURIComponent(url.hash.slice(1)))).toMatchObject({
    market: 'america',
    showToolbar: true,
    largeChartUrl: `${window.location.origin}/login`,
  });
  expect(
    screen.getByRole('link', { name: 'Operar en Acciones UD →' }),
  ).toHaveAttribute('href', '/login');
  expect(
    screen.getByRole('link', {
      name: /Analizador de acciones por TradingView/,
    }),
  ).toHaveAttribute('href', 'https://www.tradingview.com/screener/');
  fireEvent.load(frame);
  expect(screen.queryByText('Cargando mercados…')).not.toBeInTheDocument();
  expect(screen.queryByRole('table')).not.toBeInTheDocument();
});

it('updates the external document when language or the current-tab theme changes', async () => {
  render(<MarketExplorer />);
  await screen.findByTitle('Explorador de acciones de TradingView');
  act(() => {
    setAppLocale('en');
    applyTheme('light');
  });
  await waitFor(() => {
    const frame = screen.getByTitle('TradingView stock screener');
    const url = new URL(frame.getAttribute('src')!);
    expect(url.searchParams.get('locale')).toBe('en');
    expect(JSON.parse(decodeURIComponent(url.hash.slice(1))).colorTheme).toBe(
      'light',
    );
  });
});

it('provides the official company search through the chart and keeps only one active widget', async () => {
  render(<MarketExplorer />);
  await screen.findByTitle('Explorador de acciones de TradingView');
  fireEvent.click(screen.getByRole('button', { name: 'Buscar y analizar' }));
  const frame = screen.getByTitle(
    'Gráfico y búsqueda de acciones de TradingView',
  );
  const url = new URL(frame.getAttribute('src')!);
  expect(url.pathname).toBe('/embed-widget/advanced-chart/');
  expect(JSON.parse(decodeURIComponent(url.hash.slice(1)))).toMatchObject({
    allow_symbol_change: true,
    timezone: 'America/New_York',
  });
  expect(
    screen.queryByTitle('Explorador de acciones de TradingView'),
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: 'Buscar y analizar' }),
  ).toHaveAttribute('aria-pressed', 'true');
});

it('bounds the loading state, retries with a new document and never substitutes sample prices', async () => {
  vi.useFakeTimers();
  render(<MarketExplorer />);
  await act(() => vi.advanceTimersByTimeAsync(1));
  const previous = screen.getByTitle('Explorador de acciones de TradingView');
  await act(() => vi.advanceTimersByTimeAsync(25000));
  expect(screen.getByRole('alert')).toHaveTextContent(
    'No pudimos abrir TradingView',
  );
  expect(
    screen.queryByTitle('Explorador de acciones de TradingView'),
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Recargar vista' }));
  const next = screen.getByTitle('Explorador de acciones de TradingView');
  expect(next).not.toBe(previous);
  fireEvent.load(next);
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  expect(screen.queryByText(/\$172\.50|\$198\.20/)).not.toBeInTheDocument();
});
