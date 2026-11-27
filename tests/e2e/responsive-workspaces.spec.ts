import { expect, test } from '@playwright/test';
import { installResponsiveFixtures } from '../fixtures/responsive';
import {
  checkLayout,
  checkMatrix,
  navigateWorkspace,
} from '../fixtures/responsive-layout';

test.setTimeout(180_000);

for (const locale of ['es', 'en']) {
  for (const theme of ['light', 'dark']) {
    test.describe(`${locale}-${theme}`, () => {
      test.beforeEach(async ({ page }) => {
        await page.addInitScript(
          ({ locale, theme }) => {
            localStorage.setItem('acciones_ud_locale', locale);
            localStorage.setItem('acciones_ud_theme', theme);
          },
          { locale, theme },
        );
        await page.route('**/api/**', (route) =>
          route.fulfill({
            status: 503,
            json: { code: 'TEST_ENDPOINT_UNAVAILABLE' },
          }),
        );
        await installResponsiveFixtures(page);
      });

      test('rutas públicas, registro y autenticación', async ({
        page,
      }, info) => {
        for (const path of [
          '/',
          '/login',
          '/registro',
          '/registro/broker',
          '/markets',
          '/no-existe',
        ]) {
          await page.goto(path);
          await expect(page.locator('main')).toBeVisible();
          if (path === '/')
            await expect(page.locator('#mercados')).toContainText('Fixture UP');
          if (path === '/markets')
            await expect(
              page.locator('[data-chart-mode] canvas').first(),
            ).toBeVisible();
          await checkMatrix(page, path, info);
          if (path === '/markets') {
            for (const mode of ['line', 'area', 'candles']) {
              await page.locator('#price-chart-type').selectOption(mode);
              await expect(page.locator('[data-chart-mode]')).toHaveAttribute(
                'data-chart-mode',
                mode,
              );
              await checkMatrix(
                page,
                `grafico-${mode}`,
                info,
                mode === 'candles',
              );
            }
          }
          await page.setViewportSize({ width: 390, height: 740 });
          await page.screenshot({
            path: info.outputPath(`${path.replaceAll('/', '_') || 'home'}.png`),
            fullPage: true,
          });
        }
      });

      test('dashboard, mercados, órdenes, portafolio y billetera', async ({
        page,
      }, info) => {
        const errors: string[] = [];
        page.on('pageerror', (error) => errors.push(error.message));
        await page.goto('/dashboard');
        await expect(
          page.getByRole('heading', { name: /Hola|Hello/ }),
        ).toBeVisible();
        await checkMatrix(page, 'resumen', info);
        for (const [es, en] of [
          ['Mercados en Vivo', 'Live Markets'],
          ['Terminal de Órdenes', 'Order Terminal'],
          ['Portafolio', 'Portfolio'],
          ['Depósitos & Retiros', 'Deposits & Withdrawals'],
        ]) {
          await navigateWorkspace(page, locale === 'es' ? es! : en!);
          await page.locator('main').getByRole('heading').first().waitFor();
          await checkMatrix(page, es!, info);
          if (es === 'Terminal de Órdenes') {
            for (const type of [
              'limit',
              'stop',
              'stop_limit',
              'trailing_stop',
              'market',
            ]) {
              await page.locator('#order-type').selectOption(type);
              await checkMatrix(page, `orden-${type}`, info, false);
            }
            const budget = page.locator('summary').filter({
              hasText:
                /Calcular una compra por monto|Calculate a purchase by amount/,
            });
            await budget.click();
            await expect(page.locator('#order-budget')).toBeVisible();
            await checkMatrix(page, 'compra-por-monto', info, false);
            await budget.click();
            await expect(
              page.getByRole('region', {
                name: locale === 'es' ? 'Precio de AAPL' : 'AAPL price',
              }),
            ).toContainText('$100.00');
            const detailsButton = page.getByRole('button', {
              name: /Detalle y acciones|Details & actions/,
            });
            await detailsButton.scrollIntoViewIfNeeded();
            await expect(detailsButton).toBeInViewport({ ratio: 1 });
            await detailsButton.click();
            await expect(
              page.getByRole('heading', {
                name: /Detalle de orden|Order details/,
              }),
            ).toBeVisible();
            await checkMatrix(page, 'detalle-orden-ejecuciones', info);
            await page
              .getByRole('button', { name: /Cerrar detalle|Close details/ })
              .click();
          }
          if (es === 'Depósitos & Retiros') {
            await page.locator('#deposit-currency').selectOption('COP');
            await expect(page.locator('main')).toContainText('Frankfurter');
            await checkMatrix(page, 'deposito-conversion-cop-usd', info);
            await page
              .locator('summary')
              .filter({ hasText: /Vincular cuenta|Link test bank/ })
              .click();
            await checkMatrix(page, 'vincular-cuenta-bancaria', info);
            await page
              .getByRole('button', {
                name: /^(Retirar fondos|Withdraw funds)$/,
              })
              .click();
            await checkMatrix(page, 'retiro-bancario', info);
          }
          if (es === 'Portafolio') {
            await expect(page.locator('main')).toContainText('AAPL');
            for (let i = 0; i < 5; i++) {
              await page.getByRole('tab').nth(i).click();
              await expect(page.getByRole('tab').nth(i)).toHaveAttribute(
                'aria-selected',
                'true',
              );
              await checkMatrix(page, `portafolio-tab-${i}`, info);
              if (i === 0) {
                for (const label of [
                  'Tarjetas',
                  'Participación %',
                  'Tabla',
                ] as const) {
                  const button = page.getByRole('button', {
                    name:
                      locale === 'es'
                        ? label
                        : {
                            Tarjetas: 'Cards',
                            'Participación %': 'Allocation %',
                            Tabla: 'Table',
                          }[label],
                    exact: true,
                  });
                  await expect(button).toBeVisible();
                  await button.click();
                  await checkMatrix(page, `posiciones-${label}`, info, false);
                }
              }
              if (i === 4) {
                await page
                  .getByRole('button', { name: /Ver resumen|View summary/ })
                  .click();
                await checkMatrix(page, 'reporte-detalle', info);
              }
            }
          }
          await page.setViewportSize({ width: 390, height: 740 });
          await page.screenshot({
            path: info.outputPath(`${en}.png`),
            fullPage: true,
          });
        }
        expect(errors).toEqual([]);
      });

      test('comisionistas, portal profesional y perfil', async ({
        page,
      }, info) => {
        await page.goto('/dashboard');
        await expect(
          page.getByRole('heading', { name: /Hola|Hello/ }),
        ).toBeVisible();
        await navigateWorkspace(
          page,
          locale === 'es' ? 'Comisionistas' : 'Brokers',
        );
        await expect(page.getByRole('tablist')).toBeVisible();
        for (let i = 0; i < 4; i++) {
          await page.getByRole('tab').nth(i).click();
          await checkMatrix(page, `inversionista-comisionistas-${i}`, info);
          if (i === 2) {
            await page
              .getByRole('list', { name: /Lista de propuestas|Proposals list/ })
              .getByRole('button')
              .first()
              .click();
            await expect(
              page.getByText(
                'Revisemos esta propuesta y su impacto en tu portafolio antes de continuar.',
              ),
            ).toBeVisible();
            await checkMatrix(page, 'propuesta-y-chat-inversionista', info);
          }
          if (i === 0) {
            await page
              .getByRole('button', {
                name: /^(Autorizar Operación|Authorize Trading)$/,
              })
              .click();
            await expect(page.locator('dialog[open]')).toBeVisible();
            await checkMatrix(page, 'consentimiento-comisionista', info);
            await page
              .getByRole('button', { name: /^(Cancelar|Cancel)$/ })
              .click();
          }
          if (i === 1) {
            await page
              .getByRole('button', {
                name: /Perfil y reseñas|Profile and reviews/,
              })
              .first()
              .click();
            await expect(page.getByRole('dialog')).toBeVisible();
            await checkMatrix(page, 'perfil-publico-modal', info);
            await page
              .getByRole('dialog')
              .getByRole('button', { name: /Cerrar|Close/ })
              .first()
              .click();
          }
        }
        await page
          .getByRole('button', {
            name: /Portal Comisionista|Broker Portal/,
            exact: true,
          })
          .click();
        for (let i = 0; i < 5; i++) {
          await page.getByRole('tab').nth(i).click();
          await checkMatrix(page, `portal-comisionista-${i}`, info);
          if (i === 0) {
            await page
              .locator('#broker-client-inspect')
              .selectOption('00000000-0000-4000-8000-000000000001');
            await expect(page.locator('main')).toContainText('AAPL');
            await checkMatrix(page, 'cartera-y-ordenes-del-cliente', info);
          }
        }
        await navigateWorkspace(
          page,
          locale === 'es' ? 'Mi Perfil & KYC' : 'My Profile & KYC',
        );
        await expect(page.getByRole('dialog')).toBeVisible();
        const dialog = page.getByRole('dialog');
        await expect(page.locator('#dashboard-navigation')).not.toBeVisible();
        for (const label of [
          locale === 'es' ? 'Datos & Seguridad' : 'Profile & Security',
          locale === 'es'
            ? 'Editar Intereses & Nivel'
            : 'Edit Interests & Level',
          locale === 'es' ? 'Trámite KYC' : 'KYC Verification',
        ]) {
          await dialog
            .getByRole('button', {
              name: new RegExp(label.replaceAll('&', '\\&')),
            })
            .click();
          await checkMatrix(page, `perfil-${label}`, info);
        }
        await page.setViewportSize({ width: 320, height: 480 });
        await checkLayout(page, 'perfil-pantalla-baja', info);
        await page.screenshot({
          path: info.outputPath('perfil.png'),
          fullPage: true,
        });
        await dialog
          .getByRole('button', { name: /^(Cerrar ventana|Close dialog)$/ })
          .click();
        await expect(
          page.getByRole('button', {
            name: /Abrir menú de navegación|Open navigation menu/,
          }),
        ).toBeFocused();
      });

      test('perfil móvil cierra el menú y devuelve el foco', async ({
        page,
      }, info) => {
        await page.goto('/dashboard');
        await expect(
          page.getByRole('heading', { name: /Hola|Hello/ }),
        ).toBeVisible();
        for (const width of [320, 390, 768, 844]) {
          await page.setViewportSize({
            width,
            height: width === 844 ? 390 : 740,
          });
          await navigateWorkspace(
            page,
            locale === 'es' ? 'Mi Perfil & KYC' : 'My Profile & KYC',
          );
          const dialog = page.locator('dialog[open]');
          await expect(dialog).toBeVisible();
          await expect(page.locator('#dashboard-navigation')).not.toBeVisible();
          await checkLayout(page, `perfil-menu-${width}`, info);
          await dialog
            .getByRole('button', { name: /^(Cerrar ventana|Close dialog)$/ })
            .click();
          await expect(
            page.getByRole('button', {
              name: /Abrir menú de navegación|Open navigation menu/,
            }),
          ).toBeFocused();
        }
      });

      test('administración completa', async ({ page }, info) => {
        await page.goto('/admin');
        const nav = page.getByRole('complementary');
        await expect(nav.getByRole('button')).toHaveCount(12);
        for (let i = 0; i < 12; i++) {
          await page.setViewportSize({ width: 1440, height: 1000 });
          await nav.getByRole('button').nth(i).click();
          await expect(nav.getByRole('button').nth(i)).toHaveAttribute(
            'aria-current',
            'page',
          );
          await checkMatrix(page, `administracion-${i}`, info);
          if (i === 9) {
            await page
              .getByLabel(
                locale === 'es'
                  ? 'ID de usuario (opcional para consultar)'
                  : 'User ID (optional for queries)',
              )
              .fill('00000000-0000-4000-8000-000000000001');
            await page
              .getByRole('button', { name: /^(Aplicar usuario|Apply user)$/ })
              .click();
            await expect(
              page.getByRole('region', {
                name: /Reportes del usuario|User reports/,
              }),
            ).toBeVisible();
            await checkMatrix(page, 'cumplimiento-reportes-usuario', info);
            await page
              .getByRole('button', {
                name: /^(Levantar restricción|Lift restriction)$/,
              })
              .click();
            await checkMatrix(page, 'cumplimiento-revision-restriccion', info);
          }
          if (i === 10) {
            await page
              .getByLabel(locale === 'es' ? 'ID de la orden' : 'Order ID', {
                exact: true,
              })
              .fill('00000000-0000-4000-8000-000000000001');
            await page
              .getByRole('button', {
                name: /^(Consultar trazabilidad|View custody)$/,
              })
              .click();
            await expect(
              page.getByRole('heading', {
                name: /AAPL · (Trazabilidad de la orden|Order custody)/,
              }),
            ).toBeVisible();
            await checkMatrix(page, 'custodia-trazabilidad-detalle', info);
          }
          await page.setViewportSize({ width: 390, height: 740 });
          await page.screenshot({
            path: info.outputPath(`admin-${i}.png`),
            fullPage: true,
          });
          if (i === 7) {
            await page
              .getByLabel(
                locale === 'es'
                  ? 'Comisión total (%) · 0 a 10'
                  : 'Total commission (%) · 0 to 10',
                { exact: true },
              )
              .fill('2.5');
            await page
              .getByLabel(
                locale === 'es'
                  ? 'Parte de plataforma (%) · 0 a 100'
                  : 'Platform share (%) · 0 to 100',
                { exact: true },
              )
              .fill('60');
            await page
              .getByLabel(
                locale === 'es'
                  ? 'Motivo de la operación'
                  : 'Reason for this operation',
                { exact: true },
              )
              .fill('Revisión de tarifas');
            await page
              .getByLabel(
                locale === 'es'
                  ? 'Código de autenticación (6 dígitos)'
                  : 'Authentication code (6 digits)',
                { exact: true },
              )
              .fill('123456');
            await page
              .getByRole('button', {
                name: /^(Revisar operación|Review operation)$/,
              })
              .click();
            await expect(page.locator('dialog[open]')).toBeVisible();
            await checkMatrix(page, 'confirmacion-operacion-admin', info);
            await expect(
              page.getByRole('button', {
                name: /^(Confirmar operación|Confirm operation)$/,
              }),
            ).toBeDisabled();
            await page.keyboard.press('Escape');
          }
        }
      });
    });
  }
}
