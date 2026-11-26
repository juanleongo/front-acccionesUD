// @vitest-environment jsdom
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, expect, it, vi } from 'vitest';
import { browserHttp } from '@/lib/api/client';
import type { JsonRequest } from '@/lib/api/http-port';
import { AdvisorSummaryCard } from './AdvisorSummaryCard';
import { fetchLatestActiveLink, latestActiveLink } from './advisor-summary-api';
import {
  INITIAL_CURRENT_LINK,
  INITIAL_BROKERS_DIRECTORY,
} from './brokers-mock';
vi.mock('@/lib/api/client', () => ({ browserHttp: { request: vi.fn() } }));
const oldLink = {
  ...INITIAL_CURRENT_LINK.link!,
  id: 'old',
  started_at: '2026-01-01T00:00:00Z',
};
const newLink = {
  ...oldLink,
  id: 'new',
  started_at: '2026-11-23T00:00:00Z',
  broker: { ...oldLink.broker, name: 'Asesor más reciente' },
};
beforeEach(() => vi.resetAllMocks());
it('elige el último vínculo activo por fecha de asociación, no por orden recibido', () => {
  expect(latestActiveLink([newLink, oldLink])?.id).toBe('new');
  expect(latestActiveLink([oldLink, newLink])?.id).toBe('new');
  expect(latestActiveLink([{ ...newLink, status: 'ended' }, oldLink])?.id).toBe(
    'old',
  );
  expect(latestActiveLink([{ ...newLink, status: 'requested' }])).toBeNull();
});
it('revisa todas las páginas de vínculos activos', async () => {
  vi.mocked(browserHttp.request).mockImplementation(
    async (options) =>
      (options as unknown as JsonRequest<unknown>).parse(
        options.query?.cursor
          ? { items: [newLink], next_cursor: null }
          : { items: [oldLink], next_cursor: 'next' },
      ) as never,
  );
  expect((await fetchLatestActiveLink(new AbortController().signal))?.id).toBe(
    'new',
  );
  expect(browserHttp.request).toHaveBeenLastCalledWith(
    expect.objectContaining({
      query: { status: 'active', page_size: '100', cursor: 'next' },
    }),
  );
});
function mount() {
  const onExplore = vi.fn();
  const onOpenAdvisor = vi.fn();
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <AdvisorSummaryCard
        userId="investor"
        onExplore={onExplore}
        onOpenAdvisor={onOpenAdvisor}
      />
    </QueryClientProvider>,
  );
  return { onExplore, onOpenAdvisor };
}
it('sin asociación invita a explorar y no muestra un asesor ficticio', async () => {
  vi.mocked(browserHttp.request).mockImplementation(
    async (options) =>
      (options as unknown as JsonRequest<unknown>).parse({
        items: [],
        next_cursor: null,
      }) as never,
  );
  const actions = mount();
  await screen.findByText(/Aún no tienes un comisionista/);
  fireEvent.click(
    screen.getByRole('button', { name: 'Explorar comisionistas' }),
  );
  expect(actions.onExplore).toHaveBeenCalledOnce();
  expect(screen.queryByText('Asignado')).not.toBeInTheDocument();
});
it('muestra el asesor y la reputación recibida de la API', async () => {
  vi.mocked(browserHttp.request).mockImplementation(
    async (options) =>
      (options as unknown as JsonRequest<unknown>).parse(
        options.path === '/api/v1/broker-links'
          ? { items: [oldLink, newLink], next_cursor: null }
          : INITIAL_BROKERS_DIRECTORY[0],
      ) as never,
  );
  const actions = mount();
  await screen.findByText('Asesor más reciente');
  await screen.findByText(/342 propuestas convertidas en órdenes/);
  fireEvent.click(
    screen.getByRole('button', { name: 'Consultar Asesores & Estrategias' }),
  );
  expect(actions.onOpenAdvisor).toHaveBeenCalledOnce();
});
it('distingue un error del servidor de la ausencia de asociación', async () => {
  vi.mocked(browserHttp.request).mockRejectedValue(new Error('offline'));
  mount();
  await screen.findByText('No se pudo consultar tu comisionista.');
  expect(
    screen.queryByText(/Aún no tienes un comisionista/),
  ).not.toBeInTheDocument();
});
