// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { LoginForm } from './LoginForm';
import { RecoveryCodesProvider } from './RecoveryCodes';

const replace = vi.hoisted(() => vi.fn());
const requestMock = vi.hoisted(() => vi.fn());
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace }) }));
vi.mock('@/lib/api/client', () => ({ browserHttp: { request: requestMock } }));
afterEach(() => {
  sessionStorage.clear();
  vi.useRealTimers();
  replace.mockClear();
});

it('mantiene los códigos tras verificar y espera Continuar antes de finalizar el registro', async () => {
  const finish = vi.fn().mockResolvedValue(undefined);
  requestMock.mockResolvedValue({
    user: {
      user_id: '00112233-4455-4677-8899-aabbccddeeff',
      email: 'ana@example.org',
      account_status: 'active',
    },
    recovery_codes: ['ABC1234567', 'DEF1234567'],
    recovery_codes_remaining: 2,
  });
  render(
    <RecoveryCodesProvider>
      <LoginForm
        registrationStatus="active"
        onRegisteredUserVerified={finish}
        initialChallenge={{
          mfa_token: 'challenge',
          mfa_expires_at: new Date(Date.now() + 60_000).toISOString(),
          totp_enrollment: null,
        }}
      />
    </RecoveryCodesProvider>,
  );
  fireEvent.change(screen.getByLabelText('Código del autenticador'), {
    target: { value: '123456' },
  });
  fireEvent.submit(
    screen.getByLabelText('Código del autenticador').closest('form')!,
  );
  expect(await screen.findByText('ABC1234567')).toBeVisible();
  vi.useFakeTimers();
  vi.advanceTimersByTime(120_000);
  expect(screen.getByText('ABC1234567')).toBeVisible();
  expect(finish).not.toHaveBeenCalled();
  expect(replace).not.toHaveBeenCalled();
  vi.useRealTimers();
  fireEvent.click(screen.getByRole('button', { name: 'Continuar al panel' }));
  expect(finish).toHaveBeenCalledOnce();
});

it('valida correo incompleto con el aviso estilizado y no con tooltip del navegador', async () => {
  render(
    <RecoveryCodesProvider>
      <LoginForm />
    </RecoveryCodesProvider>,
  );
  const emailInput = screen.getByLabelText('Correo electrónico');
  expect(emailInput.closest('form')).toHaveAttribute('novalidate');
  fireEvent.change(emailInput, { target: { value: 'sasad1@' } });
  fireEvent.change(screen.getByLabelText('Contraseña'), {
    target: { value: 'Secret123' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }));
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Ingresa un correo electrónico válido (ej. nombre@correo.com).',
  );
  expect(emailInput).toHaveAttribute('aria-invalid', 'true');
  expect(requestMock).not.toHaveBeenCalled();
});
