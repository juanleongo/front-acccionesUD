// @vitest-environment jsdom
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { expect, it, vi, beforeEach } from 'vitest';
import { PortfolioDashboard } from './PortfolioDashboard';
import * as api from './portfolio-api';
vi.mock('./portfolio-api', () => ({
  fetchPortfolioPositions: vi.fn(),
  fetchPortfolioRiskProfile: vi.fn(),
  fetchPortfolioStatistics: vi.fn(),
  fetchPortfolioExecutions: vi.fn(),
  fetchPortfolioReports: vi.fn(),
  fetchPortfolioReport: vi.fn(),
  createPortfolioReport: vi.fn(),
}));
const data = {
  positions: [
    {
      symbol: 'TEST',
      exchange: 'NASDAQ',
      sector: null,
      qty: '2',
      reserved_qty: '1',
      price: '15',
      price_source: 'alpaca_position' as const,
      average_cost: '10',
      market_value: '30',
      cost_basis: '20',
      unrealized_pnl: '10',
      reconciliation_mismatch: false,
    },
  ],
  totals: { market_value: '30', cost_basis: '20', unrealized_pnl: '10' },
  view_type: 'table' as const,
  positions_as_of: '2026-11-20T15:00:00Z',
  currency: 'USD' as const,
};
beforeEach(() =>
  vi.mocked(api.fetchPortfolioPositions).mockResolvedValue(data),
);
function setup() {
  const navigate = vi.fn();
  render(
    <QueryClientProvider
      client={
        new QueryClient({
          defaultOptions: { queries: { retry: false, gcTime: 0 } },
        })
      }
    >
      <PortfolioDashboard onNavigateToOrder={navigate} />
    </QueryClientProvider>,
  );
  return navigate;
}
it('muestra posiciones recibidas y navega a operar el instrumento seleccionado', async () => {
  const navigate = setup();
  await screen.findByText('TEST');
  expect(screen.getAllByText('$30.00 USD').length).toBeGreaterThan(0);
  expect(screen.getByText(/Reservadas: 1/)).toBeInTheDocument();
  expect(screen.queryByText('NVDA')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Operar TEST' }));
  expect(navigate).toHaveBeenCalledWith('TEST');
});
it('no sustituye un fallo por posiciones de ejemplo', async () => {
  vi.mocked(api.fetchPortfolioPositions).mockRejectedValueOnce(
    new Error('offline'),
  );
  setup();
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'No se pudo consultar',
  );
  expect(screen.queryByText('TEST')).not.toBeInTheDocument();
  expect(screen.queryByText('AAPL')).not.toBeInTheDocument();
});
it('distingue un portafolio vacío de un error', async () => {
  vi.mocked(api.fetchPortfolioPositions).mockResolvedValue({
    ...data,
    positions: [],
    totals: { market_value: '0', cost_basis: '0', unrealized_pnl: '0' },
  });
  setup();
  expect(
    await screen.findByText(/No tienes posiciones abiertas/),
  ).toBeInTheDocument();
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});
