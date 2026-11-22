// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useQueryClient } from '@tanstack/react-query';
import type { QueryClient } from '@tanstack/react-query';
import { afterEach, expect, it } from 'vitest';
import { setAppLocale } from '@/lib/i18n';
import HomePage from './page';
import { Providers } from './providers';

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  setAppLocale('es');
});

it('routes market exploration through sign in', () => {
  render(
    <Providers>
      <HomePage />
    </Providers>,
  );
  expect(
    screen.getByRole('link', { name: 'Explorar mercados' }),
  ).toHaveAttribute('href', '/login');
  expect(
    screen.getByRole('region', { name: 'Explorador de mercados de EE. UU.' }),
  ).toBeVisible();
});

it('switches the landing UI to English when clicking the header language button', () => {
  render(
    <Providers>
      <HomePage />
    </Providers>,
  );
  const toggle = screen.getByRole('button', {
    name: 'Cambiar idioma a inglés',
  });
  fireEvent.click(toggle);

  expect(screen.getByRole('link', { name: 'Explore markets' })).toHaveAttribute(
    'href',
    '/login',
  );
  expect(document.documentElement.lang).toBe('en');
});
it('keeps the provider client stable across re-renders and isolated between mounts', () => {
  const clients: QueryClient[] = [];
  function Probe() {
    clients.push(useQueryClient());
    return null;
  }
  const first = render(
    <Providers>
      <Probe />
    </Providers>,
  );
  first.rerender(
    <Providers>
      <Probe />
    </Providers>,
  );
  expect(clients[0]).toBe(clients[1]);
  render(
    <Providers>
      <Probe />
    </Providers>,
  );
  expect(clients[2]).not.toBe(clients[0]);
  clients.forEach((client) => client.clear());
});
