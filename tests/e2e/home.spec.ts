import { expect, test } from '@playwright/test';

test('la infraestructura carga sin backend ni conexiones WebSocket', async ({
  page,
}) => {
  const errors: string[] = [];
  const businessRequests: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('websocket', (socket) => businessRequests.push(socket.url()));
  page.on('request', (request) => {
    if (new URL(request.url()).pathname.startsWith('/api/'))
      businessRequests.push(request.url());
  });
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Acciones UD', level: 1 }),
  ).toBeVisible();
  await expect(
    page.getByText('La infraestructura inicial está preparada.'),
  ).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  await page.setViewportSize({ width: 320, height: 640 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
  expect(businessRequests).toEqual([]);
});
