import { formatMarketDateTime } from '@/lib/formatters';
import type { Locale } from '@/lib/i18n/locale';
import { tz } from './api';

export const localDay = new Intl.DateTimeFormat('en-CA', {
  timeZone: tz,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});
export const localTime = new Intl.DateTimeFormat('en-GB', {
  timeZone: tz,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});
export const formatInstant = (value: string | null, locale: Locale = 'es') =>
  value
    ? formatMarketDateTime(value, locale, { includeTime: true, timeZone: tz })
    : '—';
export const today = () => localDay.format(new Date());
