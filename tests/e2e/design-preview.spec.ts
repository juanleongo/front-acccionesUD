import { test, expect, type Page } from '@playwright/test';
import { checkLayout, checkMatrix } from '../fixtures/responsive-layout';

async function select(page: Page, name: string, option: string) {
  await page
    .locator(`select[aria-label="${name}"]`)
    .locator('..')
    .locator('button[aria-haspopup="listbox"]')
    .click();
  await page.getByRole('option', { name: option, exact: true }).click();
}

for (const theme of ['dark', 'light']) {
  for (const locale of ['es', 'en']) {
    test(`${theme}/${locale}: missing views, mobile/desktop and isolated states`, async ({
      page,
    }, info) => {
      const apiCalls: string[] = [];
      page.on('request', (request) => {
        if (new URL(request.url()).pathname.startsWith('/api/v1'))
          apiCalls.push(request.url());
      });
      await page.addInitScript(
        ({ theme, locale }) => {
          localStorage.setItem('acciones_ud_theme', theme);
          localStorage.setItem('acciones_ud_locale', locale);
        },
        { theme, locale },
      );
      await page.goto('/vista-previa');
      await expect(
        page.getByRole('heading', {
          name: locale === 'es' ? 'Seguimiento' : 'Following',
          exact: true,
        }),
      ).toBeVisible();
      const sections =
        locale === 'es'
          ? [
              'Seguimiento',
              'Seguridad',
              'Preferencias',
              'Plan Prémium',
              'Mis comisiones',
            ]
          : [
              'Following',
              'Security',
              'Preferences',
              'Premium plan',
              'My commissions',
            ];
      for (const section of sections) {
        await page
          .getByRole('navigation', {
            name:
              locale === 'es'
                ? 'Vistas por integrar'
                : 'Views awaiting integration',
          })
          .getByRole('button', { name: section, exact: true })
          .click();
        await checkMatrix(page, `${theme}-${locale}-${section}`, info, false);
      }
      await page.setViewportSize({ width: 390, height: 844 });
      for (const [state, label] of locale === 'es'
        ? [
            ['Sin datos', 'Sin comisiones en este período'],
            ['Cargando', 'Consultando tu información…'],
            ['Error de consulta', 'No pudimos cargar esta sección'],
            ['Sin acceso', 'Esta función requiere acceso habilitado'],
          ]
        : [
            ['No data', 'No commissions in this period'],
            ['Loading', 'Loading your information…'],
            ['Request error', 'This section could not be loaded'],
            ['Access restricted', 'This feature requires access'],
          ]) {
        await select(
          page,
          locale === 'es' ? 'Estado de la vista' : 'View state',
          state!,
        );
        await expect(page.getByText(label!, { exact: true })).toBeVisible();
        await checkLayout(page, `${theme}-${locale}-${state}`, info);
      }
      expect(apiCalls).toEqual([]);
    });
  }
}

test('review forms, confirmations, price alerts and roles without writes', async ({
  page,
}, info) => {
  const writes: string[] = [];
  page.on('request', (request) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method()))
      writes.push(request.url());
  });
  await page.goto('/vista-previa');
  await page.setViewportSize({ width: 320, height: 740 });
  await page.getByRole('button', { name: 'Crear lista', exact: true }).click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Continuar', exact: true })
    .click();
  await expect(page.locator('main [role="alert"]')).toContainText('1 a 100');
  await page.getByLabel('Nombre de la lista').fill('Empresas que me interesan');
  await checkMatrix(page, 'create-watchlist-dialog', info, false);
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Continuar', exact: true })
    .click();
  await expect(page.getByRole('status')).toContainText('No se ha guardado');
  await page
    .getByRole('button', { name: 'Alertas de precio', exact: true })
    .click();
  await page.getByRole('button', { name: 'Crear alerta', exact: true }).click();
  await select(page, 'Acción', 'AAPL · Apple Inc.');
  await select(page, 'Condición de precio', 'Cruce');
  await page.getByLabel('Precio objetivo (USD)').fill('200.00');
  await checkMatrix(page, 'price-alert-dialog', info, false);
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Continuar', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Notificaciones', exact: true })
    .click();
  await expect(
    page.getByText('Tu lista está lista para explorar', { exact: true }),
  ).toBeVisible();
  await page
    .getByRole('navigation', { name: 'Vistas por integrar' })
    .getByRole('button', { name: 'Seguridad', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Cerrar las otras sesiones', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'Confirmar cierre', exact: true }),
  ).toBeDisabled();
  await page.getByRole('checkbox').check();
  await expect(
    page.getByRole('button', { name: 'Confirmar cierre', exact: true }),
  ).toBeEnabled();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page
    .getByRole('button', { name: 'Generar nuevos códigos', exact: true })
    .click();
  await expect(page.getByRole('dialog')).toContainText('dejarán de funcionar');
  await page.keyboard.press('Escape');
  await page
    .getByRole('navigation', { name: 'Vistas por integrar' })
    .getByRole('button', { name: 'Preferencias', exact: true })
    .click();
  await page.getByLabel('Máximo de órdenes al día').fill('0');
  await page
    .getByRole('button', { name: 'Guardar controles', exact: true })
    .click();
  await expect(page.locator('main [role="alert"]')).toContainText('1 a 1.000');
  await page.getByLabel('Máximo de órdenes al día').fill('10');
  const control = page.getByRole('switch', { name: 'Confirmación adicional' });
  await control.click();
  await expect(control).toHaveAttribute('aria-checked', 'false');
  await page
    .getByRole('button', { name: 'Guardar controles', exact: true })
    .click();
  await expect(page.locator('main [role="alert"]')).toHaveCount(0);
  await page
    .getByRole('navigation', { name: 'Vistas por integrar' })
    .getByRole('button', { name: 'Plan Prémium', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Elegir este plan', exact: true })
    .first()
    .click();
  await expect(page.getByRole('dialog')).toContainText('Stripe');
  await page.keyboard.press('Escape');
  await select(page, 'Estado de suscripción', 'Activa');
  await page
    .getByRole('button', { name: 'Cancelar renovación', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Confirmar cancelación', exact: true })
    .click();
  await expect(page.locator('main [role="alert"]')).toContainText('1 a 500');
  await checkMatrix(page, 'cancel-subscription-dialog', info, false);
  await page
    .getByLabel('Motivo de cancelación')
    .fill('Quiero pausar la renovación.');
  await page
    .getByRole('button', { name: 'Confirmar cancelación', exact: true })
    .click();
  await expect(page.getByRole('status')).toContainText('No se ha guardado');
  await select(page, 'Estado de suscripción', 'Renovación cancelada');
  await expect(
    page.getByText('La renovación está cancelada.', { exact: false }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Ver detalle', exact: true })
    .first()
    .click();
  await checkMatrix(page, 'payment-details-dialog', info, false);
  await page.keyboard.press('Escape');
  await page
    .getByRole('navigation', { name: 'Vistas por integrar' })
    .getByRole('button', { name: 'Mis comisiones', exact: true })
    .click();
  await select(page, 'Vista del rol', 'Comisionista');
  await expect(
    page.getByRole('heading', { name: 'Comisiones por tu asesoría' }),
  ).toBeVisible();
  await expect(page.locator('select[aria-label="Cliente"]')).toHaveCount(1);
  await checkMatrix(page, 'broker-commissions', info, true);
  expect(writes).toEqual([]);
});
