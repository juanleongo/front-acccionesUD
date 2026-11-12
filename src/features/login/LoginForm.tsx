'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { z } from 'zod';
import { browserHttp } from '@/lib/api/client';
import { ApiError } from '@/lib/api';
import styles from './login.module.css';

import { startLogin, type Challenge } from './challenge';
import { usePendingCodes } from './RecoveryCodes';
const verifiedSchema = z.object({
  user: z.object({
    user_id: z.uuid(),
    email: z.string(),
    account_status: z.string(),
  }),
  recovery_codes: z.array(z.string()).nullable(),
  recovery_codes_remaining: z.number().nullable(),
});

export function LoginForm({
  initialChallenge = null,
  registrationStatus,
}: { initialChallenge?: Challenge | null; registrationStatus?: string } = {}) {
  const router = useRouter();
  const { setCodes: showDashboardCodes } = usePendingCodes();
  const [challenge, setChallenge] = useState(initialChallenge);
  const [recovery, setRecovery] = useState(false);
  const [codes, setCodes] = useState<string[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!challenge || busy) return;
    const timer = window.setTimeout(
      () => {
        setChallenge(null);
        setRecovery(false);
        setError(
          'La verificación venció. Ingresa de nuevo con tu correo y contraseña.',
        );
      },
      Math.max(0, Date.parse(challenge.mfa_expires_at) - Date.now()),
    );
    return () => window.clearTimeout(timer);
  }, [challenge, busy]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError('');
    try {
      if (!challenge) {
        const result = await startLogin(
          String(form.get('email')),
          String(form.get('password')),
        );
        setChallenge(result);
      } else {
        const value = String(form.get('verification')).trim();
        const result = await browserHttp.request({
          path: '/api/v1/auth/mfa/verify',
          method: 'POST',
          response: 'json',
          body: {
            mfa_token: challenge.mfa_token,
            ...(recovery
              ? { recovery_code: value.toUpperCase() }
              : { code: value }),
          },
          parse: verifiedSchema.parse,
        });
        setChallenge(null);
        if (registrationStatus) showDashboardCodes(result.recovery_codes);
        setCodes(registrationStatus ? [] : (result.recovery_codes ?? []));
        if (registrationStatus || !result.recovery_codes?.length)
          router.replace('/dashboard');
      }
    } catch (cause) {
      const status = cause instanceof ApiError && cause.metadata.status;
      if (status === 401) {
        setError(
          challenge
            ? 'La verificación falló. Revisa el código o vuelve a iniciar sesión.'
            : 'El correo o la contraseña son incorrectos.',
        );
      } else if (status === 422) {
        setError('Revisa el formato de los datos ingresados.');
      } else {
        setError('No pudimos completar la solicitud. Inténtalo de nuevo.');
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className={styles.page}>
      <Link href="/">← Volver a Acciones UD</Link>
      <section className={styles.panel}>
        <h1>
          {codes
            ? codes.length
              ? 'Guarda tus códigos de recuperación'
              : 'Sesión iniciada'
            : challenge
              ? 'Verificación en dos pasos'
              : 'Iniciar sesión'}
        </h1>
        {error && <p role="alert">{error}</p>}
        {registrationStatus && (
          <p role="status">
            {registrationStatus === 'active'
              ? 'Tu cuenta de inversionista está activa.'
              : 'Tu cuenta de comisionista está pendiente de activación por un administrador.'}
          </p>
        )}
        {codes ? (
          <>
            {codes.length > 0 && (
              <>
                <p>
                  Cada código permite un acceso. Cópialos ahora y guárdalos en
                  un lugar seguro.
                </p>
                <ul>
                  {codes.map((code) => (
                    <li key={code}>
                      <code>{code}</code>
                    </li>
                  ))}
                </ul>
              </>
            )}
            <Link href="/dashboard" replace>
              Continuar al dashboard
            </Link>
          </>
        ) : (
          <form key={challenge ? 'verify' : 'login'} onSubmit={submit}>
            <fieldset disabled={busy}>
              {challenge ? (
                <>
                  {challenge.totp_enrollment && (
                    <p>
                      Agrega una cuenta con clave de configuración en tu
                      aplicación autenticadora e introduce esta clave:{' '}
                      <strong>{challenge.totp_enrollment.secret}</strong>.
                    </p>
                  )}
                  <label>
                    {recovery
                      ? 'Código de recuperación'
                      : 'Código del autenticador'}
                    <input
                      key={String(recovery)}
                      name="verification"
                      autoComplete="one-time-code"
                      inputMode={recovery ? 'text' : 'numeric'}
                      pattern={recovery ? '[a-zA-Z0-9]{10}' : '[0-9]{6}'}
                      maxLength={recovery ? 10 : 6}
                      required
                    />
                  </label>
                </>
              ) : (
                <>
                  <label>
                    Correo electrónico
                    <input
                      type="email"
                      name="email"
                      autoComplete="username"
                      required
                    />
                  </label>
                  <label>
                    Contraseña
                    <input
                      type="password"
                      name="password"
                      autoComplete="current-password"
                      maxLength={128}
                      required
                    />
                  </label>
                </>
              )}
              <button type="submit">
                {busy
                  ? 'Enviando…'
                  : challenge
                    ? 'Verificar'
                    : 'Iniciar sesión'}
              </button>
              {challenge && !challenge.totp_enrollment && (
                <button
                  type="button"
                  onClick={() => {
                    setRecovery(!recovery);
                    setError('');
                  }}
                >
                  {recovery
                    ? 'Usar el autenticador'
                    : 'Usar un código de recuperación'}
                </button>
              )}
              {challenge && (
                <button
                  type="button"
                  onClick={() => {
                    setChallenge(null);
                    setRecovery(false);
                    setError('');
                  }}
                >
                  Volver al inicio de sesión
                </button>
              )}
            </fieldset>
          </form>
        )}
      </section>
    </main>
  );
}
