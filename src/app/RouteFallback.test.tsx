// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { setAppLocale } from '@/lib/i18n';
import AppError from './error';
import NotFound from './not-found';
import { Providers } from './providers';

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  setAppLocale('es');
});

describe('App Router fallbacks', () => {
  it('renders bilingual error fallback with retry and home link', () => {
    const reset = vi.fn();
    render(
      <Providers>
        <AppError error={new Error('boom')} reset={reset} />
      </Providers>,
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar carga' }));
    expect(reset).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole('link', { name: 'Volver al inicio' }),
    ).toHaveAttribute('href', '/');
  });

  it('renders bilingual 404 not-found card in English when locale is en', () => {
    setAppLocale('en');
    render(
      <Providers>
        <NotFound />
      </Providers>,
    );

    expect(
      screen.getByRole('heading', {
        name: 'This page does not exist on Acciones UD',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Explore markets' }),
    ).toHaveAttribute('href', '/markets');
  });
});
