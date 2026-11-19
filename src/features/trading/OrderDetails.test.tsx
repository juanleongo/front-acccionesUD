// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, expect, it, vi } from 'vitest';
import { OrderDetails } from './OrderDetails';
import { getOrder, orderAction, type OrderDetail } from './trading-api';
vi.mock('./trading-api', () => ({ getOrder: vi.fn(), orderAction: vi.fn() }));
const order = {
  id: 'order-1',
  symbol: 'AAPL',
  side: 'buy',
  qty: '2',
  filled_qty: '0',
  filled_avg_price: null,
  fully_filled: false,
  status: 'SUBMITTED',
  status_cause: null,
  provider_status: 'new',
  scheduled_for: null,
  limit_price: null,
  stop_price: null,
  trail_price: null,
  trail_percent: null,
  time_in_force: 'day',
  legs: [],
  executions: [],
  events: [],
  reauthorizations: [],
  review_comments: [],
  returned_for_changes: false,
} as unknown as OrderDetail;
beforeEach(() => {
  vi.mocked(getOrder).mockResolvedValue(order);
  vi.mocked(orderAction).mockResolvedValue(order);
});
function setup() {
  const updated = vi.fn();
  render(
    <QueryClientProvider
      client={
        new QueryClient({
          defaultOptions: { queries: { retry: false, gcTime: 0 } },
        })
      }
    >
      <OrderDetails
        id="order-1"
        onUpdated={updated}
        onEdit={vi.fn()}
        onClose={vi.fn()}
      />
    </QueryClientProvider>,
  );
  return updated;
}
it('pide confirmación y conserva el estado devuelto ante cancelación pendiente', async () => {
  const updated = setup();
  fireEvent.click(
    await screen.findByRole('button', { name: 'Cancelar orden' }),
  );
  expect(orderAction).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Confirmar acción' }));
  await waitFor(() => expect(updated).toHaveBeenCalledOnce());
  expect(orderAction).toHaveBeenCalledWith('order-1', 'cancel', {
    reason: 'no_longer_needed',
    confirmed: true,
  });
  expect(screen.getByRole('status')).toHaveTextContent('SUBMITTED');
});
it('muestra los precios de reautorización del servidor y envía la decisión explícita', async () => {
  vi.mocked(getOrder).mockResolvedValue({
    ...order,
    status: 'HELD',
    reauthorizations: [
      {
        id: 'r1',
        previous_price: '100',
        updated_price: '105',
        deadline: '2026-12-01T00:00:00Z',
        decision: null,
      },
    ],
  });
  setup();
  fireEvent.click(
    await screen.findByRole('button', { name: 'Aceptar nuevo precio' }),
  );
  expect(screen.getByText(/precio anterior/)).toHaveTextContent(
    '$100 → nuevo $105',
  );
  expect(orderAction).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Confirmar acción' }));
  await waitFor(() =>
    expect(orderAction).toHaveBeenCalledWith('order-1', 'reauthorization', {
      decision: 'accept',
    }),
  );
});
it('no muestra éxito ni actualiza la lista si falla la cancelación', async () => {
  vi.mocked(orderAction).mockRejectedValueOnce(new Error('No disponible'));
  const updated = setup();
  fireEvent.click(
    await screen.findByRole('button', { name: 'Cancelar orden' }),
  );
  fireEvent.click(screen.getByRole('button', { name: 'Confirmar acción' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('No disponible');
  expect(updated).not.toHaveBeenCalled();
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
});
