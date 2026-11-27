// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { setAppLocale } from '@/lib/i18n';
import { getInstrumentDetails, previewOrder } from '../trading-api';
import { OrderBudgetCalculator } from './OrderBudgetCalculator';

vi.mock('../trading-api', () => ({
  getInstrumentDetails: vi.fn(),
  previewOrder: vi.fn(),
}));
beforeEach(() => {
  vi.resetAllMocks();
  setAppLocale('es');
  vi.mocked(getInstrumentDetails).mockResolvedValue({
    symbol: 'NVDA',
    tradable: true,
    fractionable: true,
  });
  vi.mocked(previewOrder).mockImplementation(async (input) => {
    const gross = Number(input.qty) * Number(input.limit_price ?? '100');
    return {
      reference_price: '100',
      estimated_amount: (gross * 1.02).toFixed(2),
      reference_commission: (gross * 0.02).toFixed(2),
      available_buying_power: '1000',
      requires_extra_authorization: false,
      authorization_method: 'none',
      market_open: true,
      scheduled_for: null,
    };
  });
});
async function setup() {
  const apply = vi.fn(),
    reset = vi.fn();
  render(
    <QueryClientProvider
      client={
        new QueryClient({
          defaultOptions: { queries: { retry: false, gcTime: 0 } },
        })
      }
    >
      <OrderBudgetCalculator
        symbol="NVDA"
        scheduleIfClosed={false}
        onApply={apply}
        onReset={reset}
        onOpenChange={vi.fn()}
      />
    </QueryClientProvider>,
  );
  const details = screen
    .getByText('Calcular una compra por monto')
    .closest('details')!;
  details.open = true;
  fireEvent(details, new Event('toggle'));
  await screen.findByText('Este instrumento admite fracciones de acción.');
  return { apply, reset };
}
it('aplica 100 USD a acciones y añade la comisión real al total', async () => {
  const { apply, reset } = await setup();
  expect(
    screen.queryByLabelText('Precio máximo por acción (USD)'),
  ).not.toBeInTheDocument();
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  fireEvent.click(
    screen.getByRole('radio', { name: /^Sumar comisión al monto/ }),
  );
  fireEvent.click(screen.getByRole('button', { name: 'Calcular compra' }));
  await waitFor(() =>
    expect(apply).toHaveBeenCalledWith(
      expect.objectContaining({
        qty: '1',
        type: 'limit',
        limit_price: '100.00',
      }),
      { amount: '100', mode: 'shares' },
    ),
  );
  const result = within(
    screen.getByRole('region', { name: 'Desglose del cálculo' }),
  );
  expect(result.getAllByText('$100.00 USD')).toHaveLength(2);
  expect(result.getByText('$2.00 USD')).toBeVisible();
  expect(result.getByText('$102.00 USD')).toBeVisible();
  expect(previewOrder).toHaveBeenCalledTimes(2);
  fireEvent.click(
    screen.getByRole('radio', { name: /^Incluir comisión en el monto/ }),
  );
  expect(
    screen.queryByRole('region', { name: 'Desglose del cálculo' }),
  ).not.toBeInTheDocument();
  expect(reset).toHaveBeenCalled();
  expect(apply).toHaveBeenCalledOnce();
});
it('solo muestra validaciones de monto después de solicitar el cálculo', async () => {
  await setup();
  fireEvent.change(screen.getByLabelText('Presupuesto total (USD)'), {
    target: { value: '0' },
  });
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Calcular compra' }));
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Ingresa un monto mayor a cero',
  );
  expect(previewOrder).not.toHaveBeenCalled();
});
it('mantiene los 100 USD como total cuando incluye la comisión', async () => {
  const { apply } = await setup();
  fireEvent.click(screen.getByRole('button', { name: 'Calcular compra' }));
  await waitFor(() =>
    expect(apply).toHaveBeenCalledWith(
      expect.objectContaining({ qty: '0.980392156' }),
      { amount: '100', mode: 'total' },
    ),
  );
  const result = within(
    screen.getByRole('region', { name: 'Desglose del cálculo' }),
  );
  expect(result.getByText('$98.04 USD')).toBeVisible();
  expect(result.getByText('$1.96 USD')).toBeVisible();
  // Unit price and total both equal 100; the fee was not added twice.
  expect(result.getAllByText('$100.00 USD')).toHaveLength(2);
  expect(result.queryByText('$102.00 USD')).not.toBeInTheDocument();
});
it('rechaza un total que supera el presupuesto tras verificarlo con el servidor', async () => {
  const { apply } = await setup();
  const base = {
    reference_price: '100',
    reference_commission: '2',
    available_buying_power: '1000',
    requires_extra_authorization: false,
    authorization_method: 'none' as const,
    market_open: true,
    scheduled_for: null,
  };
  vi.mocked(previewOrder)
    .mockResolvedValueOnce({ ...base, estimated_amount: '102' })
    .mockResolvedValueOnce({ ...base, estimated_amount: '101' });
  fireEvent.click(screen.getByRole('button', { name: 'Calcular compra' }));
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Los costos cambiaron',
  );
  expect(apply).not.toHaveBeenCalled();
});
