import { expect, test } from '@playwright/test';

for (const broker of [false, true]) {
  test(
    'registro de ' + (broker ? 'comisionista' : 'inversionista'),
    async ({ page }) => {
      const suffix = broker ? '/broker' : '';
      const path = '/api/v1/auth/register' + suffix;
      const status = broker ? 'pending_broker_activation' : 'active';
      const expected = {
        first_names: 'María Elena',
        last_names: 'Ruiz',
        email: 'maria@example.org',
        phone: '+573001234567',
        country: 'CO',
        password: 'Prueba123',
        terms_accepted: true,
        monthly_report: broker,
        interests: broker ? ['Mercados', 'Tecnología'] : [],
        investor_level: broker ? 'experienced' : null,
        broker_requested: false,
        premium_requested: broker,
        ...(broker ? { firm_name: 'Firma Uno', license_number: 'LIC-24' } : {}),
      };
      let attempts = 0;
      await page.route('**/api/v1/auth/login', async (route) => {
        expect(attempts).toBe(2);
        expect(route.request().postDataJSON()).toEqual({
          email: expected.email,
          password: expected.password,
        });
        await route.fulfill({
          json: {
            mfa_token: 'challenge',
            mfa_expires_at: new Date(Date.now() + 300000).toISOString(),
            totp_enrollment: {
              secret: 'SETUPKEY',
              otpauth_uri: 'otpauth://totp/test',
            },
          },
        });
      });
      await page.route('**/api/v1/auth/mfa/verify', async (route) => {
        const body = route.request().postDataJSON();
        if (body.code === '000000')
          return route.fulfill({ status: 401, json: { code: 'MFA_FAILED' } });
        expect(body).toEqual({ mfa_token: 'challenge', code: '012345' });
        await route.fulfill({
          json: {
            user: {
              user_id: 'd24ad783-9929-4706-9055-70937decb770',
              email: expected.email,
              account_status: status,
            },
            recovery_codes: ['XYZ1234567'],
            recovery_codes_remaining: null,
          },
        });
      });
      await page.route('**' + path, async (route) => {
        expect(route.request().method()).toBe('POST');
        expect(route.request().postDataJSON()).toEqual(expected);
        attempts++;
        await route.fulfill(
          attempts === 1
            ? { status: 409, json: { code: 'EMAIL_ALREADY_REGISTERED' } }
            : {
                status: 201,
                json: {
                  user_id: 'd24ad783-9929-4706-9055-70937decb770',
                  account_status: status,
                },
              },
        );
      });
      await page.goto('/registro');
      if (broker)
        await page
          .getByRole('link', { name: 'Comisionista', exact: true })
          .click();
      await expect(page).toHaveURL(new RegExp('/registro' + suffix + '$'));
      for (const key of [
        'first_names',
        'last_names',
        'email',
        'phone',
        'password',
      ] as const) {
        await page.locator('[name="' + key + '"]').fill(expected[key]);
      }
      await page.getByLabel('País').selectOption('CO');
      if (broker) {
        await page.getByLabel('Nombre de la firma').fill('Firma Uno');
        await page.getByLabel('Número de licencia profesional').fill('LIC-24');
        await page
          .getByLabel('Nivel de experiencia')
          .selectOption('experienced');
        await page
          .getByLabel('Intereses (opcional)')
          .fill('Mercados\nTecnología');
        await page.getByLabel('Recibir el informe mensual').check();
        await page.getByLabel('Solicitar el plan prémium').check();
      }
      const submit = page.getByRole('button', {
        name: broker
          ? 'Solicitar registro de comisionista'
          : 'Crear cuenta de inversionista',
      });
      await submit.click();
      expect(attempts).toBe(0);
      await page.getByLabel('Acepto los términos').check();
      await submit.click();
      await expect(page.getByRole('main').getByRole('alert')).toContainText(
        'Ya existe una cuenta',
      );
      await submit.click();
      await expect(page.getByRole('status')).toContainText(
        broker ? 'pendiente de activación' : 'está activa',
      );
      expect(attempts).toBe(2);
      const code = page.getByLabel('Código del autenticador');
      await code.fill('000000');
      await page
        .getByRole('button', { name: 'Verificar', exact: true })
        .click();
      await expect(page.getByRole('main').getByRole('alert')).toContainText(
        'La verificación falló',
      );
      await code.fill('012345');
      await page
        .getByRole('button', { name: 'Verificar', exact: true })
        .click();
      await expect(page).toHaveURL(/\/dashboard$/);
      await expect(page.getByText('XYZ1234567')).toBeVisible();
      await page.getByRole('button', { name: 'Ya guardé los códigos' }).click();
      await expect(page.getByText('XYZ1234567')).toHaveCount(0);
    },
  );
}
