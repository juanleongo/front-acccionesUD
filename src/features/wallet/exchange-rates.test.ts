import { expect, it, vi } from 'vitest';
vi.mock('@/lib/api/client', () => ({ browserHttp: { request: vi.fn() } }));
import type { JsonRequest } from '@/lib/api/http-port';
import { browserHttp } from '@/lib/api/client';
import { convertedUsd, fetchExchangeRates } from './exchange-rates';
it.each([
  ['100000', 4000, '25.00'],
  ['100', 0.92, '108.70'],
  ['100', 0.78, '128.21'],
  ['25', 1, '25.00'],
])('convierte %s con tasa %s', (amount, rate, expected) => {
  expect(convertedUsd(amount, rate)).toBe(expected);
});
it.each([0, -1, Infinity, NaN])('rechaza una tasa inválida %s', (rate) =>
  expect(convertedUsd('100', rate)).toBeNull(),
);

it('carga el catálogo mundial y excluye criptomonedas y metales', async () => {
  vi.mocked(browserHttp.request).mockImplementation(async (options) => {
    const data =
      options.path === '/api/public/currencies'
        ? [
            { iso_code: 'JPY', type: 'currency' },
            { iso_code: 'USDT', type: 'crypto' },
            { iso_code: 'XAU', type: 'metal' },
          ]
        : ['JPY', 'USDT', 'XAU'].map((quote) => ({
            base: 'USD',
            quote,
            rate: 150,
            date: '2026-11-23',
          }));
    return (options as unknown as JsonRequest<unknown>).parse(data) as never;
  });
  expect(await fetchExchangeRates(new AbortController().signal)).toEqual([
    { base: 'USD', quote: 'JPY', rate: 150, date: '2026-11-23' },
  ]);
});
