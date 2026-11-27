// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { ApiError } from '@/lib/api';
import { setAppLocale } from '@/lib/i18n';
import { AdminAction } from './OperationsUi';
beforeEach(() => {
  setAppLocale('es');
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute('open');
  };
});
function setup(action: () => Promise<unknown>) {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <AdminAction
        title="Pausar negociación"
        description="Todas las bolsas"
        onConfirm={action}
      />
    </QueryClientProvider>,
  );
}
it('no ejecuta la acción hasta revisar, consentir y confirmar', async () => {
  const action = vi.fn().mockResolvedValue({});
  setup(action);
  fireEvent.change(screen.getByLabelText('Motivo de la operación'), {
    target: { value: 'Mantenimiento programado' },
  });
  fireEvent.change(
    screen.getByLabelText('Código de autenticación (6 dígitos)'),
    { target: { value: '123456' } },
  );
  fireEvent.click(screen.getByRole('button', { name: 'Revisar operación' }));
  expect(action).not.toHaveBeenCalled();
  expect(
    screen.getByRole('button', { name: 'Confirmar operación' }),
  ).toBeDisabled();
  fireEvent.click(screen.getByRole('checkbox'));
  fireEvent.click(screen.getByRole('button', { name: 'Confirmar operación' }));
  await waitFor(() => expect(action).toHaveBeenCalledOnce());
  expect(await screen.findByRole('status')).toHaveTextContent(
    'Operación completada',
  );
});
it('mantiene la revisión visible y no muestra éxito si el servidor rechaza el cambio', async () => {
  setup(
    vi.fn().mockRejectedValue(
      new ApiError('http', 'Conflict', {
        status: 409,
        code: 'FEE_VERSION_CONFLICT',
      }),
    ),
  );
  fireEvent.change(screen.getByLabelText('Motivo de la operación'), {
    target: { value: 'Nueva tarifa' },
  });
  fireEvent.change(
    screen.getByLabelText('Código de autenticación (6 dígitos)'),
    { target: { value: '123456' } },
  );
  fireEvent.click(screen.getByRole('button', { name: 'Revisar operación' }));
  fireEvent.click(screen.getByRole('checkbox'));
  fireEvent.click(screen.getByRole('button', { name: 'Confirmar operación' }));
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Otra persona cambió la tarifa',
  );
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
  expect(screen.getByRole('dialog')).toHaveAttribute('open');
});
