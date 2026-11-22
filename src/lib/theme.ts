'use client';

export type Theme = 'dark' | 'light';

export const THEME_STORAGE_KEY = 'acciones_ud_theme';

export function normalizeTheme(value: unknown): Theme | null {
  return value === 'light' || value === 'dark' ? value : null;
}

export function getStoredTheme(): Theme | null {
  if (typeof window === 'undefined') return null;
  try {
    return normalizeTheme(window.localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    return null;
  }
}

export function getDocumentTheme(): Theme {
  if (typeof document === 'undefined') return 'dark';
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

export function applyTheme(theme: Theme, persist = true): void {
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.theme = theme;
  }
  if (!persist || typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* Preferencia de almacenamiento opcional. */
  }
}

export function toggleDocumentTheme(): Theme {
  const next: Theme = getDocumentTheme() === 'light' ? 'dark' : 'light';
  applyTheme(next, true);
  return next;
}

/** Keeps multiple open tabs aligned when theme preference changes in localStorage. */
export function subscribeThemeStorage(
  onThemeChange: (theme: Theme) => void,
): () => void {
  if (typeof window === 'undefined') return () => {};
  const onStorage = (event: StorageEvent) => {
    if (event.key !== THEME_STORAGE_KEY) return;
    const next = normalizeTheme(event.newValue);
    if (next) onThemeChange(next);
  };
  window.addEventListener('storage', onStorage);
  return () => window.removeEventListener('storage', onStorage);
}

/** Observe the shared theme, including changes made in the current tab. */
export function subscribeDocumentTheme(onThemeChange: () => void): () => void {
  const stopStorage = subscribeThemeStorage(onThemeChange);
  if (
    typeof document === 'undefined' ||
    typeof MutationObserver === 'undefined'
  )
    return stopStorage;
  const observer = new MutationObserver(onThemeChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  });
  return () => {
    observer.disconnect();
    stopStorage();
  };
}
