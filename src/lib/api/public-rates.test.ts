import { expect, it, vi } from 'vitest';
import { createFetchTransport } from './fetch-transport';
it('consulta tasas en el origen fijo sin cookies ni referencia del usuario', async () => {
  const fetchMock = vi
    .spyOn(globalThis, 'fetch')
    .mockResolvedValue(
      new Response('[]', { headers: { 'Content-Type': 'application/json' } }),
    );
  const transport = createFetchTransport({ credentials: 'same-origin' });
  await transport.request({
    path: '/api/public/exchange-rates',
    response: 'json',
    parse: (value) => value,
  });
  expect(fetchMock).toHaveBeenCalledWith(
    'https://api.frankfurter.dev/v2/rates?base=USD',
    expect.objectContaining({
      method: 'GET',
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      redirect: 'error',
    }),
  );
});
it('no admite cuerpos, cabeceras ni consultas arbitrarias para el proveedor pÃºblico', async () => {
  const fetchMock = vi.spyOn(globalThis, 'fetch');
  const transport = createFetchTransport({ credentials: 'same-origin' });
  for (const extra of [
    { method: 'POST' as const, body: { amount: '10' } },
    { headers: { 'Idempotency-Key': 'private' } },
    { query: { email: 'private' } },
    { requestId: 'private' },
  ]) {
    await expect(
      transport.request({
        path: '/api/public/exchange-rates',
        response: 'json',
        parse: (value) => value,
        ...extra,
      }),
    ).rejects.toThrow();
  }
  expect(fetchMock).not.toHaveBeenCalled();
});
