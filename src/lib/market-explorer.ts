'use client';
import { z } from 'zod';
import { browserHttp } from '@/lib/api/client';
const decimal = z
  .union([z.number(), z.string().regex(/^-?\d+(?:\.\d+)?(?:e[+-]?\d+)?$/i)])
  .transform(Number)
  .pipe(z.number().finite());
export const publicMarketPage = z.object({
  results: z.array(
    z.object({
      symbol: z.string(),
      name: z.string(),
      exchange: z.string(),
      tradable: z.boolean(),
      price: decimal.nullable(),
      change_ratio: decimal.nullable(),
      as_of: z.iso.datetime({ offset: true }).nullable(),
      feed: z.string(),
      is_delayed: z.boolean(),
      is_stale: z.boolean(),
    }),
  ),
  markets: z.array(z.object({ code: z.string(), name: z.string() })),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  page_size: z.number().int().positive(),
  retrieved_at: z.iso.datetime({ offset: true }),
  market_open: z.boolean().nullable(),
  quotes_unavailable: z.boolean(),
  source: z.literal('alpaca'),
  currency: z.string(),
});
export type PublicMarketAsset = z.infer<
  typeof publicMarketPage
>['results'][number];
export function getPublicMarketPage(
  q: string,
  exchange: string,
  page: number,
  signal: AbortSignal,
) {
  return browserHttp.request({
    path: '/api/v1/public/market-explorer',
    query: { q, page: String(page), ...(exchange ? { exchange } : {}) },
    signal,
    timeoutMs: 15_000,
    response: 'json',
    parse: publicMarketPage.parse,
  });
}
