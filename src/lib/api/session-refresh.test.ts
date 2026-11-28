import { afterEach, describe, expect, it, vi } from 'vitest';
import { createFetchTransport } from './fetch-transport';
import { withSessionRefresh } from './session-refresh';
import { subscribeSessionExpired } from './session-events';

const options = {
  path: '/api/v1/users/me',
  response: 'json' as const,
  parse: (value: unknown) => value,
};
const ok = () => Response.json({ ok: true });
const denied = () =>
  Response.json({ code: 'NOT_AUTHENTICATED' }, { status: 401 });
const refreshed = () =>
  Response.json({
    access_expires_at: '2026-11-27T15:15:00Z',
    refresh_expires_at: '2026-12-04T15:00:00Z',
  });
const client = () =>
  withSessionRefresh(
    createFetchTransport({
      credentials: 'same-origin',
      notifyUnauthorized: false,
    }),
  );
afterEach(() => vi.unstubAllGlobals());

describe('automatic session refresh', () => {
  it('renews with cookies and replays the original mutation once with its idempotency key', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(denied())
      .mockResolvedValueOnce(refreshed())
      .mockResolvedValueOnce(ok());
    vi.stubGlobal('fetch', fetch);
    const expired = vi.fn();
    const unsubscribe = subscribeSessionExpired(expired);
    try {
      await expect(
        client().request({
          ...options,
          path: '/api/v1/orders',
          method: 'POST',
          body: { symbol: 'AAPL' },
          headers: { 'Idempotency-Key': 'same-key' },
        }),
      ).resolves.toEqual({ ok: true });
      expect(fetch).toHaveBeenCalledTimes(3);
      expect(fetch.mock.calls[1]).toEqual([
        '/api/v1/auth/refresh',
        expect.objectContaining({ method: 'POST', credentials: 'same-origin' }),
      ]);
      expect(fetch.mock.calls[1]?.[1].body).toBeUndefined();
      expect(fetch.mock.calls[2]?.[1].body).toBe(fetch.mock.calls[0]?.[1].body);
      expect(fetch.mock.calls[2]?.[1].headers.get('Idempotency-Key')).toBe(
        'same-key',
      );
      expect(expired).not.toHaveBeenCalled();
    } finally {
      unsubscribe();
    }
  });

  it('shares one rotation across simultaneous and late unauthorized responses', async () => {
    let finishRefresh!: (response: Response) => void;
    let finishLate!: (response: Response) => void;
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(denied())
      .mockResolvedValueOnce(denied())
      .mockImplementationOnce(
        () =>
          new Promise<Response>((resolve) => {
            finishLate = resolve;
          }),
      )
      .mockImplementationOnce(
        () =>
          new Promise<Response>((resolve) => {
            finishRefresh = resolve;
          }),
      )
      .mockImplementation(() => Promise.resolve(ok()));
    vi.stubGlobal('fetch', fetch);
    const http = client();
    const requests = [
      http.request(options),
      http.request(options),
      http.request(options),
    ];
    await vi.waitFor(() => expect(finishRefresh).toBeTypeOf('function'));
    finishRefresh(refreshed());
    await Promise.all(requests.slice(0, 2));
    finishLate(denied());
    await Promise.all(requests);
    expect(
      fetch.mock.calls.filter(([path]) => path === '/api/v1/auth/refresh'),
    ).toHaveLength(1);
    expect(fetch).toHaveBeenCalledTimes(7);
  });

  it.each([401, 503])(
    'handles refresh status %s without replaying the operation',
    async (status) => {
      const fetch = vi
        .fn()
        .mockResolvedValueOnce(denied())
        .mockResolvedValueOnce(Response.json({}, { status }));
      vi.stubGlobal('fetch', fetch);
      const expired = vi.fn();
      const unsubscribe = subscribeSessionExpired(expired);
      try {
        await expect(client().request(options)).rejects.toMatchObject({
          metadata: { status },
        });
        expect(fetch).toHaveBeenCalledTimes(2);
        expect(expired).toHaveBeenCalledTimes(status === 401 ? 1 : 0);
      } finally {
        unsubscribe();
      }
    },
  );

  it('does not loop if the replay is unauthorized', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(denied())
      .mockResolvedValueOnce(refreshed())
      .mockResolvedValueOnce(denied());
    vi.stubGlobal('fetch', fetch);
    await expect(client().request(options)).rejects.toMatchObject({
      metadata: { status: 401 },
    });
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it.each([
    '/api/v1/auth/login',
    '/api/v1/auth/logout',
    '/api/v1/auth/refresh',
    '/api/v1/auth/mfa/verify',
    '/api/v1/public/market-explorer',
  ])('does not refresh %s', async (path) => {
    const fetch = vi.fn().mockImplementation(() => Promise.resolve(denied()));
    vi.stubGlobal('fetch', fetch);
    await expect(client().request({ ...options, path })).rejects.toMatchObject({
      metadata: { status: 401 },
    });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('cancels a waiting request without interrupting another consumer', async () => {
    let finishRefresh!: (response: Response) => void;
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(denied())
      .mockResolvedValueOnce(denied())
      .mockImplementationOnce(
        () =>
          new Promise<Response>((resolve) => {
            finishRefresh = resolve;
          }),
      )
      .mockImplementation(() => Promise.resolve(ok()));
    vi.stubGlobal('fetch', fetch);
    const http = client();
    const controller = new AbortController();
    const cancelled = http.request({ ...options, signal: controller.signal });
    const active = http.request(options);
    await vi.waitFor(() => expect(finishRefresh).toBeTypeOf('function'));
    controller.abort();
    await expect(cancelled).rejects.toMatchObject({ kind: 'cancelled' });
    finishRefresh(refreshed());
    await expect(active).resolves.toEqual({ ok: true });
    expect(fetch).toHaveBeenCalledTimes(4);
  });
});
