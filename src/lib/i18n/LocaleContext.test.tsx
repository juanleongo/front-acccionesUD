// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { LOCALE_STORAGE_KEY } from './locale';
import { LocaleProvider, setAppLocale, useLocale } from './LocaleContext';

function LocaleProbe() {
  const { locale, intl, toggleLocale, tx } = useLocale();
  return (
    <div>
      <button type="button" onClick={toggleLocale}>
        {locale.toUpperCase()}
      </button>
      <p data-testid="probe-state">
        {locale}:{intl}:{tx('Español activo', 'English active')}
      </p>
    </div>
  );
}

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  setAppLocale('es');
});

describe('i18n LocaleContext', () => {
  it('defaults to Spanish and switches between ES and EN with persistence', () => {
    render(
      <LocaleProvider>
        <LocaleProbe />
      </LocaleProvider>,
    );

    expect(screen.getByTestId('probe-state')).toHaveTextContent(
      'es:es-CO:Español activo',
    );
    expect(document.documentElement.lang).toBe('es');

    const toggleBtn = screen.getByRole('button', { name: 'ES' });
    fireEvent.click(toggleBtn);

    expect(screen.getByTestId('probe-state')).toHaveTextContent(
      'en:en-US:English active',
    );
    expect(document.documentElement.lang).toBe('en');
    expect(document.documentElement.dataset.locale).toBe('en');
    expect(window.localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('en');
    expect(toggleBtn).toHaveTextContent('EN');

    fireEvent.click(toggleBtn);

    expect(screen.getByTestId('probe-state')).toHaveTextContent(
      'es:es-CO:Español activo',
    );
    expect(document.documentElement.lang).toBe('es');
    expect(window.localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('es');
  });
});
