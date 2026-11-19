import { expect, test } from '@playwright/test';

test('carga regiones y ciudades reales bajo demanda sin incluir el catálogo mundial', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  let catalogRequests = 0;
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/api/catalog/locations?*', async (route) => {
    catalogRequests++;
    await gate;
    await route.continue();
  });
  await page.goto('/registro');
  for (const [name, value] of Object.entries({
    first_names: 'Ana',
    last_names: 'Perez',
    email: 'ana@example.org',
    phone: '+573001234567',
    password: 'Prueba123',
  }))
    await page.locator(`[name="${name}"]`).fill(value);
  expect(catalogRequests).toBe(0);
  await page.locator('input[role="combobox"]').fill('Colombia');
  await page
    .getByRole('listbox', { name: 'Países disponibles' })
    .getByRole('option', { name: /Colombia/ })
    .click();
  const next = page.getByRole('button', { name: 'Continuar', exact: true });
  await next.click();
  await next.click();
  await expect(page.getByText('Cargando regiones y ciudades…')).toBeVisible();
  await expect(page.locator('select[name="state"] option')).toHaveCount(1);
  release();
  await expect(
    page.locator('select[name="state"] option[value="ANT"]'),
  ).toHaveText('Antioquia');
  await page
    .getByRole('button', { name: 'Selecciona una región', exact: true })
    .click();
  await page.getByRole('option', { name: 'Antioquia', exact: true }).click();
  await expect(
    page.locator('select[name="city"] option[value="Medellín"]'),
  ).toHaveText('Medellín');
  await page
    .getByRole('button', { name: 'Selecciona una ciudad', exact: true })
    .click();
  await page.getByRole('option', { name: 'Medellín', exact: true }).click();
  await expect(page.locator('[name="state_name"]')).toHaveValue('Antioquia');
  await expect(page.locator('[name="city"]')).toHaveValue('Medellín');
  expect(errors).toEqual([]);
});
