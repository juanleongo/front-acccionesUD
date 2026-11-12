import { z } from 'zod';
import { browserHttp } from '@/lib/api/client';

const market = z.object({ code: z.string(), name: z.string() });
const instant = z.iso.datetime({ offset: true });
const schedule = z.object({
  date: z.iso.date(),
  open_at: instant.nullable(),
  close_at: instant.nullable(),
  override: z.boolean(),
});
const clock = z.object({
  is_open: z.boolean(),
  timestamp: instant,
  next_open: instant,
  next_close: instant,
  time_zone: z.string(),
});
const calendar = z.object({
  time_zone: z.string(),
  days: z.array(schedule.extend({ kind: z.string() })),
});
const status = schedule.extend({ market: z.string(), open: z.boolean() });
const root = '/api/v1/markets';
export const tz = 'America/New_York';

const instrumentPage = z.object({
  total: z.number().int().nonnegative(),
  page_size: z.number().int().positive(),
  results: z.array(z.object({ symbol: z.string().min(1), name: z.string() })),
});

export function getInstruments(
  exchange: string,
  q: string,
  page: number,
  signal: AbortSignal,
) {
  return browserHttp.request({
    path: '/api/v1/instruments/search',
    query: { exchange, q, page: String(page) },
    response: 'json',
    signal,
    parse: instrumentPage.parse,
  });
}

export function getMarkets(signal: AbortSignal) {
  return browserHttp.request({
    path: root,
    response: 'json',
    signal,
    parse: z.array(market).parse,
  });
}
export function getClock(signal: AbortSignal) {
  return browserHttp.request({
    path: root + '/clock',
    query: { tz },
    response: 'json',
    signal,
    parse: clock.parse,
  });
}
export function getStatus(market: string, date: string, signal: AbortSignal) {
  return browserHttp.request({
    path: root + '/' + encodeURIComponent(market) + '/status',
    query: { date, tz },
    response: 'json',
    signal,
    parse: status.parse,
  });
}
export function getCalendar(
  market: string,
  start: string,
  end: string,
  signal: AbortSignal,
) {
  return browserHttp.request({
    path: root + '/calendar',
    query: { market, start, end, tz },
    response: 'json',
    signal,
    parse: calendar.parse,
  });
}
