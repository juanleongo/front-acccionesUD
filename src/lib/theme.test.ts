// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import {
  applyTheme,
  getDocumentTheme,
  getStoredTheme,
  subscribeThemeStorage,
  THEME_STORAGE_KEY,
  toggleDocumentTheme,
} from './theme';

afterEach(() => {
  window.localStorage.clear();
  delete document.documentElement.dataset.theme;
});

describe('shared theme utilities', () => {
  it('applies, persists and toggles theme on documentElement', () => {
    applyTheme('light');
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(getStoredTheme()).toBe('light');
    expect(getDocumentTheme()).toBe('light');

    const next = toggleDocumentTheme();
    expect(next).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
  });

  it('notifies subscribers on cross-tab storage changes', () => {
    const seen: string[] = [];
    const unsubscribe = subscribeThemeStorage((theme) => seen.push(theme));

    window.dispatchEvent(
      new StorageEvent('storage', {
        key: THEME_STORAGE_KEY,
        newValue: 'light',
      }),
    );
    window.dispatchEvent(
      new StorageEvent('storage', { key: 'other_key', newValue: 'dark' }),
    );

    expect(seen).toEqual(['light']);
    unsubscribe();
  });
});
