export type Locale = 'es' | 'en';

export const LOCALE_STORAGE_KEY = 'acciones_ud_locale';

export function normalizeLocale(raw: unknown): Locale {
  return raw === 'en' ? 'en' : 'es';
}

export function tx<T = string>(locale: Locale, es: T, en: T): T {
  return locale === 'en' ? en : es;
}

export function intlLocale(locale: Locale): string {
  return locale === 'en' ? 'en-US' : 'es-CO';
}
