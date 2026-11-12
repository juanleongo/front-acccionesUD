'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRef, useState, type FormEvent } from 'react';
import { Icon } from '@/components/ui/Icon';
import { browserHttp } from '@/lib/api/client';
import { ApiError } from '@/lib/api';
import { LoginForm, startLogin, type Challenge } from '@/features/login';
import { countries } from './countries';
import { CountryCombobox } from './CountryCombobox';
import {
  marketInterestsCatalog,
  readRegistration,
  registrationPath,
  resultSchema,
  type RegistrationKind,
} from './contract';
import styles from './registration.module.css';

export function RegistrationForm({ kind }: { kind: RegistrationKind }) {
  const broker = kind === 'broker';
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [pickerValue, setPickerValue] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const termsDialog = useRef<HTMLDialogElement>(null);

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

  function addInterest(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return;
    setSelectedInterests((prev) =>
      prev.includes(trimmed) || prev.length >= 20 ? prev : [...prev, trimmed],
    );
  }

  function removeInterest(value: string) {
    setSelectedInterests((prev) => prev.filter((item) => item !== value));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const body = readRegistration(new FormData(form), kind);
    if (
      body.interests.length > 20 ||
      body.interests.some((i) => [...i].length > 50)
    ) {
      setError(
        'Selecciona hasta 20 intereses de máximo 50 caracteres cada uno.',
      );
      return;
    }
    setBusy(true);
    setError('');
    try {
      const result = await browserHttp.request({
        method: 'POST',
        path: registrationPath(kind),
        body,
        response: 'json',
        parse: (value) => resultSchema.parse(value),
      });
      setStatus(result.account_status);
      try {
        setChallenge(await startLogin(body.email, body.password));
      } catch {
        setError(
          'Tu cuenta ya está registrada. Inicia sesión para continuar con la verificación.',
        );
      }
    } catch (cause) {
      const code =
        cause instanceof ApiError ? cause.metadata.status : undefined;
      if (code === 409)
        setError('Ya existe una cuenta con este correo electrónico.');
      else if (code === 422 && cause instanceof ApiError) {
        const labels = new Set<string>();
        for (const path of cause.metadata.invalidFields ?? []) {
          const field = form.elements.namedItem(
            path.replace(/^body\./, '').split('.')[0] ?? '',
          );
          if (field instanceof HTMLElement) {
            const label = field
              .closest('label')
              ?.firstChild?.textContent?.trim();
            if (label) labels.add(label);
          }
        }
        setError(
          labels.size
            ? 'Revisa estos campos: ' + [...labels].join(', ') + '.'
            : 'Revisa los datos del formulario.',
        );
      } else
        setError(
          'No pudimos confirmar el registro. Inténtalo de nuevo más tarde.',
        );
    } finally {
      setBusy(false);
    }
  }

  if (challenge)
    return (
      <LoginForm initialChallenge={challenge} registrationStatus={status} />
    );

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
        {status ? (
          <section role="status" className={styles.panel}>
            <span className={styles.badge}>
              <span className={styles.dot} /> Registro confirmado
            </span>
            <h1>
              {status === 'active' ? 'Cuenta creada' : 'Solicitud recibida'}
            </h1>
            {error ? (
              <>
                <p>{error}</p>
                <Link href="/login" className={styles.submitButton}>
                  Iniciar sesión
                </Link>
              </>
            ) : (
              <p>Preparando la verificación en dos pasos…</p>
            )}
          </section>
        ) : (
          <>
            <div className={styles.heroHeader}>
              <p className={styles.badge}>
                <span className={styles.dot} /> Apertura de Cuenta · Bolsas de
                Estados Unidos (USD)
              </p>
              <h1>Crear cuenta</h1>
              <p className={styles.subtitle}>
                Opera sin riesgo con capital simulado en acciones y ETFs de Wall
                Street (NYSE, NASDAQ y NYSE Arca) bajo seguridad 2FA.
              </p>
            </div>

            <nav className={styles.kinds} aria-label="Tipo de cuenta">
              <Link
                href="/registro"
                aria-current={!broker ? 'page' : undefined}
              >
                <Icon name="user" size={18} /> Inversionista
              </Link>
              <Link
                href="/registro/broker"
                aria-current={broker ? 'page' : undefined}
              >
                <Icon name="users" size={18} /> Comisionista
              </Link>
            </nav>

            <form method="post" className={styles.panel} onSubmit={submit}>
              <fieldset disabled={busy}>
                <legend>
                  <Icon name="user" size={18} /> Datos personales
                </legend>
                <div className={styles.grid}>
                  <div className={styles.field}>
                    <label
                      className={styles.fieldLabel}
                      htmlFor="first_names_input"
                    >
                      Nombres
                    </label>
                    <div className={styles.fieldControl}>
                      <input
                        id="first_names_input"
                        name="first_names"
                        placeholder="Ej. Juan José"
                        autoComplete="given-name"
                        maxLength={100}
                        required
                        pattern={'.*\\S.*'}
                      />
                    </div>
                  </div>

                  <div className={styles.field}>
                    <label
                      className={styles.fieldLabel}
                      htmlFor="last_names_input"
                    >
                      Apellidos
                    </label>
                    <div className={styles.fieldControl}>
                      <input
                        id="last_names_input"
                        name="last_names"
                        placeholder="Ej. León Gómez"
                        autoComplete="family-name"
                        maxLength={100}
                        required
                        pattern={'.*\\S.*'}
                      />
                    </div>
                  </div>

                  <div className={styles.field}>
                    <label className={styles.fieldLabel} htmlFor="email_input">
                      Correo electrónico
                    </label>
                    <div className={styles.fieldControl}>
                      <input
                        id="email_input"
                        type="email"
                        name="email"
                        placeholder="correo@ejemplo.com"
                        autoComplete="email"
                        maxLength={254}
                        required
                      />
                    </div>
                  </div>

                  <div className={styles.field}>
                    <label className={styles.fieldLabel} htmlFor="phone_input">
                      Teléfono con indicativo
                    </label>
                    <div className={styles.fieldControl}>
                      <input
                        id="phone_input"
                        name="phone"
                        type="tel"
                        autoComplete="tel"
                        placeholder="+573001234567"
                        pattern={'\\+[1-9][0-9]{1,14}'}
                        title="Incluye + y el indicativo del país, sin espacios."
                        required
                      />
                    </div>
                  </div>

                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>País</span>
                    <div className={styles.fieldControl}>
                      <CountryCombobox
                        countries={countries}
                        defaultValue=""
                        disabled={busy}
                      />
                    </div>
                    <small className={styles.fieldHelp}>
                      Filtra escribiendo o selecciona tu país de residencia.
                    </small>
                  </div>

                  <div className={styles.field}>
                    <label
                      className={styles.fieldLabel}
                      htmlFor="password_input"
                    >
                      Contraseña
                    </label>
                    <div className={styles.fieldControl}>
                      <input
                        id="password_input"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Mínimo 8 caracteres (letras y números)"
                        autoComplete="new-password"
                        minLength={8}
                        maxLength={128}
                        required
                        pattern={'(?=.*\\p{L})(?=.*\\p{N}).+'}
                        aria-describedby="password-help"
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
                    <small id="password-help" className={styles.fieldHelp}>
                      De 8 a 128 caracteres, con al menos una letra y un dígito.
                    </small>
                  </div>
                </div>
              </fieldset>

              {broker && (
                <fieldset disabled={busy}>
                  <legend>
                    <Icon name="shield" size={18} /> Datos profesionales (SCB /
                    AMV)
                  </legend>
                  <div className={styles.grid}>
                    <div className={styles.field}>
                      <label
                        className={styles.fieldLabel}
                        htmlFor="firm_name_input"
                      >
                        Nombre de la firma
                      </label>
                      <div className={styles.fieldControl}>
                        <input
                          id="firm_name_input"
                          name="firm_name"
                          placeholder="Ej. Acciones UD Capital S.A."
                          autoComplete="organization"
                          maxLength={200}
                          required
                          pattern={'.*\\S.*'}
                        />
                      </div>
                    </div>

                    <div className={styles.field}>
                      <label
                        className={styles.fieldLabel}
                        htmlFor="license_number_input"
                      >
                        Número de licencia profesional
                      </label>
                      <div className={styles.fieldControl}>
                        <input
                          id="license_number_input"
                          name="license_number"
                          placeholder="Ej. AMV-UD-042"
                          maxLength={50}
                          required
                          pattern={'.*\\S.*'}
                        />
                      </div>
                    </div>
                  </div>
                </fieldset>
              )}

              <fieldset disabled={busy}>
                <legend>
                  <Icon name="trend" size={18} /> Preferencias e intereses en
                  mercados de EE. UU.
                </legend>
                <div className={styles.grid}>
                  <div className={`${styles.field} ${styles.fullWidth}`}>
                    <label
                      className={styles.fieldLabel}
                      htmlFor="investor_level_select"
                    >
                      Nivel de experiencia (opcional)
                    </label>
                    <div className={styles.fieldControl}>
                      <select
                        id="investor_level_select"
                        name="investor_level"
                        defaultValue=""
                      >
                        <option value="">Sin especificar</option>
                        <option value="beginner">
                          Principiante (Iniciando en Wall Street · Instrumentos
                          de menor volatilidad)
                        </option>
                        <option value="experienced">
                          Con experiencia (Operación activa en NYSE / NASDAQ ·
                          Órdenes avanzadas)
                        </option>
                      </select>
                    </div>
                    <small className={styles.fieldHelp}>
                      Adapta las recomendaciones de activos y comisionistas a tu
                      perfil bursátil.
                    </small>
                  </div>

                  <div className={`${styles.field} ${styles.fullWidth}`}>
                    <label
                      className={styles.fieldLabel}
                      htmlFor="interests_picker"
                    >
                      Intereses bursátiles (opcional)
                    </label>
                    <div className={styles.fieldControl}>
                      <select
                        id="interests_picker"
                        value={pickerValue}
                        aria-describedby="interests-help"
                        onChange={(event) => {
                          const chosen = event.target.value;
                          setPickerValue('');
                          if (chosen) addInterest(chosen);
                        }}
                      >
                        <option value="">
                          Selecciona tus mercados de interés (Oro, Petróleo,
                          Tecnología, Banca, etc.)
                        </option>
                        {marketInterestsCatalog.map((item) => (
                          <option
                            key={item.value}
                            value={item.value}
                            disabled={selectedInterests.includes(item.value)}
                          >
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <small id="interests-help" className={styles.fieldHelp}>
                      Elige uno o varios sectores del mercado estadounidense en
                      la lista desplegable.
                    </small>
                  </div>
                </div>

                {selectedInterests.map((interest) => (
                  <input
                    key={interest}
                    type="hidden"
                    name="interests"
                    value={interest}
                  />
                ))}

                {selectedInterests.length > 0 && (
                  <div
                    className={styles.selectedInterests}
                    aria-label="Intereses seleccionados"
                  >
                    <span className={styles.selectedTitle}>
                      Sectores seleccionados ({selectedInterests.length}):
                    </span>
                    <div className={styles.interestChips}>
                      {selectedInterests.map((interest) => (
                        <span key={interest} className={styles.interestChip}>
                          {interest}
                          <button
                            type="button"
                            className={styles.chipRemove}
                            onClick={() => removeInterest(interest)}
                            aria-label={`Quitar ${interest}`}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className={styles.checkGroup}>
                  <label className={styles.check}>
                    <input type="checkbox" name="monthly_report" />
                    <span>
                      <strong>Recibir el informe mensual</strong>
                      <small>
                        Resumen ejecutivo del mercado estadounidense (S&amp;P
                        500 y NASDAQ).
                      </small>
                    </span>
                  </label>
                  <label className={styles.check}>
                    <input type="checkbox" name="broker_requested" />
                    <span>
                      <strong>
                        Solicitar acompañamiento de un comisionista
                      </strong>
                      <small>
                        Asesoría personalizada para estructurar tu portafolio en
                        USD.
                      </small>
                    </span>
                  </label>
                  <label className={styles.check}>
                    <input type="checkbox" name="premium_requested" />
                    <span>
                      <strong>Solicitar el plan prémium</strong>
                      <small>
                        Acceso a listas de seguimiento avanzadas y alertas de
                        precio en tiempo real.
                      </small>
                    </span>
                  </label>
                </div>
              </fieldset>

              <div className={styles.footerArea}>
                <label className={`${styles.check} ${styles.termsCheck}`}>
                  <input
                    disabled={busy}
                    type="checkbox"
                    name="terms_accepted"
                    required
                  />
                  <span>
                    Acepto los{' '}
                    <button
                      type="button"
                      className={styles.termsLink}
                      onClick={(e) => {
                        e.preventDefault();
                        termsDialog.current?.showModal();
                      }}
                    >
                      términos y condiciones
                    </button>{' '}
                    de simulación bursátil en mercados de EE. UU. y la política
                    de tratamiento de datos.
                  </span>
                </label>

                {error && (
                  <p className={styles.error} role="alert">
                    {error}
                  </p>
                )}

                <div className={styles.submitRow}>
                  <button
                    type="submit"
                    className={styles.submitButton}
                    disabled={busy}
                  >
                    {busy
                      ? 'Enviando…'
                      : broker
                        ? 'Solicitar registro de comisionista'
                        : 'Crear cuenta de inversionista'}
                  </button>
                  <p className={styles.loginPrompt}>
                    ¿Ya tienes una cuenta en Acciones UD?{' '}
                    <Link href="/login">Iniciar sesión</Link>
                  </p>
                </div>
              </div>
            </form>
          </>
        )}
      </main>

      <dialog ref={termsDialog} className={styles.termsDialog}>
        <h2>Términos y Condiciones · Acciones UD</h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
          Plataforma de simulación bursátil educativa en mercados de EE. UU.
          (NYSE, NASDAQ y NYSE Arca):
        </p>
        <ul className={styles.termsList}>
          <li>
            <strong>1. Naturaleza de Simulación (Paper Trading):</strong> Todos
            los fondos, saldos y órdenes operan en un entorno virtual de
            práctica y aprendizaje cuantitativo. No se captan recursos del
            público ni se compromete dinero real.
          </li>
          <li>
            <strong>
              2. Tratamiento de Datos (Habeas Data - Ley 1581 de 2012):
            </strong>{' '}
            Tu información personal (nombres, correo, teléfono y país) se
            almacena bajo estándares de cifrado y se usa exclusivamente para
            fines de autenticación, control de sesiones y trazabilidad académica
            en la Universidad Distrital Francisco José de Caldas.
          </li>
          <li>
            <strong>3. Autenticación en Dos Pasos (2FA / TOTP):</strong> Es
            obligatorio configurar un autenticador móvil basado en tiempo (TOTP
            de 30 segundos) y resguardar los códigos de recuperación para la
            protección de tu cuenta.
          </li>
          <li>
            <strong>4. Datos de Mercado en Tiempo Real:</strong> Las
            cotizaciones e índices de Wall Street son provistos con fines
            didácticos para la toma de decisiones financieras simuladas.
          </li>
        </ul>
        <form
          method="dialog"
          style={{ display: 'flex', justifyContent: 'flex-end' }}
        >
          <button
            type="submit"
            className={styles.submitButton}
            style={{ width: 'auto', padding: '0.65rem 1.5rem' }}
          >
            Entendido y cerrar
          </button>
        </form>
      </dialog>
    </div>
  );
}
