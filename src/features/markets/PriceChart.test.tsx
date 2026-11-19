// @vitest-environment jsdom
import { act, fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, expect, it, vi } from 'vitest';
import { PriceChart } from './PriceChart';
import { getInstruments } from './api';
import { history } from './history';
import type * as HistoryModule from './history';

vi.mock('./api', () => ({ getInstruments: vi.fn() }));
vi.mock('./history', async (original) => ({
  ...(await original<typeof HistoryModule>()),
  history: vi.fn(),
}));
vi.mock('./PriceSeries', () => ({
  PriceSeries: ({ label }: { label: string }) => (
    <div role="img" aria-label={label} />
  ),
}));

const catalog = {
  total: 2,
  page_size: 1,
  results: [{ symbol: 'AAPL', name: 'Apple' }],
};
const prices = {
  points: [{ time: 0, price: 100, open: 99, high: 101, low: 98, close: 100 }],
  currency: 'USD',
  source: 'alpaca',
  delayed: false,
};

beforeEach(() => {
  vi.mocked(getInstruments).mockReset().mockResolvedValue(catalog);
  vi.mocked(history).mockReset().mockResolvedValue(prices);
});

function setup() {
  render(
    <QueryClientProvider
      client={
        new QueryClient({
          defaultOptions: { queries: { retry: false, gcTime: 0 } },
        })
      }
    >
      <PriceChart exchange="NASDAQ" />
    </QueryClientProvider>,
  );
}

it.each(['letra', 'página'])(
  'oculta el catálogo y la gráfica anteriores al cambiar de %s',
  async (filter) => {
    setup();
    await screen.findByRole('img', { name: /Evolución de AAPL/ });
    let resolve!: (value: typeof catalog) => void;
    vi.mocked(getInstruments).mockImplementationOnce(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    if (filter === 'letra') {
      fireEvent.change(screen.getByLabelText('Filtro de nombre o símbolo'), {
        target: { value: 'B' },
      });
    } else {
      fireEvent.click(
        screen.getByRole('button', { name: 'Siguiente instrumento' }),
      );
    }
    expect(
      await screen.findByText('Cargando instrumentos de NASDAQ…'),
    ).toBeVisible();
    expect(
      screen.queryByRole('img', { name: /Evolución de AAPL/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('option', { name: /AAPL/ }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/Último cierre/)).not.toBeInTheDocument();
    await act(async () =>
      resolve({ ...catalog, results: [{ symbol: 'BA', name: 'Boeing' }] }),
    );
    expect(
      await screen.findByRole('img', { name: /Evolución de BA/ }),
    ).toBeVisible();
  },
);

it('distingue la carga de una respuesta vacía sin mostrar precios de ejemplo', async () => {
  let resolve!: (value: typeof catalog) => void;
  vi.mocked(getInstruments).mockImplementationOnce(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  setup();
  expect(screen.getByText('Cargando instrumentos de NASDAQ…')).toBeVisible();
  expect(screen.queryByText(/Sin instrumentos/)).not.toBeInTheDocument();
  expect(history).not.toHaveBeenCalled();
  await act(async () => resolve({ ...catalog, total: 0, results: [] }));
  expect(
    await screen.findByText(/Sin instrumentos para este filtro/),
  ).toBeVisible();
  expect(history).not.toHaveBeenCalled();
});

it('muestra el error del catálogo sin sustituirlo por datos de muestra', async () => {
  vi.mocked(getInstruments).mockRejectedValueOnce(new Error('Sin conexión'));
  setup();
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'No se pudo cargar la lista',
  );
  expect(screen.queryByRole('img')).not.toBeInTheDocument();
  expect(history).not.toHaveBeenCalled();
});
