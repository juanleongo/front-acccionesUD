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
      let verified = false;
      let submissions = 0;
      await page.route('**/api/v1/users/me', (route) =>
        route.fulfill({
          json: { user_id: 'd24ad783-9929-4706-9055-70937decb770' },
        }),
      );
      await page.route('**/api/v1/kyc/status', (route) =>
        route.fulfill({ json: { has_account: false } }),
      );
      await page.route('**/api/v1/kyc/account', (route) => {
        expect(verified).toBe(true);
        expect(route.request().postDataJSON()).toMatchObject({
          identity: {
            given_name: expected.first_names,
            family_name: expected.last_names,
            country_of_citizenship: 'COL',
            country_of_tax_residence: 'COL',
            tax_id: '2518370496',
            funding_source: ['employment_income', 'savings'],
          },
          contact: {
            email_address: expected.email,
            phone_number: expected.phone,
            country: 'COL',
            state: 'Antioquia',
            city: 'Medellín',
          },
          agreements: {
            customer_agreement: true,
            account_agreement: false,
            margin_agreement: false,
          },
        });
        submissions++;
        return submissions === 1
          ? route.fulfill({ status: 422, json: { code: 'ALPACA_REJECTED' } })
          : route.fulfill({
              status: 201,
              json: { alpaca_account_id: 'test', status: 'SUBMITTED' },
            });
      });
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
        verified = true;
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
      await page.locator('select[name="country"]').selectOption('CO');
      const next = page.getByRole('button', { name: 'Continuar', exact: true });
      await next.click();
      await page.getByRole('button', { name: 'Atrás' }).click();
      await expect(page.locator('[name="email"]')).toHaveValue(expected.email);
      await next.click();
      if (broker) {
        await page.getByLabel('Nombre de la firma').fill('Firma Uno');
        await page.getByLabel('Número de licencia profesional').fill('LIC-24');
        await next.click();
        await page
          .getByLabel('Nivel de experiencia')
          .selectOption('experienced');
        await page
          .getByLabel('Intereses (opcional)')
          .fill('Mercados\nTecnología');
        await page.getByLabel('Recibir el informe mensual').check();
        await page.getByLabel('Solicitar el plan prémium').check();
      }
      await next.click();
      if (!broker) {
        await page
          .getByLabel('Tipo de identificación fiscal')
          .selectOption('COL_NIT');
        for (const [key, value] of Object.entries({
          date_of_birth: '1990-01-01',
          tax_id: '2518370496',
          street_address: 'Calle 10',
          postal_code: '110111',
        }))
          await page.locator('[name="' + key + '"]').fill(value);
        const region = page.getByRole('combobox', {
          name: 'Departamento, estado o provincia',
        });
        const city = page.getByRole('combobox', {
          name: 'Ciudad',
          exact: true,
        });
        await region.selectOption('ANT');
        await city.selectOption('Medellín');
        await next.click();
        for (const [key, value] of Object.entries({
          employment_status: 'employed',
          annual_income_range: 'RANGE_1',
          total_net_worth_range: 'RANGE_2',
          liquid_net_worth_range: 'RANGE_1',
        }))
          await page.locator('[name="' + key + '"]').selectOption(value);
        await page.getByRole('checkbox', { name: 'Salario' }).check();
        await page.getByRole('checkbox', { name: 'Ahorros' }).check();
        await next.click();
        for (const key of [
          'is_control_person',
          'is_affiliated_exchange_or_finra',
          'is_politically_exposed',
          'immediate_family_exposed',
        ])
          await page.locator('[name="' + key + '"]').selectOption('no');
        await page.getByLabel('Acepto el acuerdo de cliente').check();
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
      if (!broker) {
        await expect(
          page.getByText(/La solicitud KYC fue rechazada/),
        ).toBeVisible();
        await expect(page.locator('[name="tax_id"]')).toHaveValue('2518370496');
        await next.click();
        await next.click();
        await page
          .getByRole('button', { name: 'Reenviar solicitud KYC' })
          .click();
      }
      await expect(page).toHaveURL(/\/dashboard$/);
      expect(submissions).toBe(broker ? 0 : 2);
      expect(attempts).toBe(2);
      await expect(page.getByText('XYZ1234567')).toBeVisible();
      await page.getByRole('button', { name: 'Ya guardé los códigos' }).click();
      await expect(page.getByText('XYZ1234567')).toHaveCount(0);
    },
  );
}
