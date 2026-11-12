'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { z } from 'zod';
import { Icon } from '@/components/ui/Icon';
import { browserHttp } from '@/lib/api/client';
import { ApiError } from '@/lib/api';
import styles from './login.module.css';

import { startLogin, type Challenge } from './challenge';
import { RecoveryCodesDisplay, usePendingCodes } from './RecoveryCodes';

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
  const [isAdminLogin, setIsAdminLogin] = useState(false);
  const [emailValue, setEmailValue] = useState('');
  const [passwordValue, setPasswordValue] = useState('');
  const [challenge, setChallenge] = useState(initialChallenge);
  const [recovery, setRecovery] = useState(false);
  const [codes, setCodes] = useState<string[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  function toggleTheme() {
    const next =
      document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem('acciones_ud_theme', next);
    } catch {
      /* Preferencia opcional. */
    }
  }

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
        const targetPath =
          isAdminLogin ||
          result.user.email === 'admin@accionesud.com' ||
          result.user.email === 'admin@example.com'
            ? '/admin'
            : '/dashboard';
        if (registrationStatus || !result.recovery_codes?.length)
          router.replace(targetPath);
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
    <div className={styles.wrapper}>
      <header className={styles.topBar}>
        <div className={styles.topBarInner}>
          <Link
            href="/"
            className={styles.brand}
            aria-label="Acciones UD, inicio"
          >
            <Image
              src="/logo-acciones-ud.png"
              alt="Logo Acciones UD"
              width={40}
              height={40}
              className={styles.brandLogo}
              priority
            />
            <div className={styles.brandText}>
              <strong>Acciones UD</strong>
              <span>Mercados de EE. UU. · NYSE &amp; NASDAQ</span>
            </div>
          </Link>
          <div className={styles.topActions}>
            <button
              type="button"
              className={styles.themeButton}
              onClick={toggleTheme}
              aria-label="Cambiar tema de color"
            >
              <span className={styles.whenDark}>
                <Icon name="sun" size={16} /> Claro
              </span>
              <span className={styles.whenLight}>
                <Icon name="moon" size={16} /> Oscuro
              </span>
            </button>
            <Link href="/" className={styles.back}>
              ← Volver a Acciones UD
            </Link>
          </div>
        </div>
      </header>

      <main className={styles.page}>
        <section className={styles.panel}>
          {!challenge && !codes && (
            <div className={styles.roleTabs}>
              <button
                type="button"
                className={`${styles.roleTab} ${!isAdminLogin ? styles.roleTabActive : ''}`}
                onClick={() => {
                  setIsAdminLogin(false);
                  setError('');
                }}
              >
                <Icon name="user" size={15} /> Inversor / Comisionista
              </button>
              <button
                type="button"
                className={`${styles.roleTab} ${isAdminLogin ? styles.roleTabAdminActive : ''}`}
                onClick={() => {
                  setIsAdminLogin(true);
                  setError('');
                }}
              >
                <Icon name="shield" size={15} /> Administrador (SysAdmin)
              </button>
            </div>
          )}

          {isAdminLogin ? (
            <p className={styles.badgeAdmin}>
              <Icon name="shield" size={14} /> Acceso Administrador · Control
              RBAC &amp; Mercados
            </p>
          ) : (
            <p className={styles.badge}>
              <span className={styles.dot} /> Acceso Seguro 2FA · Wall Street
            </p>
          )}

          <h1>
            {codes
              ? codes.length
                ? 'Guarda tus códigos de recuperación'
                : 'Sesión iniciada'
              : challenge
                ? 'Verificación en dos pasos'
                : isAdminLogin
                  ? 'Portal de Administración'
                  : 'Iniciar sesión'}
          </h1>

          {isAdminLogin && !challenge && !codes && (
            <div className={styles.adminCallout}>
              <strong>
                🛡️ Acceso Restringido para Administradores (RFP-02)
              </strong>
              Permite auditar y activar comisionistas AMV, gestionar políticas
              RBAC de seguridad y supervisar los calendarios y horarios de Wall
              Street.
            </div>
          )}

          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}
          {registrationStatus && (
            <p className={styles.statusBanner} role="status">
              {registrationStatus === 'active'
                ? 'Tu cuenta de inversionista está activa.'
                : 'Tu cuenta de comisionista está pendiente de activación por un administrador.'}
            </p>
          )}
          {codes ? (
            <RecoveryCodesDisplay
              codes={codes}
              onDismiss={() =>
                router.replace(
                  isAdminLogin || emailValue === 'admin@example.com'
                    ? '/admin'
                    : '/dashboard',
                )
              }
              dismissText={
                isAdminLogin || emailValue === 'admin@example.com'
                  ? 'Continuar al panel de administración'
                  : 'Continuar al dashboard'
              }
            />
          ) : (
            <form key={challenge ? 'verify' : 'login'} onSubmit={submit}>
              <fieldset disabled={busy}>
                {challenge ? (
                  <>
                    {challenge.totp_enrollment && (
                      <div className={styles.enrollmentBox}>
                        <p>
                          Agrega una cuenta con clave de configuración en tu
                          aplicación autenticadora (Google Authenticator o
                          Authy) e introduce esta clave:
                        </p>
                        <strong className={styles.secretCode}>
                          {challenge.totp_enrollment.secret}
                        </strong>
                      </div>
                    )}
                    <label>
                      {recovery
                        ? 'Código de recuperación'
                        : 'Código del autenticador'}
                      <input
                        key={String(recovery)}
                        name="verification"
                        placeholder={recovery ? 'Ej. ABC1234567' : '000000'}
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
                        value={emailValue}
                        onChange={(e) => setEmailValue(e.target.value)}
                        placeholder="correo@ejemplo.com"
                        autoComplete="username"
                        required
                      />
                    </label>
                    <label>
                      Contraseña
                      <div className={styles.passwordWrapper}>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          value={passwordValue}
                          onChange={(e) => setPasswordValue(e.target.value)}
                          placeholder="Tu contraseña"
                          autoComplete="current-password"
                          maxLength={128}
                          required
                        />
                        <button
                          type="button"
                          className={styles.passwordToggle}
                          onClick={() => setShowPassword((prev) => !prev)}
                          aria-label={
                            showPassword
                              ? 'Ocultar contraseña'
                              : 'Mostrar contraseña'
                          }
                          title={
                            showPassword
                              ? 'Ocultar contraseña'
                              : 'Mostrar contraseña'
                          }
                        >
                          <Icon
                            name={showPassword ? 'eyeOff' : 'eye'}
                            size={18}
                          />
                        </button>
                      </div>
                    </label>
                  </>
                )}
                <button type="submit">
                  {busy
                    ? 'Enviando…'
                    : challenge
                      ? 'Verificar'
                      : isAdminLogin
                        ? 'Ingresar al Portal Administrativo'
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
              {!challenge && (
                <p className={styles.registerPrompt}>
                  {isAdminLogin ? (
                    <>
                      ¿Eres inversionista o comisionista?{' '}
                      <button
                        type="button"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--color-primary)',
                          fontWeight: 700,
                          cursor: 'pointer',
                          padding: 0,
                          textDecoration: 'underline',
                          font: 'inherit',
                        }}
                        onClick={() => {
                          setIsAdminLogin(false);
                          setError('');
                        }}
                      >
                        Cambiar a modo Inversor / Comisionista
                      </button>
                    </>
                  ) : (
                    <>
                      ¿Aún no tienes cuenta?{' '}
                      <Link href="/registro">Abrir cuenta de práctica</Link>
                    </>
                  )}
                </p>
              )}
            </form>
          )}
        </section>
      </main>
    </div>
  );
}
