import { z } from 'zod';
import { browserHttp } from '@/lib/api/client';

export const periods = {
  '1D': { days: 1, frame: '5Min', label: 'Último día', labelEn: 'Last day' },
  '1W': {
    days: 7,
    frame: '15Min',
    label: 'Última semana',
    labelEn: 'Last week',
  },
  '1M': {
    days: 30,
    frame: '1Hour',
    label: 'Último mes',
    labelEn: 'Last month',
  },
  '6M': {
    days: 183,
    frame: '1Day',
    label: 'Últimos seis meses',
    labelEn: 'Last 6 months',
  },
  '1Y': {
    days: 365,
    frame: '1Day',
    label: 'Último año',
    labelEn: 'Last year',
  },
  '3Y': {
    days: 1095,
    frame: '1Day',
    label: 'Últimos tres años',
    labelEn: 'Last 3 years',
  },
  MAX: {
    days: 0,
    frame: '1Day',
    label: 'Histórico disponible',
    labelEn: 'Max available history',
  },
} as const;
export type Period = keyof typeof periods;
const close = z
  .union([z.number(), z.string().regex(/^-?\d+(?:\.\d+)?(?:e[+-]?\d+)?$/i)])
  .transform(Number)
  .pipe(z.number().finite());
export const candleFrames = {
  '1Min': '1 minuto',
  '5Min': '5 minutos',
  '15Min': '15 minutos',
  '1Hour': '1 hora',
  '1Day': '1 día',
} as const;
export const candleFramesEn: Record<keyof typeof candleFrames, string> = {
  '1Min': '1 minute',
  '5Min': '5 minutes',
  '15Min': '15 minutes',
  '1Hour': '1 hour',
  '1Day': '1 day',
};
export type CandleFrame = keyof typeof candleFrames;
export type Candle = {
  time: number;
  price: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
};
const pageSchema = z.object({
  bars: z.array(
    z
      .object({
        timestamp: z.iso.datetime({ offset: true }),
        open: close,
        high: close,
        low: close,
        close,
        volume: close.pipe(z.number().nonnegative()).nullish(),
      })
      .refine(
        (bar) =>
          bar.low <= Math.min(bar.open, bar.close) &&
          bar.high >= Math.max(bar.open, bar.close) &&
          bar.low <= bar.high,
        { message: 'Invalid OHLC range' },
      ),
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
  timeframe?: CandleFrame,
) {
  const end = new Date();
  const { days, frame } = periods[period];
  const start = new Date(days ? end.getTime() - days * 86400000 : 0);
  const values = new Map<number, Candle>();
  const seen = new Set<string>();
  let token: string | null = null;
  for (;;) {
    const page: z.infer<typeof pageSchema> = await browserHttp.request({
      path: '/api/v1/instruments/' + symbol + '/candles',
      query: {
        timeframe: timeframe ?? frame,
        start: start.toISOString(),
        end: end.toISOString(),
        page_size: '10000',
        ...(token ? { page_token: token } : {}),
      },
      signal,
      response: 'json',
      parse: pageSchema.parse,
    });
    for (const bar of page.bars) {
      const previous = values.get(Date.parse(bar.timestamp));
      if (
        previous &&
        (previous.open !== bar.open ||
          previous.high !== bar.high ||
          previous.low !== bar.low ||
          previous.close !== bar.close ||
          previous.volume !== (bar.volume ?? undefined))
      )
        throw new Error('Conflicting duplicate OHLC bar');
      values.set(Date.parse(bar.timestamp), {
        time: Date.parse(bar.timestamp),
        price: bar.close,
        open: bar.open,
        high: bar.high,
        low: bar.low,
        close: bar.close,
        ...(bar.volume != null ? { volume: bar.volume } : {}),
      });
    }
    token = page.next_page_token;
    if (!token)
      return {
        points: Array.from(values.values()).sort((a, b) => a.time - b.time),
        currency: page.currency,
        source: page.source,
        delayed: page.is_delayed,
      };
    if (seen.has(token)) throw new Error('Paginación histórica inválida');
    seen.add(token);
  }
}
