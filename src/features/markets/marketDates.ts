import { tz } from './api';

const instantFormatter = new Intl.DateTimeFormat('es-CO', {
  timeZone: tz,
  dateStyle: 'short',
  timeStyle: 'short',
});
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
export const formatInstant = (value: string | null) =>
  value ? instantFormatter.format(new Date(value)) : '—';
export const today = () => localDay.format(new Date());
