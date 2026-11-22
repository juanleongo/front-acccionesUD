'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  useEffect,
  useState,
  useSyncExternalStore,
  type FormEvent,
} from 'react';
import { z } from 'zod';
import { Icon } from '@/components/ui/Icon';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import { browserHttp } from '@/lib/api/client';
import { ApiError } from '@/lib/api';
import { useLocale } from '@/lib/i18n';
import {
  getDocumentTheme,
  subscribeThemeStorage,
  toggleDocumentTheme,
  type Theme,
} from '@/lib/theme';
import styles from './login.module.css';

function subscribeDocumentTheme(onThemeChange: () => void): () => void {
  const stopStorage = subscribeThemeStorage(() => onThemeChange());
  if (
    typeof document === 'undefined' ||
    typeof MutationObserver === 'undefined'
  ) {
    return stopStorage;
  }
  const observer = new MutationObserver(onThemeChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  });
  return () => {
    observer.disconnect();
    stopStorage();
  };
}

function getServerThemeSnapshot(): Theme {
  return 'dark';
}

import { startLogin, type Challenge } from './challenge';
import { RecoveryCodesDisplay, usePendingCodes } from './RecoveryCodes';
import { TotpQrCode } from './TotpQrCode';

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
  onRegisteredUserVerified,
  registeredUserId,
}: {
  initialChallenge?: Challenge | null;
  registrationStatus?: string;
  registeredUserId?: string;
  onRegisteredUserVerified?: () => Promise<void>;
} = {}) {
  const router = useRouter();
  const { tx } = useLocale();
  const activeTheme = useSyncExternalStore(
    subscribeDocumentTheme,
    getDocumentTheme,
    getServerThemeSnapshot,
  );
  const { codes: pendingCodes, setCodes: showDashboardCodes } =
    usePendingCodes();
  const [isAdminLogin, setIsAdminLogin] = useState(false);
  const [emailValue, setEmailValue] = useState('');
  const [passwordValue, setPasswordValue] = useState('');
  const [challenge, setChallenge] = useState(initialChallenge);
  const [recovery, setRecovery] = useState(false);
  const [verifiedCodes, setCodes] = useState<string[] | null>(null);
  const codes = verifiedCodes ?? pendingCodes;
  const [destination, setDestination] = useState('/dashboard');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [fieldError, setFieldError] = useState<
    'email' | 'password' | 'verification' | null
  >(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!challenge || busy) return;
    const timer = window.setTimeout(
      () => {
        setChallenge(null);
        setRecovery(false);
        setError(
          tx(
            'La verificación venció. Ingresa de nuevo con tu correo y contraseña.',
            'Verification expired. Sign in again with your email and password.',
          ),
        );
      },
      Math.max(0, Date.parse(challenge.mfa_expires_at) - Date.now()),
    );
    return () => window.clearTimeout(timer);
  }, [challenge, busy, tx]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = new FormData(event.currentTarget);
    setError('');
    setFieldError(null);
    if (!challenge) {
      const email = String(form.get('email') ?? '').trim();
      const password = String(form.get('password') ?? '');
      if (!email) {
        setFieldError('email');
        setError(
          tx('Ingresa tu correo electrónico.', 'Enter your email address.'),
        );
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setFieldError('email');
        setError(
          tx(
            'Ingresa un correo electrónico válido (ej. nombre@correo.com).',
            'Enter a valid email address (e.g. name@domain.com).',
          ),
        );
        return;
      }
      if (!password) {
        setFieldError('password');
        setError(tx('Ingresa tu contraseña.', 'Enter your password.'));
        return;
      }
    } else {
      const verification = String(form.get('verification') ?? '').trim();
      if (recovery && !/^[a-zA-Z0-9]{10}$/.test(verification)) {
        setFieldError('verification');
        setError(
          tx(
            'Ingresa un código de recuperación válido de 10 caracteres alfanuméricos.',
            'Enter a valid 10-character alphanumeric recovery code.',
          ),
        );
        return;
      }
      if (!recovery && !/^[0-9]{6}$/.test(verification)) {
        setFieldError('verification');
        setError(
          tx(
            'Ingresa el código numérico de 6 dígitos de tu autenticador.',
            'Enter the 6-digit code from your authenticator app.',
          ),
        );
        return;
      }
    }
    setBusy(true);
    try {
      if (!challenge) {
        const result = await startLogin(
          String(form.get('email')).trim(),
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
        if (registeredUserId && result.user.user_id !== registeredUserId) {
          setError(
            tx(
              'Inicia sesión con la cuenta que acabas de registrar para continuar.',
              'Sign in with the account you just registered to continue.',
            ),
          );
          return;
        }
        const targetPath =
          isAdminLogin ||
          result.user.email === 'admin@accionesud.com' ||
          result.user.email === 'admin@example.com'
            ? '/admin'
            : '/dashboard';
        setDestination(targetPath);
        if (result.recovery_codes?.length) {
          setCodes(result.recovery_codes);
          showDashboardCodes(result.recovery_codes);
        } else if (onRegisteredUserVerified) {
          await onRegisteredUserVerified();
        } else {
          router.replace(targetPath);
        }
      }
    } catch (cause) {
      const status = cause instanceof ApiError && cause.metadata.status;
      if (status === 401) {
        setError(
          challenge
            ? tx(
                'La verificación falló. Revisa el código o vuelve a iniciar sesión.',
                'Verification failed. Check your code or sign in again.',
              )
            : tx(
                'El correo o la contraseña son incorrectos.',
                'Invalid email or password.',
              ),
        );
      } else if (status === 422) {
        setError(
          tx(
            'Revisa el formato de los datos ingresados.',
            'Please check the format of your entered details.',
          ),
        );
      } else {
        setError(
          tx(
            'No pudimos completar la solicitud. Inténtalo de nuevo.',
            'We could not complete your request. Please try again.',
          ),
        );
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
            aria-label={tx('Acciones UD, inicio', 'Acciones UD, home')}
          >
            <Image
              src="/logo-acciones-ud.png"
              alt={tx('Logo Acciones UD', 'Acciones UD Logo')}
              width={40}
              height={40}
              className={styles.brandLogo}
              priority
            />
            <div className={styles.brandText}>
              <strong>Acciones UD</strong>
              <span>
                {tx(
                  'Mercados de EE. UU. · NYSE & NASDAQ',
                  'U.S. Markets · NYSE & NASDAQ',
                )}
              </span>
            </div>
          </Link>
          <div className={styles.topActions}>
            <LanguageToggle className={styles.themeButton} size={16} />
            <button
              type="button"
              className={styles.themeButton}
              onClick={() => {
                toggleDocumentTheme();
              }}
              aria-label={tx('Cambiar tema de color', 'Toggle color theme')}
            >
              {activeTheme === 'light' ? (
                <>
                  <Icon name="moon" size={16} /> {tx('Oscuro', 'Dark')}
                </>
              ) : (
                <>
                  <Icon name="sun" size={16} /> {tx('Claro', 'Light')}
                </>
              )}
            </button>
            <Link href="/" className={styles.back}>
              {tx('← Volver a Acciones UD', '← Back to Acciones UD')}
            </Link>
          </div>
        </div>
      </header>

      <main
        className={`${styles.page} ${challenge || codes ? styles.securityPage : ''}`}
      >
        <section
          className={`${styles.panel} ${isAdminLogin && !challenge && !codes ? styles.panelAdmin : ''}`}
        >
          {!challenge && !codes && (
            <div className={styles.roleTabs}>
              <button
                type="button"
                className={`${styles.roleTab} ${!isAdminLogin ? styles.roleTabActive : ''}`}
                onClick={() => {
                  setIsAdminLogin(false);
                  setError('');
                  setFieldError(null);
                }}
              >
                <Icon name="user" size={15} />{' '}
                {tx('Inversor / Comisionista', 'Investor / Broker')}
              </button>
              <button
                type="button"
                className={`${styles.roleTab} ${isAdminLogin ? styles.roleTabAdminActive : ''}`}
                onClick={() => {
                  setIsAdminLogin(true);
                  setError('');
                  setFieldError(null);
                }}
              >
                <Icon name="shield" size={15} />{' '}
                {tx('Administrador (SysAdmin)', 'Administrator (SysAdmin)')}
              </button>
            </div>
          )}

          {isAdminLogin && !challenge && !codes && (
            <p className={styles.badgeAdmin}>
              <Icon name="shield" size={14} />
              {tx('Acceso administrativo', 'Administrative access')}
            </p>
          )}

          <h1 className={styles.panelTitle}>
            {codes
              ? codes.length
                ? tx(
                    'Tu acceso ya está protegido',
                    'Your access is now protected',
                  )
                : tx('Sesión iniciada', 'Signed in')
              : challenge
                ? tx('Verificación en dos pasos', 'Two-step verification')
                : isAdminLogin
                  ? tx('Portal de Administración', 'Admin Portal')
                  : tx('Iniciar sesión', 'Sign in')}
          </h1>

          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}
          {registrationStatus && (
            <p className={styles.statusBanner} role="status">
              {registrationStatus === 'active'
                ? tx(
                    'Tu cuenta de inversionista está activa.',
                    'Your investor account is active.',
                  )
                : tx(
                    'Tu cuenta de comisionista está pendiente de activación por un administrador.',
                    'Your broker account is pending administrator activation.',
                  )}
            </p>
          )}
          {codes ? (
            <RecoveryCodesDisplay
              codes={codes}
              onDismiss={async () => {
                if (onRegisteredUserVerified) await onRegisteredUserVerified();
                else router.replace(destination);
                showDashboardCodes(null);
                setCodes(null);
              }}
              dismissText={tx('Continuar al panel', 'Continue to dashboard')}
            />
          ) : (
            <form
              key={challenge ? 'verify' : 'login'}
              onSubmit={submit}
              noValidate
            >
              <fieldset disabled={busy} className={styles.fieldset}>
                {challenge ? (
                  <>
                    {challenge.totp_enrollment && (
                      <TotpQrCode
                        secret={challenge.totp_enrollment.secret}
                        otpauthUri={challenge.totp_enrollment.otpauth_uri}
                      />
                    )}
                    <label
                      htmlFor="login-verification"
                      className={styles.fieldLabel}
                    >
                      {recovery
                        ? tx('Código de recuperación', 'Recovery code')
                        : tx('Código del autenticador', 'Authenticator code')}
                    </label>
                    <input
                      id="login-verification"
                      key={String(recovery)}
                      name="verification"
                      className={styles.inputControl}
                      placeholder={
                        recovery
                          ? tx('Ej. ABC1234567', 'e.g. ABC1234567')
                          : '000000'
                      }
                      autoComplete="one-time-code"
                      inputMode={recovery ? 'text' : 'numeric'}
                      pattern={recovery ? '[a-zA-Z0-9]{10}' : '[0-9]{6}'}
                      maxLength={recovery ? 10 : 6}
                      aria-invalid={fieldError === 'verification' || undefined}
                      onChange={() => {
                        if (fieldError === 'verification') {
                          setFieldError(null);
                          setError('');
                        }
                      }}
                      required
                    />
                  </>
                ) : (
                  <>
                    <label htmlFor="login-email" className={styles.fieldLabel}>
                      {tx('Correo electrónico', 'Email address')}
                    </label>
                    <input
                      id="login-email"
                      type="email"
                      name="email"
                      className={styles.inputControl}
                      value={emailValue}
                      aria-invalid={fieldError === 'email' || undefined}
                      onChange={(e) => {
                        setEmailValue(e.target.value);
                        if (fieldError === 'email') {
                          setFieldError(null);
                          setError('');
                        }
                      }}
                      placeholder={tx('correo@ejemplo.com', 'name@example.com')}
                      autoComplete="username"
                      required
                    />
                    <label
                      htmlFor="login-password"
                      className={styles.fieldLabel}
                    >
                      {tx('Contraseña', 'Password')}
                    </label>
                    <div className={styles.passwordWrapper}>
                      <input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        className={styles.inputControl}
                        value={passwordValue}
                        aria-invalid={fieldError === 'password' || undefined}
                        onChange={(e) => {
                          setPasswordValue(e.target.value);
                          if (fieldError === 'password') {
                            setFieldError(null);
                            setError('');
                          }
                        }}
                        placeholder={tx('Tu contraseña', 'Your password')}
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
                            ? tx('Ocultar clave', 'Hide password')
                            : tx('Mostrar clave', 'Show password')
                        }
                        title={
                          showPassword
                            ? tx('Ocultar clave', 'Hide password')
                            : tx('Mostrar clave', 'Show password')
                        }
                      >
                        <Icon
                          name={showPassword ? 'eyeOff' : 'eye'}
                          size={18}
                        />
                      </button>
                    </div>
                  </>
                )}
                <button type="submit" className={styles.submitButton}>
                  {busy
                    ? tx('Enviando…', 'Submitting…')
                    : challenge
                      ? tx('Verificar', 'Verify')
                      : isAdminLogin
                        ? tx(
                            'Ingresar al Portal Administrativo',
                            'Enter Admin Portal',
                          )
                        : tx('Iniciar sesión', 'Sign in')}
                </button>
                {challenge && !challenge.totp_enrollment && (
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={() => {
                      setRecovery(!recovery);
                      setError('');
                      setFieldError(null);
                    }}
                  >
                    {recovery
                      ? tx('Usar el autenticador', 'Use authenticator app')
                      : tx(
                          'Usar un código de recuperación',
                          'Use a recovery code',
                        )}
                  </button>
                )}
                {challenge && (
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={() => {
                      setChallenge(null);
                      setRecovery(false);
                      setError('');
                      setFieldError(null);
                    }}
                  >
                    {tx('Volver al inicio de sesión', 'Back to sign in')}
                  </button>
                )}
              </fieldset>
              {!challenge && !isAdminLogin && (
                <p className={styles.registerPrompt}>
                  {tx('¿Aún no tienes cuenta?', "Don't have an account yet?")}{' '}
                  <Link href="/registro">
                    {tx('Abrir cuenta de práctica', 'Open practice account')}
                  </Link>
                </p>
              )}
            </form>
          )}
        </section>
      </main>
    </div>
  );
}
