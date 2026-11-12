import { test, expect } from '@playwright/test';
test('la portada enlaza al explorador y al registro móvil', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Explorar mercados' }).click();
  await expect(page).toHaveURL(/\/markets$/);
  await page.goto('/');
  await page.setViewportSize({ width: 375, height: 812 });
  await page.getByRole('button', { name: 'Abrir menú' }).click();
  await page
    .getByRole('navigation', { name: 'Navegación principal' })
    .getByRole('link', { name: 'Abrir cuenta de práctica' })
    .click();
  await expect(page).toHaveURL(/\/registro$/);
});
