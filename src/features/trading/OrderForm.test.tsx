// @vitest-environment jsdom
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, expect, it, vi } from 'vitest';
import { OrderForm } from './OrderForm';
import {
  previewOrder,
  submitOrder,
  searchAssets,
  listTradingMarkets,
  type OrderDetail,
} from './trading-api';
vi.mock('./trading-api', () => ({
  previewOrder: vi.fn(),
  submitOrder: vi.fn(),
  searchAssets: vi.fn(),
  listTradingMarkets: vi.fn(),
  orderAction: vi.fn(),
  resubmitBody: vi.fn(),
}));
const preview = {
  reference_price: '100',
  estimated_amount: '100',
  reference_commission: '0',
  available_buying_power: '500',
  requires_extra_authorization: false,
  authorization_method: 'none' as const,
  market_open: true,
  scheduled_for: null,
};
beforeEach(() => {
  vi.mocked(listTradingMarkets).mockResolvedValue([
    { code: 'NASDAQ', name: 'Nasdaq' },
    { code: 'NYSE', name: 'New York Stock Exchange' },
  ]);
  vi.mocked(searchAssets).mockResolvedValue({
    results: [{ symbol: 'AAPL', name: 'Apple', exchange: 'NASDAQ' }],
    total: 1,
    page_size: 20,
  });
  vi.mocked(previewOrder).mockResolvedValue(preview);
  vi.mocked(submitOrder).mockResolvedValue({
    id: 'order-1',
    status: 'SUBMITTED',
    fully_filled: false,
  } as OrderDetail);
});
function setup() {
  const created = vi.fn();
  render(
    <QueryClientProvider
      client={
        new QueryClient({
          defaultOptions: { queries: { retry: false, gcTime: 0 } },
        })
      }
    >
      <OrderForm initialSymbol="AAPL" onOrderCreated={created} />
    </QueryClientProvider>,
  );
  return created;
}
async function showPreview() {
  fireEvent.click(
    screen.getByRole('button', { name: 'Consultar vista previa' }),
  );
  await screen.findByLabelText('Vista previa de la orden');
}
it('no anuncia cero resultados ni un catálogo vacío mientras carga los instrumentos', async () => {
  let resolve!: (value: Awaited<ReturnType<typeof searchAssets>>) => void;
  vi.mocked(searchAssets).mockImplementationOnce(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  setup();
  expect(screen.getByText('Cargando acciones…')).toBeVisible();
  expect(screen.queryByText(/0 resultados/)).not.toBeInTheDocument();
  expect(
    screen.queryByText('No hay acciones para estos filtros.'),
  ).not.toBeInTheDocument();
  await act(async () => resolve({ results: [], total: 0, page_size: 20 }));
  expect(
    await screen.findByText('No hay acciones para estos filtros.'),
  ).toBeVisible();
  expect(screen.getByText('Página 1 · 0 resultados')).toBeVisible();
});

it.each([
  ['market', {}, {}],
  ['limit', { 'Precio límite (USD)': '95' }, { limit_price: '95' }],
  ['stop', { 'Precio de activación stop (USD)': '90' }, { stop_price: '90' }],
  [
    'stop_limit',
    { 'Precio límite (USD)': '89', 'Precio de activación stop (USD)': '90' },
    { limit_price: '89', stop_price: '90' },
  ],
  ['trailing_stop', { Distancia: '2' }, { trail_percent: '2' }],
])('envía el contrato correcto para %s', async (type, fields, expected) => {
  setup();
  fireEvent.change(screen.getByLabelText('Tipo de orden'), {
    target: { value: type },
  });
  for (const [label, value] of Object.entries(fields))
    fireEvent.change(screen.getByLabelText(label), { target: { value } });
  await showPreview();
  expect(previewOrder).toHaveBeenCalledWith(
    expect.objectContaining({ type, ...expected }),
  );
  fireEvent.click(
    screen.getByRole('button', { name: 'Confirmar y enviar orden' }),
  );
  await waitFor(() =>
    expect(submitOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        type,
        ...expected,
        confirmed: true,
        high_amount_acknowledged: false,
      }),
      expect.any(String),
    ),
  );
});
it('envía ambas salidas bracket y descarta la vista previa al editar', async () => {
  setup();
  fireEvent.click(
    screen.getByLabelText('Compra bracket: take profit y stop loss'),
  );
  fireEvent.change(screen.getByLabelText('Take profit (USD)'), {
    target: { value: '120' },
  });
  fireEvent.change(screen.getByLabelText('Stop loss (USD)'), {
    target: { value: '90' },
  });
  await showPreview();
  expect(previewOrder).toHaveBeenCalledWith(
    expect.objectContaining({
      order_class: 'bracket',
      side: 'buy',
      take_profit: { limit_price: '120' },
      stop_loss: { stop_price: '90' },
    }),
  );
  fireEvent.change(screen.getByLabelText('Cantidad de acciones'), {
    target: { value: '2' },
  });
  expect(
    screen.queryByLabelText('Vista previa de la orden'),
  ).not.toBeInTheDocument();
  expect(submitOrder).not.toHaveBeenCalled();
});
it('conserva la clave al reintentar y nunca fabrica una ejecución', async () => {
  vi.mocked(submitOrder).mockRejectedValueOnce(new Error('Sin conexión'));
  const created = setup();
  await showPreview();
  fireEvent.click(
    screen.getByRole('button', { name: 'Confirmar y enviar orden' }),
  );
  expect(await screen.findByRole('alert')).toHaveTextContent('Sin conexión');
  expect(created).not.toHaveBeenCalled();
  const key = vi.mocked(submitOrder).mock.calls[0]?.[1];
  fireEvent.click(
    screen.getByRole('button', { name: 'Confirmar y enviar orden' }),
  );
  await waitFor(() => expect(created).toHaveBeenCalledOnce());
  expect(vi.mocked(submitOrder).mock.calls[1]?.[1]).toBe(key);
  expect(screen.getByRole('status')).toHaveTextContent('SUBMITTED');
});
it('exige MFA cuando lo pide el backend', async () => {
  vi.mocked(previewOrder).mockResolvedValue({
    ...preview,
    authorization_method: 'totp',
    requires_extra_authorization: true,
  });
  setup();
  await showPreview();
  fireEvent.click(
    screen.getByRole('button', { name: 'Confirmar y enviar orden' }),
  );
  expect(submitOrder).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText('Código MFA'), {
    target: { value: '123456' },
  });
  fireEvent.click(
    screen.getByRole('button', { name: 'Confirmar y enviar orden' }),
  );
  await waitFor(() =>
    expect(submitOrder).toHaveBeenCalledWith(
      expect.objectContaining({ totp_code: '123456' }),
      expect.any(String),
    ),
  );
});
it('no autoriza automáticamente un monto elevado', async () => {
  vi.mocked(previewOrder).mockResolvedValue({
    ...preview,
    authorization_method: 'acknowledgement',
    requires_extra_authorization: true,
  });
  setup();
  await showPreview();
  fireEvent.click(
    screen.getByRole('button', { name: 'Confirmar y enviar orden' }),
  );
  expect(submitOrder).not.toHaveBeenCalled();
  fireEvent.click(
    screen.getByLabelText(
      'Autorizo expresamente esta operación de monto elevado',
    ),
  );
  fireEvent.click(
    screen.getByRole('button', { name: 'Confirmar y enviar orden' }),
  );
  await waitFor(() =>
    expect(submitOrder).toHaveBeenCalledWith(
      expect.objectContaining({ high_amount_acknowledged: true }),
      expect.any(String),
    ),
  );
});
it('no genera una vista previa local cuando falla el backend', async () => {
  vi.mocked(previewOrder).mockRejectedValueOnce(new Error('Cuenta no activa'));
  setup();
  fireEvent.click(
    screen.getByRole('button', { name: 'Consultar vista previa' }),
  );
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Cuenta no activa',
  );
  expect(
    screen.queryByLabelText('Vista previa de la orden'),
  ).not.toBeInTheDocument();
});

