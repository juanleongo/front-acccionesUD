import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { delay, http, HttpResponse } from 'msw';
import { z } from 'zod';
import { mockServer } from '../../../tests/fixtures/http';
import { createFetchTransport } from './fetch-transport';
import { subscribeSessionExpired } from './session-events';

const origin = 'http://infrastructure.test';
const transport = createFetchTransport({ origin, credentials: 'omit' });
const schema = z.object({ ok: z.boolean() });
const options = {
  path: '/api/probe',
  response: 'json' as const,
  parse: schema.parse,
};

beforeAll(() => mockServer.listen({ onUnhandledFrame: 'error' }));
afterEach(() => mockServer.resetHandlers());
afterAll(() => mockServer.close());

describe('HTTP transport (technical fixtures only)', () => {
  it('notifica cierre de sesión en 401 de rutas protegidas y lo omite en /api/v1/auth/', async () => {
    const expiredPaths: string[] = [];
    const unsubscribe = subscribeSessionExpired((path) => {
      expiredPaths.push(path);
    });
    mockServer.use(
      http.get(`${origin}/api/v1/wallet/balances`, () =>
        HttpResponse.json({ code: 'NOT_AUTHENTICATED' }, { status: 401 }),
      ),
      http.post(`${origin}/api/v1/auth/login`, () =>
        HttpResponse.json({ code: 'INVALID_CREDENTIALS' }, { status: 401 }),
      ),
    );
    try {
      await expect(
        transport.request({ ...options, path: '/api/v1/wallet/balances' }),
      ).rejects.toMatchObject({ metadata: { status: 401 } });
      await expect(
        transport.request({
          path: '/api/v1/auth/login',
          method: 'POST',
          body: {},
          response: 'json',
          parse: schema.parse,
        }),
      ).rejects.toMatchObject({ metadata: { status: 401 } });
      expect(expiredPaths).toEqual(['/api/v1/wallet/balances']);
    } finally {
      unsubscribe();
    }
  });
  it('conserva el código de error de negocio para distinguir rechazo bancario y cuenta inactiva', async () => {
    mockServer.use(
      http.get(`${origin}/api/probe`, () =>
        HttpResponse.json(
          {
            code: 'ALPACA_REJECTED',
            message: 'Alpaca rejected the submitted data.',
          },
          { status: 422 },
        ),
      ),
    );
    await expect(transport.request(options)).rejects.toMatchObject({
      metadata: { status: 422, code: 'ALPACA_REJECTED' },
    });
  });
  it('validates JSON and sends the configured method, body, correlation and no-store policy', async () => {
    mockServer.use(
      http.post(`${origin}/api/probe`, async ({ request }) => {
        expect(request.headers.get('X-Request-ID')).toBe('probe-1');
        expect(request.headers.get('Cookie')).toBeNull();
        expect(await request.json()).toEqual({ probe: true });
        return HttpResponse.json({ ok: true });
      }),
    );
    await expect(
      transport.request({
        ...options,
        method: 'POST',
        body: { probe: true },
        requestId: 'probe-1',
      }),
    ).resolves.toEqual({ ok: true });
  });

  it('handles 204 without parsing a body', async () => {
    mockServer.use(
      http.delete(
        `${origin}/api/probe`,
        () => new HttpResponse(null, { status: 204 }),
      ),
    );
    await expect(
      transport.request({
        path: '/api/probe',
        method: 'DELETE',
        response: 'empty',
      }),
    ).resolves.toBeUndefined();
    await expect(
      transport.request({ ...options, method: 'DELETE' }),
    ).rejects.toMatchObject({ kind: 'contract' });
  });

  it('retains HTTP status, problem details and Retry-After without retrying', async () => {
    let requests = 0;
    mockServer.use(
      http.get(`${origin}/api/probe`, () => {
        requests++;
        return HttpResponse.json(
          { title: 'Unavailable', status: 503, unapproved: 'ignored' },
          {
            status: 503,
            headers: {
              'Content-Type': 'application/problem+json',
              'X-Request-ID': 'probe-2',
              'Retry-After': '2',
            },
          },
        );
      }),
    );
    await expect(transport.request(options)).rejects.toMatchObject({
      kind: 'http',
      metadata: {
        status: 503,
        requestId: 'probe-2',
        problem: { title: 'Unavailable' },
        retryAfterMs: 2000,
      },
    });
    expect(requests).toBe(1);
  });

  it.each([
    [
      'HTML',
      () =>
        new HttpResponse('<html/>', {
          headers: { 'Content-Type': 'text/html' },
        }),
    ],
    [
      'malformed JSON',
      () =>
        new HttpResponse('{', {
          headers: { 'Content-Type': 'application/json' },
        }),
    ],
    ['invalid schema', () => HttpResponse.json({ ok: 'yes' })],
  ])('rejects %s as contract failure', async (_, response) => {
    mockServer.use(http.get(`${origin}/api/probe`, response));
    await expect(transport.request(options)).rejects.toMatchObject({
      kind: 'contract',
    });
  });

  it('keeps HTTP failures when the problem body is not valid JSON', async () => {
    mockServer.use(
      http.get(
        `${origin}/api/probe`,
        () =>
          new HttpResponse('{', {
            status: 502,
            headers: { 'Content-Type': 'application/problem+json' },
          }),
      ),
    );
    await expect(transport.request(options)).rejects.toMatchObject({
      kind: 'http',
      metadata: { status: 502 },
    });
  });

  it('classifies network failure', async () => {
    mockServer.use(http.get(`${origin}/api/probe`, () => HttpResponse.error()));
    await expect(transport.request(options)).rejects.toMatchObject({
      kind: 'transport',
    });
  });

  it('classifies timeout and caller cancellation separately', async () => {
    mockServer.use(
      http.get(`${origin}/api/probe`, async () => {
        await delay(100);
        return HttpResponse.json({ ok: true });
      }),
    );
    await expect(
      transport.request({ ...options, timeoutMs: 10 }),
    ).rejects.toMatchObject({ kind: 'transport', metadata: { timeout: true } });
    const controller = new AbortController();
    const pending = transport.request({
      ...options,
      signal: controller.signal,
    });
    controller.abort();
    await expect(pending).rejects.toMatchObject({ kind: 'cancelled' });
    await expect(
      transport.request({ ...options, signal: controller.signal }),
    ).rejects.toMatchObject({ kind: 'cancelled' });
  });

  it.each([
    'https://other.test/api/probe',
    '//other.test/api/probe',
    '/api/../private',
    '/api/%2e%2e/private',
    '/api/probe?token=secret',
    '/api\\probe',
  ])('rejects unsafe path %s before transport', async (path) => {
    await expect(transport.request({ ...options, path })).rejects.toMatchObject(
      { kind: 'contract' },
    );
  });

  it('rejects credentials in query strings and invalid timeout', async () => {
    await expect(
      transport.request({ ...options, query: { access_token: 'secret' } }),
    ).rejects.toMatchObject({ kind: 'contract' });
    await expect(
      transport.request({ ...options, timeoutMs: 0 }),
    ).rejects.toMatchObject({ kind: 'contract' });
  });
});
