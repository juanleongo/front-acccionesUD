// @vitest-environment jsdom
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { expect, it, vi } from 'vitest';
import { TransactionLedgerTable } from './TransactionLedgerTable';
import { fetchWalletTransfers } from './wallet-api';
vi.mock('./wallet-api', () => ({ fetchWalletTransfers: vi.fn() }));
it('consulta fechas y tipo en la API y reinicia el cursor cuando cambia el filtro', async () => {
  vi.mocked(fetchWalletTransfers).mockResolvedValue({
    items: [],
    next_cursor: 'next-page',
  });
  render(
    <QueryClientProvider
      client={
        new QueryClient({
          defaultOptions: { queries: { retry: false, gcTime: 0 } },
        })
      }
    >
      <TransactionLedgerTable />
    </QueryClientProvider>,
  );
  await screen.findByText(
    'No existen movimientos para el filtro seleccionado.',
  );
  fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
  await waitFor(() =>
    expect(fetchWalletTransfers).toHaveBeenLastCalledWith(
      expect.any(AbortSignal),
      expect.objectContaining({ cursor: 'next-page' }),
    ),
  );
  fireEvent.change(screen.getByLabelText('Desde'), {
    target: { value: '2026-11-01' },
  });
  await waitFor(() =>
    expect(fetchWalletTransfers).toHaveBeenLastCalledWith(
      expect.any(AbortSignal),
      expect.objectContaining({ cursor: '', from: '2026-11-01' }),
    ),
  );
  fireEvent.click(screen.getByRole('button', { name: /Depósitos/ }));
  await waitFor(() =>
    expect(fetchWalletTransfers).toHaveBeenLastCalledWith(
      expect.any(AbortSignal),
      expect.objectContaining({ direction: 'INCOMING', cursor: '' }),
    ),
  );
});