it('filtra por bolsa y elimina la acción anterior al cambiar de mercado', async () => {
  setup();
  await screen.findByRole('option', { name: 'New York Stock Exchange (NYSE)' });
  fireEvent.change(screen.getByLabelText('Bolsa de valores'), {
    target: { value: 'NYSE' },
  });
  expect(screen.getByLabelText('Instrumento')).toHaveValue('');
  await waitFor(() =>
    expect(searchAssets).toHaveBeenCalledWith(
      'A',
      1,
      expect.any(AbortSignal),
      'NYSE',
    ),
  );
  fireEvent.change(
    screen.getByLabelText('Buscar acción por nombre o símbolo'),
    { target: { value: 'IBM' } },
  );
  await waitFor(() =>
    expect(searchAssets).toHaveBeenCalledWith(
      'IBM',
      1,
      expect.any(AbortSignal),
      'NYSE',
    ),
  );
});

it('muestra error estilizado en español sin tooltip del navegador ante parámetros inválidos', async () => {
  setup();
  const qtyInput = screen.getByLabelText('Cantidad de acciones');
  expect(qtyInput.closest('form')).toHaveAttribute('novalidate');
  fireEvent.change(qtyInput, { target: { value: '0' } });
  fireEvent.click(
    screen.getByRole('button', { name: 'Consultar vista previa' }),
  );
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Ingresa una cantidad válida de acciones mayor a cero.',
  );
  expect(previewOrder).not.toHaveBeenCalled();
});
