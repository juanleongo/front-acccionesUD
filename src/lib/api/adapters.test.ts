import { afterEach, expect, it, vi } from 'vitest';

// Poison markers are disabled only in this unit test. The production build and graph enforce them.
vi.mock('server-only', () => ({}));
vi.mock('client-only', () => ({}));

afterEach(() => vi.unstubAllGlobals());

it('browser adapter sends a relative same-origin request', async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValue(new Response(null, { status: 204 }));
  vi.stubGlobal('fetch', fetchMock);
  const { browserHttp } = await import('./client');
  await browserHttp.request({ path: '/api/probe', response: 'empty' });
  expect(fetchMock).toHaveBeenCalledWith(
    '/api/probe',
    expect.objectContaining({
      credentials: 'same-origin',
      cache: 'no-store',
      redirect: 'error',
    }),
  );
});

it('server adapter validates config lazily and targets only the configured origin', async () => {
  const { createServerHttp } = await import('./server');
  vi.stubEnv('API_INTERNAL_ORIGIN', '');
  expect(createServerHttp).toThrow('API_INTERNAL_ORIGIN');
  vi.stubEnv('API_INTERNAL_ORIGIN', 'http://backend.internal:8000');
  const fetchMock = vi
    .fn()
    .mockResolvedValue(new Response(null, { status: 204 }));
  vi.stubGlobal('fetch', fetchMock);
  await createServerHttp().request({ path: '/api/probe', response: 'empty' });
  expect(fetchMock).toHaveBeenCalledWith(
    'http://backend.internal:8000/api/probe',
    expect.objectContaining({ credentials: 'omit' }),
  );
  vi.unstubAllEnvs();
});
