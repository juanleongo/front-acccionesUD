// @vitest-environment jsdom
import { act, fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, expect, it, vi } from 'vitest';
import { KycFields } from './KycFields';
import { getLocations } from './locations-api';

vi.mock('./locations-api', () => ({ getLocations: vi.fn() }));
const regions = {
  states: [{ code: 'ANT', name: 'Antioquia' }],
  cities: [] as string[],
};
beforeEach(() =>
  vi.mocked(getLocations).mockReset().mockResolvedValue(regions),
);
function setup(step = 2) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return render(
    <QueryClientProvider client={client}>
      <form aria-label="KYC">
        <KycFields step={step} country="CO" disabled={false} />
      </form>
    </QueryClientProvider>,
  );
}

it('consulta ciudades sólo al elegir región y envía nombres en el formulario', async () => {
  let resolve!: (data: typeof regions) => void;
  setup();
  await screen.findByRole('option', { name: 'Antioquia', hidden: true });
  vi.mocked(getLocations).mockImplementationOnce(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  fireEvent.change(screen.getByLabelText('Departamento, estado o provincia'), {
    target: { value: 'ANT' },
  });
  expect(
    await screen.findByText('Cargando regiones y ciudades…'),
  ).toBeVisible();
  expect(
    screen.queryByRole('option', { name: 'Medellín', hidden: true }),
  ).not.toBeInTheDocument();
  expect(getLocations).toHaveBeenLastCalledWith(
    'CO',
    expect.any(AbortSignal),
    'ANT',
  );
  await act(async () => resolve({ ...regions, cities: ['Medellín'] }));
  await screen.findByRole('option', { name: 'Medellín', hidden: true });
  fireEvent.change(screen.getByLabelText('Ciudad'), {
    target: { value: 'Medellín' },
  });
  const form = new FormData(screen.getByRole('form') as HTMLFormElement);
  expect(form.get('state')).toBe('ANT');
  expect(form.get('state_name')).toBe('Antioquia');
  expect(form.get('city')).toBe('Medellín');
});

it('no descarga ubicaciones antes del paso de identidad', () => {
  setup(1);
  expect(getLocations).not.toHaveBeenCalled();
});

it('ofrece reintento cuando falla la carga del catálogo', async () => {
  vi.mocked(getLocations).mockRejectedValueOnce(new Error('Sin conexión'));
  setup();
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'No se pudo cargar',
  );
  fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
  expect(
    await screen.findByRole('option', { name: 'Antioquia', hidden: true }),
  ).toBeInTheDocument();
});
