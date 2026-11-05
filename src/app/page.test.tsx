// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { useQueryClient } from '@tanstack/react-query';
import type { QueryClient } from '@tanstack/react-query';
import { expect, it } from 'vitest';
import HomePage from './page';
import { Providers } from './providers';

it('renders the technical landing page', () => {
  render(
    <Providers>
      <HomePage />
    </Providers>,
  );
  expect(
    screen.getByRole('heading', { name: 'Acciones UD', level: 1 }),
  ).toBeVisible();
  expect(
    screen.getByText('La infraestructura inicial está preparada.'),
  ).toBeVisible();
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
