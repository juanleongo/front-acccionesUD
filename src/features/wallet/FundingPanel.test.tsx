// @vitest-environment jsdom
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { browserHttp } from '@/lib/api/client';
vi.mock('@/lib/api/client', () => ({ browserHttp: { request: vi.fn() } }));
import { FundingPanel } from './FundingPanel';
import { createBank, fetchBanks, requestTransfer } from './wallet-api';

vi.mock('./wallet-api', () => ({
  fetchBanks: vi.fn(),
  createBank: vi.fn(),
  requestTransfer: vi.fn(),
}));
beforeEach(() => {
  vi.mocked(fetchBanks).mockResolvedValue([
    {
      id: 'bank-1',
      alpaca_relationship_id: 'alpaca-1',
      owner_name: 'Usuario',
      account_type: 'CHECKING',
      account_last4: '1234',
      status: 'APPROVED',
      created_at: '',
    },
  ]);
  vi.mocked(requestTransfer).mockResolvedValue({
    id: 'transfer-1',
    alpaca_transfer_id: 'external-1',
    bank_relationship_id: 'bank-1',
    direction: 'INCOMING',
    amount: '25.00',
    currency: 'USD',
    status: 'PENDING',
    created_at: '',
  });
});

it('muestra únicamente el detalle de la cuenta seleccionada y lo actualiza al cambiarla', async () => {
  vi.mocked(fetchBanks).mockResolvedValue([
    {
      id: 'bank-1',
      alpaca_relationship_id: 'alpaca-1',
      owner_name: 'Ana Perez',
      account_type: 'CHECKING',
      account_last4: '1234',
      status: 'APPROVED',
      created_at: '2026-11-20T15:00:00Z',
    },
    {
      id: 'bank-2',
      alpaca_relationship_id: 'alpaca-2',
      owner_name: 'Luis Gomez',
      account_type: 'SAVINGS',
      account_last4: '5678',
      status: 'APPROVED',
      created_at: '2026-11-21T15:00:00Z',
    },
  ]);
  render(<FundingPanel onRefresh={vi.fn()} available={100} />);
  const details = await screen.findByRole('region', {
    name: 'Detalle de la cuenta seleccionada',
  });
  expect(within(details).getByText('Ana Perez')).toBeInTheDocument();
  expect(within(details).getByText('Cuenta corriente')).toBeInTheDocument();
  expect(within(details).queryByText('Luis Gomez')).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Cuenta bancaria vinculada'), {
    target: { value: 'bank-2' },
  });
  expect(within(details).getByText('Luis Gomez')).toBeInTheDocument();
  expect(within(details).getByText('Cuenta de ahorros')).toBeInTheDocument();
  expect(within(details).getByText('****5678')).toBeInTheDocument();
  expect(within(details).queryByText('Ana Perez')).not.toBeInTheDocument();
  expect(
    screen.getAllByRole('region', {
      name: 'Detalle de la cuenta seleccionada',
    }),
  ).toHaveLength(1);
  fireEvent.change(screen.getByLabelText('Cuenta bancaria vinculada'), {
    target: { value: '' },
  });
  expect(
    screen.queryByRole('region', { name: 'Detalle de la cuenta seleccionada' }),
  ).not.toBeInTheDocument();
});

it.each([
  'PSE / Transferencia Colombia',
  'Tarjeta débito / crédito',
  'Transferencia internacional',
])(
  'envía %s por el mismo flujo y conserva el estado pendiente',
  async (method) => {
    const refresh = vi.fn().mockResolvedValue(undefined);
    render(<FundingPanel onRefresh={refresh} available={100} />);
    await waitFor(() =>
      expect(screen.getByLabelText('Cuenta bancaria vinculada')).toHaveValue(
        'bank-1',
      ),
    );
    fireEvent.click(screen.getByRole('button', { name: new RegExp(method) }));
    fireEvent.change(screen.getByLabelText('Monto en USD'), {
      target: { value: '25' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: 'Confirmar depósito de prueba' }),
    );
    expect(await screen.findByRole('status')).toHaveTextContent('PENDING');
    expect(requestTransfer).toHaveBeenCalledWith(
      'deposit',
      'bank-1',
      '25.00',
      expect.any(String),
    );
    expect(refresh).toHaveBeenCalledOnce();
  },
);

it('conserva la clave al reintentar un fallo sin mostrar éxito', async () => {
  vi.mocked(requestTransfer).mockRejectedValueOnce(new Error('Sin conexión'));
  const refresh = vi.fn().mockResolvedValue(undefined);
  render(<FundingPanel onRefresh={refresh} available={100} />);
  await waitFor(() =>
    expect(screen.getByLabelText('Cuenta bancaria vinculada')).toHaveValue(
      'bank-1',
    ),
  );
  fireEvent.change(screen.getByLabelText('Monto en USD'), {
    target: { value: '25' },
  });
  fireEvent.click(
    screen.getByRole('button', { name: 'Confirmar depósito de prueba' }),
  );
  expect(await screen.findByRole('alert')).toHaveTextContent('Sin conexión');
  expect(refresh).not.toHaveBeenCalled();
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
  const firstKey = vi.mocked(requestTransfer).mock.calls[0]?.[3];
  fireEvent.click(
    screen.getByRole('button', { name: 'Confirmar depósito de prueba' }),
  );
  await screen.findByRole('status');
  expect(vi.mocked(requestTransfer).mock.calls[1]?.[3]).toBe(firstKey);
});

