// @vitest-environment jsdom
import { http, HttpResponse } from 'msw';
import { afterAll, afterEach, beforeAll, expect, it } from 'vitest';
import { mockServer } from '../../../../tests/fixtures/http';
import { adminRead, pageOf, haltSchema } from './operations-api';
beforeAll(() => mockServer.listen({ onUnhandledFrame: 'bypass' }));
afterEach(() => mockServer.resetHandlers());
afterAll(() => mockServer.close());
it('usa parámetros del transporte central para fechas y cursores, sin incluirlos en el path', async () => {
  let requested: URL | undefined;
  mockServer.use(
    http.get('*/api/v1/admin/trading-halts', ({ request }) => {
      requested = new URL(request.url);
      return HttpResponse.json({ items: [], next_cursor: null });
    }),
  );
  const result = await adminRead('/admin/trading-halts', pageOf(haltSchema), {
    status: 'active',
    cursor: 'a+b/c=',
    scope: '',
  });
  expect(result.items).toEqual([]);
  expect(requested?.searchParams.get('cursor')).toBe('a+b/c=');
  expect(requested?.searchParams.get('status')).toBe('active');
  expect(requested?.searchParams.has('scope')).toBe(false);
});
it('rechaza estados administrativos que no cumplen el contrato', async () => {
  mockServer.use(
    http.get('*/api/v1/admin/trading-halts', () =>
      HttpResponse.json({
        items: [
          {
            id: '1',
            scope: 'global',
            status: 'inventado',
            reason: 'Mantenimiento',
            starts_at: '2026-11-26T14:30:00Z',
            ends_at: null,
          },
        ],
        next_cursor: null,
      }),
    ),
  );
  await expect(
    adminRead('/admin/trading-halts', pageOf(haltSchema)),
  ).rejects.toMatchObject({ kind: 'contract' });
});
