import { intlLocale, type Locale } from './i18n/locale';

const usdFormatterCache = new Map<string, Intl.NumberFormat>();
const decimalFormatterCache = new Map<string, Intl.NumberFormat>();
const percentFormatterCache = new Map<string, Intl.NumberFormat>();
const dateTimeFormatterCache = new Map<string, Intl.DateTimeFormat>();

function getUsdFormatter(
  minDigits: number,
  maxDigits: number,
): Intl.NumberFormat {
  const key = `${minDigits}:${maxDigits}`;
  let formatter = usdFormatterCache.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: minDigits,
      maximumFractionDigits: maxDigits,
    });
    usdFormatterCache.set(key, formatter);
  }
  return formatter;
}

function getDecimalFormatter(
  locale: Locale,
  maxDigits: number,
): Intl.NumberFormat {
  const tag = intlLocale(locale);
  const key = `${tag}:${maxDigits}`;
  let formatter = decimalFormatterCache.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(tag, {
      maximumFractionDigits: maxDigits,
    });
    decimalFormatterCache.set(key, formatter);
  }
  return formatter;
}

function getPercentFormatter(
  locale: Locale,
  signed: boolean,
  digits: number,
): Intl.NumberFormat {
  const tag = intlLocale(locale);
  const key = `${tag}:${signed ? '1' : '0'}:${digits}`;
  let formatter = percentFormatterCache.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(tag, {
      style: 'percent',
      signDisplay: signed ? 'exceptZero' : 'auto',
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
    percentFormatterCache.set(key, formatter);
  }
  return formatter;
}

function getDateTimeFormatter(
  locale: Locale,
  includeTime: boolean,
  timeZone?: string,
): Intl.DateTimeFormat {
  const tag = intlLocale(locale);
  const key = `${tag}:${includeTime ? '1' : '0'}:${timeZone ?? 'local'}`;
  let formatter = dateTimeFormatterCache.get(key);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(tag, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {}),
      ...(timeZone ? { timeZone } : {}),
    });
    dateTimeFormatterCache.set(key, formatter);
  }
  return formatter;
}

function toFiniteNumber(value: number | string): number | null {
  const numeric = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

/** Formats USD monetary amounts with tabular-safe en-US grouping and optional currency suffix. */
export function formatUsd(
  value: number | string,
  options?: {
    withCode?: boolean | undefined;
    minimumFractionDigits?: number | undefined;
    maximumFractionDigits?: number | undefined;
  },
): string {
  const minDigits = options?.minimumFractionDigits ?? 2;
  const maxDigits = Math.max(minDigits, options?.maximumFractionDigits ?? 2);
  const numeric = toFiniteNumber(value) ?? 0;
  const sign = numeric < 0 ? '-' : '';
  const formatted = getUsdFormatter(minDigits, maxDigits).format(
    Math.abs(numeric),
  );
  return `${sign}$${formatted}${options?.withCode ? ' USD' : ''}`;
}

/** Formats a fractional ratio (e.g. 0.025 -> +2.50%) using cached locale-aware formatters. */
export function formatPercent(
  ratio: number,
  locale: Locale = 'es',
  options?: {
    signed?: boolean | undefined;
    fractionDigits?: number | undefined;
  },
): string {
  const safeRatio = Number.isFinite(ratio) ? ratio : 0;
  const signed = options?.signed ?? true;
  const digits = options?.fractionDigits ?? 2;
  return getPercentFormatter(locale, signed, digits).format(safeRatio);
}

/** Formats decimal quantities or quotes using the active locale. */
export function formatDecimalNumber(
  value: number | string,
  locale: Locale = 'es',
  maximumFractionDigits = 8,
): string {
  const numeric = toFiniteNumber(value);
  if (numeric === null) return '—';
  return getDecimalFormatter(locale, maximumFractionDigits).format(numeric);
}

/** Formats ISO timestamps or Date instances consistently across tables and cards. */
export function formatMarketDateTime(
  value: string | number | Date,
  locale: Locale = 'es',
  options?: {
    includeTime?: boolean | undefined;
    timeZone?: string | undefined;
  },
): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const includeTime = options?.includeTime ?? true;
  return getDateTimeFormatter(locale, includeTime, options?.timeZone).format(
    date,
  );
}
