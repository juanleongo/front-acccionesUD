import { expect, it, vi } from 'vitest';
import { createFetchTransport } from './fetch-transport';
it.each(['BRK.B', 'BTC/USD'])(
  'permite quitar el símbolo %s de una lista',
  async (symbol) => {
    const spy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(
          JSON.stringify({ id: 'abc', name: 'Lista', symbols: [] }),
          { headers: { 'Content-Type': 'application/json' } },
        ),
      );
    await createFetchTransport({ credentials: 'same-origin' }).request({
      path: `/api/v1/watchlists/abc/items/${symbol}`,
      method: 'DELETE',
      response: 'json',
      parse: (value) => value,
    });
    expect(spy).toHaveBeenCalledWith(
      `/api/v1/watchlists/abc/items/${symbol}`,
      expect.objectContaining({ method: 'DELETE' }),
    );
  },
);
it.each(['../users', '%2e%2e/users', 'AAPL?token=secret'])(
  'rechaza traversal o parámetros en símbolos: %s',
  async (symbol) => {
    const spy = vi.spyOn(globalThis, 'fetch');
    await expect(
      createFetchTransport({ credentials: 'same-origin' }).request({
        path: `/api/v1/watchlists/abc/items/${symbol}`,
        method: 'DELETE',
        response: 'json',
        parse: (value) => value,
      }),
    ).rejects.toThrow();
    expect(spy).not.toHaveBeenCalled();
  },
);
