// @vitest-environment jsdom
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, expect, it, vi } from 'vitest';
import { useState, type ReactNode } from 'react';
import { InstrumentQuoteCard } from './InstrumentQuoteCard';
import { OrderEstimateCard } from './OrderEstimateCard';
import {
  estimateOrder,
  getInstrumentQuote,
  type InstrumentQuote,
  type OrderInput,
  type Preview,
} from '../trading-api';
const session = vi.hoisted(() => ({
  state: 'unknown' as 'unknown' | 'closed' | 'open',
  refresh: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../use-instrument-session', () => ({
  useInstrumentSession: () => session,
}));
vi.mock('../trading-api', () => ({
  estimateOrder: vi.fn(),
  getInstrumentQuote: vi.fn(),
}));
const draft: OrderInput = {
  symbol: 'AAPL',
  side: 'buy',
  qty: '2',
  type: 'market',
  order_class: 'simple',
  time_in_force: 'day',
  schedule_if_closed: false,
};
const quote: InstrumentQuote = {
  symbol: 'AAPL',
  last_trade_price: '100',
  bid_price: '99.9',
  ask_price: '100.1',
  updated_at: '2026-11-26T15:00:00Z',
  as_of: '2026-11-26T15:00:00Z',
  currency: 'USD',
  source: 'Alpaca',
  is_delayed: false,
  is_stale: false,
};
const estimate: Preview = {
  reference_price: '100',
  estimated_amount: '204',
  reference_commission: '4',
  available_buying_power: '1000',
  market_open: true,
  scheduled_for: null,
  requires_extra_authorization: false,
  authorization_method: 'none',
};
function Wrapper({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { retry: false, gcTime: 0 } },
      }),
  );
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
beforeEach(() => {
  session.state = 'unknown';
  vi.mocked(getInstrumentQuote).mockResolvedValue(quote);
  vi.mocked(estimateOrder).mockResolvedValue(estimate);
});
it('muestra la cotización pendiente sin sembrar un precio cero ni reutilizar el de otra acción', async () => {
  let resolve!: (value: InstrumentQuote) => void;
  vi.mocked(getInstrumentQuote).mockImplementation((symbol) =>
    symbol === 'AAPL'
      ? Promise.resolve(quote)
      : new Promise((done) => {
          resolve = done;
        }),
  );
  const view = render(<InstrumentQuoteCard symbol="AAPL" />, {
    wrapper: Wrapper,
  });
  expect(await screen.findByText('$100.00 USD')).toBeVisible();
  view.rerender(<InstrumentQuoteCard symbol="MSFT" />);
  expect(screen.queryByText('$100.00 USD')).not.toBeInTheDocument();
  expect(screen.queryByText('$0.00 USD')).not.toBeInTheDocument();
  expect(screen.getByText('Consultando precio…')).toBeVisible();
  await act(async () =>
    resolve({ ...quote, symbol: 'MSFT', last_trade_price: '250' }),
  );
  expect(await screen.findByText('$250.00 USD')).toBeVisible();
});
it('identifica datos atrasados y no interpreta un precio ausente como cero', async () => {
  vi.mocked(getInstrumentQuote).mockResolvedValue({
    ...quote,
    is_stale: true,
    last_trade_price: null,
    bid_price: null,
    ask_price: null,
  });
  render(<InstrumentQuoteCard symbol="AAPL" />, { wrapper: Wrapper });
  expect(await screen.findByText(/Precio de referencia/)).toBeVisible();
  expect(screen.getAllByText('—')).toHaveLength(3);
  expect(screen.queryByText('$0.00 USD')).not.toBeInTheDocument();
});
it('deja reintentar un error de cotización sin inventar precios', async () => {
  vi.mocked(getInstrumentQuote).mockRejectedValueOnce(
    new Error('Sin conexión'),
  );
  render(<InstrumentQuoteCard symbol="AAPL" />, { wrapper: Wrapper });
  expect(await screen.findByText(/No pudimos actualizar/)).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'Actualizar precio' }));
  expect(await screen.findByText('$100.00 USD')).toBeVisible();
});
it('explica el mercado cerrado sin presentar la referencia anterior como un error de actualización', async () => {
  session.state = 'closed';
  vi.mocked(getInstrumentQuote).mockResolvedValue({ ...quote, is_stale: true });
  render(<InstrumentQuoteCard symbol="AAPL" />, { wrapper: Wrapper });
  expect(await screen.findByText(/^Mercado cerrado/)).toBeVisible();
  expect(screen.queryByText(/^Precio de referencia/)).not.toBeInTheDocument();
  expect(screen.queryByText(/Dato antiguo/)).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Actualizar precio' }));
  expect(
    await screen.findByText(/No hay una cotización más reciente/),
  ).toBeVisible();
  expect(screen.getByText(/^Mercado cerrado/)).toBeVisible();
});
it('mantiene visible un fallo de la fuente aunque la sesión esté cerrada', async () => {
  session.state = 'closed';
  vi.mocked(getInstrumentQuote).mockResolvedValue({
    ...quote,
    is_stale: true,
    served_from_cache: true,
  });
  render(<InstrumentQuoteCard symbol="AAPL" />, { wrapper: Wrapper });
  expect(await screen.findByText(/^Referencia guardada/)).toBeVisible();
});
it('confirma la consulta sin decir precio actualizado si solo cambió la fecha de la fuente', async () => {
  vi.mocked(getInstrumentQuote)
    .mockResolvedValueOnce(quote)
    .mockResolvedValue({ ...quote, updated_at: '2026-11-26T15:01:00Z' });
  render(<InstrumentQuoteCard symbol="AAPL" />, { wrapper: Wrapper });
  await screen.findByText('$100.00 USD');
  fireEvent.click(screen.getByRole('button', { name: 'Actualizar precio' }));
  expect(await screen.findByText(/El precio no ha cambiado/)).toBeVisible();
});
it('distingue una actualización real de una fuente que continúa atrasada', async () => {
  vi.mocked(getInstrumentQuote)
    .mockResolvedValueOnce(quote)
    .mockResolvedValueOnce({ ...quote, last_trade_price: '101' })
    .mockResolvedValue({ ...quote, is_stale: true });
  render(<InstrumentQuoteCard symbol="AAPL" />, { wrapper: Wrapper });
  await screen.findByText('$100.00 USD');
  fireEvent.click(screen.getByRole('button', { name: 'Actualizar precio' }));
  expect(await screen.findByText(/Precio actualizado/)).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'Actualizar precio' }));
  expect(
    await screen.findByText(/No hay una cotización más reciente disponible/),
  ).toBeVisible();
});
it('usa el total de compra del servidor sin sumar dos veces la comisión', async () => {
  render(<OrderEstimateCard draft={draft} valid />, { wrapper: Wrapper });
  const label = await screen.findByText('Total de compra estimado');
  expect(within(label.parentElement!).getByText('$204.00 USD')).toBeVisible();
  expect(screen.queryByText('$208.00 USD')).not.toBeInTheDocument();
  expect(screen.getByText('$200.00 USD')).toBeVisible();
});
it('descarta el importe anterior mientras recalcula una cantidad nueva', async () => {
  let resolve!: (value: Preview) => void;
  vi.mocked(estimateOrder).mockImplementation((input) =>
    input.qty === '2'
      ? Promise.resolve(estimate)
      : new Promise((done) => {
          resolve = done;
        }),
  );
  const view = render(<OrderEstimateCard draft={draft} valid />, {
    wrapper: Wrapper,
  });
  await screen.findByText('$204.00 USD');
  view.rerender(<OrderEstimateCard draft={{ ...draft, qty: '3' }} valid />);
  expect(screen.queryByText('$204.00 USD')).not.toBeInTheDocument();
  await act(async () =>
    resolve({
      ...estimate,
      estimated_amount: '306',
      reference_commission: '6',
    }),
  );
  expect(await screen.findByText('$306.00 USD')).toBeVisible();
});
it('no calcula parámetros inválidos ni inventa una comisión cuando el servidor falla', async () => {
  const view = render(
    <OrderEstimateCard draft={{ ...draft, qty: '' }} valid={false} />,
    { wrapper: Wrapper },
  );
  expect(estimateOrder).not.toHaveBeenCalled();
  vi.mocked(estimateOrder).mockRejectedValue(new Error('No disponible'));
  view.rerender(<OrderEstimateCard draft={draft} valid />);
  expect(await screen.findByText(/No pudimos calcular/)).toBeVisible();
  expect(screen.queryByText('$0.00 USD')).not.toBeInTheDocument();
  await waitFor(() => expect(estimateOrder).toHaveBeenCalledOnce());
});
