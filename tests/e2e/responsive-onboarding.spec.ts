import { expect, test } from '@playwright/test';
import { checkLayout, checkMatrix } from '../fixtures/responsive-layout';

test.setTimeout(180_000);

for (const locale of ['es', 'en'])
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
        await page.route('**/api/**', (route) => {
          const path = new URL(route.request().url()).pathname;
          if (path === '/api/catalog/locations')
            return route.fulfill({
              json: {
                states: [{ code: 'ANT', name: 'Antioquia' }],
                cities: ['Medellín'],
              },
            });
          if (path.endsWith('/interest-options'))
            return route.fulfill({
              json: { markets: ['NYSE', 'NASDAQ'], sectors: ['Tecnología'] },
            });
          if (path.includes('/auth/register'))
            return route.fulfill({
              status: 201,
              json: {
                user_id: '00000000-0000-4000-8000-000000000001',
                account_status: path.endsWith('/broker')
                  ? 'pending_broker_activation'
                  : 'active',
              },
            });
          if (path === '/api/v1/auth/login')
            return route.fulfill({
              json: {
                mfa_token: 'challenge',
                mfa_expires_at: new Date(Date.now() + 300000).toISOString(),
                totp_enrollment: {
                  secret: 'SETUPKEY',
                  otpauth_uri: 'otpauth://totp/test',
                },
              },
            });
          if (path === '/api/v1/auth/mfa/verify')
            return route.fulfill({
              json: {
                user: {
                  user_id: '00000000-0000-4000-8000-000000000001',
                  email: 'test@example.org',
                  account_status: 'active',
                },
                recovery_codes: Array.from(
                  { length: 10 },
                  (_, i) => `ABC123456${i}`,
                ),
                recovery_codes_remaining: null,
              },
            });
          return route.fulfill({
            status: 503,
            json: { code: 'TEST_ENDPOINT_UNAVAILABLE' },
          });
        });
      });

      for (const broker of [false, true])
        test(`registro ${broker ? 'comisionista' : 'inversionista'}: todos los pasos`, async ({
          page,
        }, info) => {
          await page.goto(broker ? '/registro/broker' : '/registro');
          const next = page.getByRole('button', {
            name: /^(Continuar|Continue)$/,
          });
          for (const [name, value] of Object.entries({
            first_names: 'María Fernanda',
            last_names: 'Vélez Benítez',
            email: 'test@example.org',
            phone: '+573001234567',
            password: 'Prueba123',
          }))
            await page.locator(`[name="${name}"]`).fill(value);
          await page.locator('select[name="country"]').selectOption('CO');
          await next.click();
          await checkMatrix(page, 'registro-preferencias-o-firma', info);
          if (broker) {
            await page
              .locator('[name="firm_name"]')
              .fill('Firma de asesoría y acompañamiento financiero');
            await page.locator('[name="license_number"]').fill('LIC-12345');
            await next.click();
            await checkMatrix(page, 'registro-preferencias-comisionista', info);
          }
          await next.click();
          if (!broker) {
            await checkMatrix(page, 'kyc-identidad', info);
            await page.setViewportSize({ width: 320, height: 740 });
            await page
              .getByRole('button', {
                name: /Selecciona fecha \(\+18 años\)|Select date \(\+18 years\)/,
              })
              .click();
            const birth = page.getByRole('dialog', {
              name: /Calendario selector de nacimiento|Birth calendar picker/,
            });
            await expect(birth).toBeVisible();
            await checkLayout(page, 'calendario-nacimiento', info);
            await page
              .locator('select[name="calendar_year"]')
              .selectOption('1990');
            await birth.getByRole('button', { name: '1', exact: true }).click();
            await page.locator('[name="tax_id"]').fill('2518370496');
            await page
              .locator('[name="street_address"]')
              .fill('Calle 10 número 20 30 apartamento 401');
            await page.locator('[name="postal_code"]').fill('110111');
            await page.locator('select[name="state"]').selectOption('ANT');
            await page.locator('select[name="city"]').selectOption('Medellín');
            await next.click();
            await checkMatrix(page, 'kyc-actividad-financiera', info);
            await page
              .locator('[name="funding_source"][value="employment_income"]')
              .check();
            await next.click();
            await checkMatrix(page, 'kyc-declaraciones-acuerdos', info);
            await page.locator('[name="customer_agreement"]').check();
          }
          await page
            .getByRole('button', {
              name: /^(términos y condiciones|terms and conditions)$/i,
            })
            .click();
          await expect(page.locator('dialog[open]')).toBeVisible();
          await checkMatrix(page, 'terminos-condiciones', info);
          await page
            .getByRole('button', {
              name: /Entendido y cerrar|Got it and close/,
            })
            .click();
          await page.locator('[name="terms_accepted"]').check();
          await page
            .locator('form')
            .filter({ has: page.locator('[name="terms_accepted"]') })
            .locator('button[type="submit"]')
            .click();
          await expect(page.locator('[name="verification"]')).toBeVisible();
          await checkMatrix(page, 'registro-qr', info);
          await page.locator('[name="verification"]').fill('012345');
          await page
            .getByRole('button', { name: /^(Verificar|Verify)$/ })
            .click();
          await expect(
            page.getByText('ABC1234560', { exact: true }),
          ).toBeVisible();
          await checkMatrix(page, 'codigos-recuperacion', info);
          // Codes remain until the explicit continue action; resizing must never dismiss them.
          await expect(
            page.getByText('ABC1234569', { exact: true }),
          ).toBeVisible();
          await page.setViewportSize({ width: 390, height: 740 });
          await page.screenshot({
            path: info.outputPath('recovery-codes.png'),
            fullPage: true,
          });
        });

      test('login de administrador y recuperación de acceso', async ({
        page,
      }, info) => {
        await page.goto('/login');
        await page
          .getByRole('button', {
            name: /Administrador \(SysAdmin\)|Administrator \(SysAdmin\)/,
          })
          .click();
        await expect(
          page.getByRole('heading', {
            name: /^(Portal de Administración|Admin Portal)$/,
          }),
        ).toBeVisible();
        await checkMatrix(page, 'login-administrador', info);
        await page.locator('[name="email"]').fill('test@example.org');
        await page.locator('[name="password"]').fill('Prueba123');
        await page.locator('form button[type="submit"]').click();
        await expect(page.locator('[name="verification"]')).toBeVisible();
        await checkMatrix(page, 'admin-enrolamiento-qr', info);
        await page.locator('[name="verification"]').fill('012345');
        await page
          .getByRole('button', { name: /^(Verificar|Verify)$/ })
          .click();
        await expect(
          page.getByText('ABC1234560', { exact: true }),
        ).toBeVisible();
        await checkMatrix(page, 'admin-codigos-recuperacion', info);
      });

      test('país: búsqueda, selección y tamaño del menú', async ({
        page,
      }, info) => {
        await page.goto('/registro');
        const country = page.locator('select[name="country"]');
        const trigger = country.locator('..').locator(':scope > button');
        for (const width of [320, 390, 768, 844, 1440]) {
          const height = width === 844 ? 390 : 740;
          await page.setViewportSize({ width, height });
          await trigger.click();
          const search = page.getByRole('searchbox', {
            name: /Buscar país o código|Search country or code/,
          });
          await search.fill('CO');
          const option = page.getByRole('option', { name: /^Colombia/ });
          await expect(option).toBeVisible();
          const box = (await page
            .getByRole('listbox')
            .locator('..')
            .boundingBox())!;
          expect(box.x).toBeGreaterThanOrEqual(0);
          expect(box.x + box.width).toBeLessThanOrEqual(width);
          expect(box.y).toBeGreaterThanOrEqual(0);
          expect(box.y + box.height).toBeLessThanOrEqual(height);
          await option.click();
          await expect(country).toHaveValue('CO');
          await expect(trigger).toContainText('Colombia');
          await checkLayout(page, `pais-${width}`, info);
        }
      });

      test('MFA existente, código alternativo y sesión finalizada', async ({
        page,
      }, info) => {
        await page.route('**/api/v1/auth/login', (route) =>
          route.fulfill({
            json: {
              mfa_token: 'challenge',
              mfa_expires_at: new Date(Date.now() + 300000).toISOString(),
              totp_enrollment: null,
            },
          }),
        );
        await page.goto('/login');
        await page.locator('[name="email"]').fill('test@example.org');
        await page.locator('[name="password"]').fill('Prueba123');
        await page.locator('form button[type="submit"]').click();
        await expect(page.locator('[name="verification"]')).toBeVisible();
        await checkMatrix(page, 'mfa-existente', info);
        await page
          .getByRole('button', {
            name: /Usar un código de recuperación|Use a recovery code/,
          })
          .click();
        await checkMatrix(page, 'mfa-codigo-alternativo', info);
        await page.route('**/api/v1/users/me', (route) =>
          route.fulfill({ status: 401, json: { code: 'UNAUTHORIZED' } }),
        );
        await page.goto('/dashboard');
        await expect(page.getByRole('alertdialog')).toBeVisible();
        await checkMatrix(page, 'sesion-finalizada', info);
        await page.setViewportSize({ width: 320, height: 480 });
        await checkLayout(page, 'sesion-finalizada-pantalla-baja', info);
      });
    });
  }
