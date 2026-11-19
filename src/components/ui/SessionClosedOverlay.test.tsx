// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { SessionClosedOverlay } from './SessionClosedOverlay';

it('muestra el aviso centrado de sesión cerrada y permite volver a iniciar sesión', () => {
  const clear = vi.fn();
  render(<SessionClosedOverlay onBeforeNavigate={clear} />);
  expect(screen.getByRole('alertdialog')).toHaveTextContent(
    '¿Te faltó una acción? Tu sesión se cerró',
  );
  const loginLink = screen.getByRole('link', {
    name: /Iniciar sesión de nuevo/,
  });
  expect(loginLink).toHaveAttribute('href', '/login');
  fireEvent.click(loginLink);
  expect(clear).toHaveBeenCalledOnce();
});
