import { z } from 'zod';
import { browserHttp } from '@/lib/api/client';
export type DepositCurrency = string;
const schema = z.array(
  z.object({
    date: z.iso.date(),
    base: z.literal('USD'),
    quote: z.string().min(1),
    rate: z.number().positive().finite(),
  }),
);
export type ExchangeRate = z.infer<typeof schema>[number];
const currenciesSchema = z.array(
  z.object({
    iso_code: z.string().min(1),
    type: z.string(),
  }),
);
export async function fetchExchangeRates(signal: AbortSignal) {
  const [rates, currencies] = await Promise.all([
    browserHttp.request({
      path: '/api/public/exchange-rates',
      method: 'GET',
      response: 'json',
      parse: schema.parse,
      signal,
    }),
    browserHttp.request({
      path: '/api/public/currencies',
      method: 'GET',
      response: 'json',
      parse: currenciesSchema.parse,
      signal,
    }),
  ]);
  const fiat = new Set(
    currencies
      .filter(
        (item) => item.type === 'currency' && /^[A-Z]{3}$/.test(item.iso_code),
      )
      .map((item) => item.iso_code),
  );
  return rates.filter((item) => fiat.has(item.quote));
}
export function convertedUsd(
  amount: string,
  unitsPerUsd: number,
): string | null {
  if (
    !/^\d+(?:\.\d{1,2})?$/.test(amount) ||
    !Number.isFinite(unitsPerUsd) ||
    unitsPerUsd <= 0
  )
    return null;
  const value = Number(amount) / unitsPerUsd;
  return Number.isFinite(value) &&
    value > 0 &&
    value <= Number.MAX_SAFE_INTEGER / 100
    ? value.toFixed(2)
    : null;
}

export function isRecentRate(date: string): boolean {
  return Date.now() - Date.parse(date + 'T00:00:00Z') <= 7 * 86400000;
}
