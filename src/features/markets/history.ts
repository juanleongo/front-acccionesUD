import { z } from 'zod';
import { browserHttp } from '@/lib/api/client';

export const periods = {
  '1D': { days: 1, frame: '5Min', label: 'Último día' },
  '1W': { days: 7, frame: '15Min', label: 'Última semana' },
  '1M': { days: 30, frame: '1Hour', label: 'Último mes' },
  '6M': { days: 183, frame: '1Day', label: 'Últimos seis meses' },
  '1Y': { days: 365, frame: '1Day', label: 'Último año' },
  '3Y': { days: 1095, frame: '1Day', label: 'Últimos tres años' },
  MAX: { days: 0, frame: '1Day', label: 'Histórico disponible' },
} as const;
export type Period = keyof typeof periods;
const close = z
  .union([z.number(), z.string().regex(/^-?\d+(?:\.\d+)?(?:e[+-]?\d+)?$/i)])
  .transform(Number)
  .pipe(z.number().finite());
const pageSchema = z.object({
  bars: z.array(
    z.object({ timestamp: z.iso.datetime({ offset: true }), close }),
  ),
  next_page_token: z.string().nullable(),
  currency: z.string().nullable(),
  source: z.string(),
  is_delayed: z.boolean(),
});
export async function history(
  symbol: string,
  period: Period,
  signal: AbortSignal,
) {
  const end = new Date();
  const { days, frame } = periods[period];
  const start = new Date(days ? end.getTime() - days * 86400000 : 0);
  const values = new Map<number, number>();
  const seen = new Set<string>();
  let token: string | null = null;
  for (;;) {
    const page: z.infer<typeof pageSchema> = await browserHttp.request({
      path: '/api/v1/instruments/' + symbol + '/candles',
      query: {
        timeframe: frame,
        start: start.toISOString(),
        end: end.toISOString(),
        page_size: '10000',
        ...(token ? { page_token: token } : {}),
      },
      signal,
      response: 'json',
      parse: pageSchema.parse,
    });
    for (const bar of page.bars)
      values.set(Date.parse(bar.timestamp), bar.close);
    token = page.next_page_token;
    if (!token)
      return {
        points: Array.from(values, ([time, price]) => ({ time, price })).sort(
          (a, b) => a.time - b.time,
        ),
        currency: page.currency,
        source: page.source,
        delayed: page.is_delayed,
      };
    if (seen.has(token)) throw new Error('Paginación histórica inválida');
    seen.add(token);
  }
}
