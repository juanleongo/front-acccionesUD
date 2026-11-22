'use client';

import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';
import {
  intlLocale,
  LOCALE_STORAGE_KEY,
  normalizeLocale,
  tx as translate,
  type Locale,
} from './locale';

const listeners = new Set<() => void>();
let fallbackMemoryLocale: Locale = 'es';
let storageListenerAttached = false;

function handleStorageEvent(event: StorageEvent) {
  if (event.key !== LOCALE_STORAGE_KEY) return;
  fallbackMemoryLocale = normalizeLocale(event.newValue);
  for (const notify of [...listeners]) {
    notify();
  }
}

function getLocaleSnapshot(): Locale {
  if (typeof window === 'undefined') return 'es';
  try {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored === 'es' || stored === 'en') {
      return stored;
    }
  } catch {
    /* Acceso a localStorage bloqueado; se usa memoria local. */
  }
  return fallbackMemoryLocale;
}

function subscribeLocale(listener: () => void): () => void {
  listeners.add(listener);
  if (typeof window !== 'undefined' && !storageListenerAttached) {
    window.addEventListener('storage', handleStorageEvent);
    storageListenerAttached = true;
  }
  return () => {
    listeners.delete(listener);
    if (
      typeof window !== 'undefined' &&
      storageListenerAttached &&
      listeners.size === 0
    ) {
      window.removeEventListener('storage', handleStorageEvent);
      storageListenerAttached = false;
    }
  };
}

export function setAppLocale(nextLocale: Locale): void {
  const normalized = normalizeLocale(nextLocale);
  fallbackMemoryLocale = normalized;
  if (typeof document !== 'undefined') {
    document.documentElement.lang = normalized;
    document.documentElement.dataset.locale = normalized;
  }
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, normalized);
    }
  } catch {
    /* Persistencia opcional */
  }
  for (const listener of listeners) {
    listener();
  }
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const locale = useSyncExternalStore<Locale>(
    subscribeLocale,
    getLocaleSnapshot,
    (): Locale => 'es',
  );

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dataset.locale = locale;
  }, [locale]);

  return <>{children}</>;
}

export function useLocale() {
  const locale = useSyncExternalStore<Locale>(
    subscribeLocale,
    getLocaleSnapshot,
    (): Locale => 'es',
  );

  const setLocale = useCallback((next: Locale) => {
    setAppLocale(next);
  }, []);

  const toggleLocale = useCallback(() => {
    const current = getLocaleSnapshot();
    setAppLocale(current === 'es' ? 'en' : 'es');
  }, []);

  const tx = useCallback(
    <T = string,>(es: T, en: T): T => translate(locale, es, en),
    [locale],
  );

  return useMemo(
    () => ({
      locale,
      isEn: locale === 'en',
      intl: intlLocale(locale),
      setLocale,
      toggleLocale,
      tx,
    }),
    [locale, setLocale, toggleLocale, tx],
  );
}
