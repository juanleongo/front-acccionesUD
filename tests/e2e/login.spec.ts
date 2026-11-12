import { expect, test } from '@playwright/test';

for (const firstAccess of [true, false]) {
  test(
    firstAccess
      ? 'configura el autenticador y guarda los códigos'
      : 'ingresa con código de recuperación',
    async ({ page }) => {
      await page.route('**/api/v1/auth/login', async (route) => {
        expect(route.request().postDataJSON()).toEqual({
          email: 'ana@example.com',
          password: 'ExamplePassword',
        });
        await route.fulfill({
          json: {
            mfa_token: 'challenge',
            mfa_expires_at: new Date(Date.now() + 300000).toISOString(),
            totp_enrollment: firstAccess
              ? { secret: 'SETUPKEY', otpauth_uri: 'otpauth://totp/test' }
              : null,
          },
        });
      });
      await page.route('**/api/v1/auth/mfa/verify', async (route) => {
        expect(route.request().postDataJSON()).toEqual({
          mfa_token: 'challenge',
          ...(firstAccess
            ? { code: '012345' }
            : { recovery_code: 'ABC1234567' }),
        });
        await route.fulfill({
          json: {
            user: {
              user_id: '00112233-4455-4677-8899-aabbccddeeff',
              email: 'ana@example.com',
              account_status: 'active',
            },
            recovery_codes: firstAccess ? ['XYZ1234567'] : null,
            recovery_codes_remaining: firstAccess ? null : 9,
          },
        });
      });
      await page.goto('/');
      await page
        .getByRole('link', { name: 'Iniciar sesión' })
        .filter({ visible: true })
        .click();
      await page.getByLabel('Correo electrónico').fill('ana@example.com');
      await page.getByLabel('Contraseña').fill('ExamplePassword');
      await page.getByRole('button', { name: 'Iniciar sesión' }).click();
      if (firstAccess) {
        await expect(page.getByText('SETUPKEY', { exact: true })).toBeVisible();
        await page.getByLabel('Código del autenticador').fill('012345');
      } else {
        await page
          .getByRole('button', { name: 'Usar un código de recuperación' })
          .click();
        await page.getByLabel('Código de recuperación').fill('abc1234567');
      }
      await page
        .getByRole('button', { name: 'Verificar', exact: true })
        .click();
      if (firstAccess) {
        await expect(page.getByText('XYZ1234567')).toBeVisible();
        await page
          .getByRole('link', { name: 'Continuar al dashboard' })
          .click();
      }
      await expect(page).toHaveURL(/\/dashboard$/);
    },
  );
}