it('impide retirar más que el efectivo disponible', async () => {
  render(<FundingPanel onRefresh={vi.fn()} available={10} />);
  await waitFor(() =>
    expect(screen.getByLabelText('Cuenta bancaria vinculada')).toHaveValue(
      'bank-1',
    ),
  );
  fireEvent.click(screen.getByRole('button', { name: 'Retirar fondos' }));
  fireEvent.change(screen.getByLabelText('Monto en USD'), {
    target: { value: '25' },
  });
  fireEvent.click(
    screen.getByRole('button', { name: 'Confirmar retiro de prueba' }),
  );
  expect(await screen.findByRole('alert')).toHaveTextContent('supera el saldo');
  expect(requestTransfer).not.toHaveBeenCalled();
});

it('abre primero la vinculación y bloquea el selector cuando no hay cuentas aprobadas', async () => {
  vi.mocked(fetchBanks).mockResolvedValueOnce([]);
  render(<FundingPanel onRefresh={vi.fn()} available={100} />);
  await screen.findByText('Primero vincula una cuenta bancaria');
  expect(screen.getByLabelText('Cuenta bancaria vinculada')).toBeDisabled();
  const owner = screen.getByLabelText('Nombre completo del titular');
  expect(owner.closest('details')).toHaveAttribute('open');
  fireEvent.change(owner, { target: { value: 'Ana Perez' } });
  fireEvent.change(screen.getByLabelText('Número de cuenta'), {
    target: { value: '123' },
  });
  fireEvent.click(
    screen.getByRole('button', { name: 'Vincular cuenta de prueba' }),
  );
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'entre 4 y 17 dígitos',
  );
  expect(createBank).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText('Número de cuenta'), {
    target: { value: '12345678' },
  });
  fireEvent.change(
    screen.getByLabelText('Código bancario ACH (routing number)'),
    { target: { value: '123' } },
  );
  fireEvent.click(
    screen.getByRole('button', { name: 'Vincular cuenta de prueba' }),
  );
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'exactamente 9 dígitos',
  );
  expect(createBank).not.toHaveBeenCalled();
  fireEvent.change(
    screen.getByLabelText('Código bancario ACH (routing number)'),
    { target: { value: '145789456' } },
  );
  fireEvent.click(
    screen.getByRole('button', { name: 'Vincular cuenta de prueba' }),
  );
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'no es un routing number ABA válido',
  );
  expect(createBank).not.toHaveBeenCalled();
});

it.each([
  ['COP', 4000, '100000'],
  ['JPY', 150, '3750'],
  ['ZAR', 18, '450'],
])(
  'convierte %s a USD y envía exactamente el equivalente mostrado',
  async (code, rate, amount) => {
    vi.mocked(browserHttp.request).mockImplementation(
      async (options) =>
        (options.path === '/api/public/currencies'
          ? [{ iso_code: code, type: 'currency' }]
          : [
              {
                base: 'USD',
                quote: code,
                rate,
                date: new Date().toISOString().slice(0, 10),
              },
            ]) as never,
    );
    render(
      <FundingPanel
        onRefresh={vi.fn().mockResolvedValue(undefined)}
        available={100}
      />,
    );
    await waitFor(() =>
      expect(screen.getByLabelText('Cuenta bancaria vinculada')).toHaveValue(
        'bank-1',
      ),
    );
    await waitFor(() =>
      expect(screen.getByLabelText('Moneda del depósito')).toHaveTextContent(
        code,
      ),
    );
    fireEvent.change(screen.getByLabelText('Moneda del depósito'), {
      target: { value: code },
    });
    fireEvent.change(screen.getByLabelText(`Monto en ${code}`), {
      target: { value: amount },
    });
    await waitFor(() =>
      expect(
        screen.getByText(/Monto a depositar en tu cuenta:/),
      ).toHaveTextContent('25.00 USD'),
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Confirmar depósito de prueba' }),
    );
    await waitFor(() =>
      expect(requestTransfer).toHaveBeenCalledWith(
        'deposit',
        'bank-1',
        '25.00',
        expect.any(String),
      ),
    );
  },
);
it('impide depositar en otra moneda cuando falla el proveedor de tasas', async () => {
  vi.mocked(browserHttp.request).mockRejectedValue(new Error('offline'));
  render(<FundingPanel onRefresh={vi.fn()} available={100} />);
  await waitFor(() =>
    expect(screen.getByLabelText('Cuenta bancaria vinculada')).toHaveValue(
      'bank-1',
    ),
  );
  fireEvent.change(screen.getByLabelText('Moneda del depósito'), {
    target: { value: 'EUR' },
  });
  await screen.findByText('No hay una tasa reciente disponible.');
  expect(
    screen.getByRole('button', { name: 'Confirmar depósito de prueba' }),
  ).toBeDisabled();
  expect(requestTransfer).not.toHaveBeenCalled();
});
