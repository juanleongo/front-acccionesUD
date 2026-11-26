// @vitest-environment jsdom
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, expect, it, vi } from 'vitest';
import { setAppLocale } from '@/lib/i18n';
import { browserHttp } from '@/lib/api/client';
import type { JsonRequest, RequestOptions } from '@/lib/api/http-port';
import { ApiError } from '@/lib/api/errors';
import { BrokersHub } from './BrokersHub';
import {
  INITIAL_BROKERS_DIRECTORY,
  INITIAL_CURRENT_LINK,
  INITIAL_PROPOSALS,
} from './brokers-mock';
vi.mock('@/lib/api/client', () => ({ browserHttp: { request: vi.fn() } }));
const broker = INITIAL_BROKERS_DIRECTORY[0]!;
let link: unknown;
let proposal = INITIAL_PROPOSALS[0]!;
let failDecision = false;
const calls = () =>
  vi.mocked(browserHttp.request).mock.calls.map(([options]) => options);
function detail() {
  return {
    ...proposal,
    versions: [
      {
        ...proposal,
        version: proposal.current_version,
        reference_price: '885.00',
      },
    ],
    decisions: [],
  };
}
function fixture(options: RequestOptions): unknown {
  const path = options.path.replace('/api/v1/', '');
  if (path === 'broker-links/current')
    return {
      link,
      trading_authorization: null,
      pending_broker_selection: !link,
      suggestions: [],
    };
  if (path === 'brokers')
    return {
      items: options.query?.q?.includes('Inexistente') ? [] : [broker],
      next_cursor: options.query?.cursor ? null : 'next-directory',
    };
  if (path === 'brokers/suggestions') return [];
  if (path === 'broker-links' && options.method === 'POST') {
    link = { ...INITIAL_CURRENT_LINK.link!, status: 'requested' };
    return link;
  }
  if (path === 'broker-links') return { items: [], next_cursor: null };
  if (
    path === 'broker/link-requests' ||
    path === 'broker/clients' ||
    path === 'broker/order-reviews'
  )
    return [];
  if (path === `brokers/${broker.id}` || path === 'brokers/me/profile')
    return { ...broker, ...(options.body ?? {}) };
  if (path === 'proposals' || path === 'broker/proposals')
    return { items: [proposal], next_cursor: null };
  if (path.endsWith('/messages')) return { items: [], next_cursor: null };
  if (path.endsWith('/decision')) {
    if (failDecision)
      throw new ApiError('http', 'Código MFA inválido', { status: 422 });
    proposal = {
      ...proposal,
      status: 'accepted',
      accepted_version: proposal.current_version,
    };
    return detail();
  }
  if (
    path === `proposals/${proposal.id}` ||
    path === `broker/proposals/${proposal.id}`
  )
    return detail();
  throw new Error(`Unexpected request ${options.method} ${path}`);
}
function mount(roles = ['investor']) {
  return render(
    <QueryClientProvider
      client={
        new QueryClient({
          defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
          },
        })
      }
    >
      <BrokersHub userId={broker.id} userRoles={roles} />
    </QueryClientProvider>,
  );
}
beforeEach(() => {
  vi.resetAllMocks();
  setAppLocale('es');
  link = null;
  proposal = { ...INITIAL_PROPOSALS[0]!, current_version: 3 };
  failDecision = false;
  HTMLDialogElement.prototype.showModal = vi.fn(function (
    this: HTMLDialogElement,
  ) {
    this.setAttribute('open', '');
  });
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
    this.removeAttribute('open');
  });
  vi.mocked(browserHttp.request).mockImplementation(
    async (options) =>
      (options as unknown as JsonRequest<unknown>).parse(
        fixture(options),
      ) as never,
  );
});
it('carga datos del servidor, busca por nombre y pagina con máximo 10', async () => {
  mount();
  fireEvent.click(
    screen.getByRole('tab', { name: 'Directorio de Comisionistas' }),
  );
  await screen.findByText(broker.name);
  fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
  await waitFor(() =>
    expect(calls()).toContainEqual(
      expect.objectContaining({
        path: '/api/v1/brokers',
        query: { page_size: '10', cursor: 'next-directory' },
      }),
    ),
  );
  fireEvent.change(screen.getByRole('searchbox'), {
    target: { value: 'Inexistente' },
  });
  await screen.findByText('No encontramos comisionistas con ese criterio');
  expect(calls()).toContainEqual(
    expect.objectContaining({
      path: '/api/v1/brokers',
      query: { page_size: '10', q: 'Inexistente' },
    }),
  );
});
it('exige consentimiento y mantiene el vínculo solicitado pendiente de aprobación', async () => {
  mount();
  fireEvent.click(
    screen.getByRole('tab', { name: 'Directorio de Comisionistas' }),
  );
  fireEvent.click(
    await screen.findByRole('button', { name: 'Solicitar Vinculación' }),
  );
  const dialog = screen.getByRole('dialog');
  const confirm = within(dialog).getByRole('button', { name: 'Confirmar' });
  expect(confirm).toBeDisabled();
  expect(calls().filter((c) => c.method === 'POST')).toHaveLength(0);
  fireEvent.click(within(dialog).getByRole('checkbox'));
  fireEvent.click(confirm);
  await waitFor(() =>
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
  );
  expect(calls()).toContainEqual(
    expect.objectContaining({
      path: '/api/v1/broker-links',
      body: { broker_id: broker.id, consent_accepted: true },
    }),
  );
  fireEvent.click(
    screen.getByRole('tab', { name: 'Mi Comisionista y Permisos' }),
  );
  await screen.findByText('Solicitud enviada');
  expect(
    screen.getByRole('button', { name: 'Autorizar Operación' }),
  ).toBeDisabled();
});
it('envía la versión vista y el código MFA real; no confirma una decisión rechazada', async () => {
  mount();
  fireEvent.click(
    screen.getByRole('tab', { name: 'Propuestas Recibidas y Chat' }),
  );
  const code = await screen.findByLabelText('Código 2FA (6 dígitos)');
  fireEvent.click(
    screen.getByRole('button', { name: /Aceptar y Firmar Propuesta/ }),
  );
  expect(calls().some((c) => c.path.endsWith('/decision'))).toBe(false);
  fireEvent.change(code, { target: { value: '123456' } });
  failDecision = true;
  fireEvent.click(
    screen.getByRole('button', { name: /Aceptar y Firmar Propuesta/ }),
  );
  await screen.findByText('Código MFA inválido');
  expect(
    screen.queryByText('Operación confirmada por el servidor.'),
  ).not.toBeInTheDocument();
  expect(calls()).toContainEqual(
    expect.objectContaining({
      path: `/api/v1/proposals/${proposal.id}/decision`,
      body: {
        version: 3,
        decision: 'accept',
        comment: '',
        totp_code: '123456',
      },
    }),
  );
  expect(code).toHaveValue('123456');
  failDecision = false;
  fireEvent.click(
    screen.getByRole('button', { name: /Aceptar y Firmar Propuesta/ }),
  );
  await screen.findByText('Operación confirmada por el servidor.');
});
it('el portal broker consulta solo sus rutas y guarda el perfil escrito', async () => {
  mount(['broker']);
  await screen.findByText(
    'Aún no tienes inversionistas vinculados a tu cartera.',
  );
  expect(calls().some((c) => c.path === '/api/v1/broker-links/current')).toBe(
    false,
  );
  fireEvent.click(screen.getByRole('tab', { name: 'Mi perfil profesional' }));
  const specialty = await screen.findByLabelText('Especialidad Bursátil');
  expect(specialty).toHaveValue(broker.specialty);
  fireEvent.change(specialty, { target: { value: 'ETF y dividendos' } });
  fireEvent.click(
    screen.getByRole('button', { name: 'Guardar Perfil de Comisionista' }),
  );
  await screen.findByText('Operación confirmada por el servidor.');
  expect(calls()).toContainEqual(
    expect.objectContaining({
      path: '/api/v1/brokers/me/profile',
      method: 'PUT',
      body: expect.objectContaining({ specialty: 'ETF y dividendos' }),
    }),
  );
});
it('aplica el período del historial y bloquea un intervalo incompleto', async () => {
  mount();
  fireEvent.click(screen.getByRole('tab', { name: 'Historial de vínculos' }));
  fireEvent.change(screen.getByLabelText('Desde'), {
    target: { value: '2026-11-01' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Aplicar filtros' }));
  await screen.findByText('Indica ambas fechas en orden válido.');
  fireEvent.change(screen.getByLabelText('Hasta'), {
    target: { value: '2026-11-23' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Aplicar filtros' }));
  await waitFor(() =>
    expect(calls()).toContainEqual(
      expect.objectContaining({
        path: '/api/v1/broker-links',
        query: { page_size: '10', from: '2026-11-01', to: '2026-11-23' },
      }),
    ),
  );
});
it('presenta errores de carga sin sustituirlos por comisionistas ficticios', async () => {
  vi.mocked(browserHttp.request).mockRejectedValue(
    new Error('Servicio no disponible'),
  );
  mount();
  await screen.findByText(/No se pudo consultar esta sección/);
  expect(screen.queryByText(broker.name)).not.toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Portal Comisionista' }),
  ).not.toBeInTheDocument();
});

it('el broker aprueba con evidencia y la versión vigente, sin firma MFA inventada', async () => {
  proposal = { ...proposal, status: 'accepted', accepted_version: 3 };
  mount(['broker']);
  fireEvent.click(screen.getByRole('tab', { name: 'Propuestas y chat' }));
  fireEvent.click(
    await screen.findByRole('button', { name: 'Aprobar y crear orden' }),
  );
  const dialog = screen.getByRole('dialog');
  expect(
    within(dialog).getByRole('button', { name: 'Confirmar' }),
  ).toBeDisabled();
  fireEvent.change(within(dialog).getByLabelText('Motivo / evidencia'), {
    target: { value: 'Confirmación del cliente registrada en la propuesta.' },
  });
  fireEvent.click(within(dialog).getByRole('button', { name: 'Confirmar' }));
  await waitFor(() =>
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
  );
  expect(calls()).toContainEqual(
    expect.objectContaining({
      path: `/api/v1/broker/proposals/${proposal.id}/decision`,
      body: {
        version: 3,
        decision: 'approve',
        evidence_text: 'Confirmación del cliente registrada en la propuesta.',
        evidence_message_ids: [],
      },
    }),
  );
  expect(
    calls()
      .filter((c) => c.path.endsWith('/decision'))
      .every((c) => !('totp_code' in (c.body as object))),
  ).toBe(true);
});
