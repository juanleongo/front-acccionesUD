// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { setAppLocale } from '@/lib/i18n';
import { SessionClosedOverlay } from './SessionClosedOverlay';

it('muestra el aviso centrado de sesión cerrada y permite volver a iniciar sesión', () => {
  const clear = vi.fn();
  render(<SessionClosedOverlay onBeforeNavigate={clear} />);
  expect(screen.getByRole('alertdialog')).toHaveTextContent(
    'Vuelve a iniciar sesión',
  );
  const loginLink = screen.getByRole('link', {
    name: /Iniciar sesión de nuevo/,
  });
  expect(loginLink).toHaveAttribute('href', '/login');
  fireEvent.click(loginLink);
  expect(clear).toHaveBeenCalledOnce();
});

afterEach(() => setAppLocale('es'));
it('conserva el último idioma en el aviso y al navegar a iniciar sesión', () => {
  setAppLocale('en');
  const clear = vi.fn();
  const { unmount } = render(<SessionClosedOverlay onBeforeNavigate={clear} />);
  expect(screen.getByRole('alertdialog')).toHaveTextContent(
    'Sign in to continue',
  );
  fireEvent.click(screen.getByRole('link', { name: 'Sign in again' }));
  expect(clear).toHaveBeenCalledOnce();
  expect(localStorage.getItem('acciones_ud_locale')).toBe('en');
  unmount();
  render(<SessionClosedOverlay />);
  expect(screen.getByRole('alertdialog')).toHaveTextContent(
    'Sign in to continue',
  );
});
