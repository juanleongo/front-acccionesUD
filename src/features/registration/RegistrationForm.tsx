'use client';

import { formatPersonName } from '@/lib/format-person-name';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState, type FormEvent } from 'react';
import { z } from 'zod';
import { Icon } from '@/components/ui/Icon';
import { LoginForm, startLogin, type Challenge } from '@/features/login';
import { ApiError } from '@/lib/api';
import { browserHttp } from '@/lib/api/client';
import { PreferencesStepFields } from './components/PreferencesStepFields';
import { RegistrationHeader } from './components/RegistrationHeader';
import { RegistrationStepper } from './components/RegistrationStepper';
import { TermsConditionsDialog } from './components/TermsConditionsDialog';
import {
  readRegistration,
  registrationPath,
  resultSchema,
  type RegistrationKind,
} from './contract';
import { countries } from './countries';
import { CountryCombobox } from './CountryCombobox';
import {
  formatKycSubmissionError,
  KycFields,
  readKyc,
  validateBirthDateAge,
} from './KycFields';
import styles from './registration.module.css';

function getCustomFieldError(
  control: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
): string {
  const name = control.name;
  if (name === 'first_names') return 'Ingresa tus nombres.';
  if (name === 'last_names') return 'Ingresa tus apellidos.';
  if (name === 'email')
    return 'Ingresa un correo electrónico válido (ej. nombre@correo.com).';
  if (name === 'phone')
    return 'El teléfono debe incluir el indicativo del país (+) seguido únicamente de números, sin letras, espacios ni símbolos (ej. +573001234567).';
  if (name === 'country') return 'Selecciona tu país de residencia.';
  if (name === 'password')
    return 'La contraseña debe tener al menos 8 caracteres, incluyendo mayúscula, minúscula y número.';
  if (name === 'firm_name') return 'Ingresa el nombre de tu firma.';
  if (name === 'license_number')
    return 'Ingresa tu número de licencia profesional.';
  if (name === 'tax_id')
    return 'Ingresa un número de documento válido (para pasaporte puedes incluir letras y números, ej. PA1234567; para cédula/NIT usa solo números).';
  if (name === 'date_of_birth')
    return (
      validateBirthDateAge(control.value) ??
      'Selecciona tu fecha de nacimiento (+18 años).'
    );
  if (name === 'postal_code') return 'Ingresa el código postal de tu ciudad.';
  if (name === 'street_address') return 'Ingresa tu dirección de residencia.';
  if (name === 'state')
    return 'Selecciona tu departamento, estado o provincia.';
  if (name === 'city') return 'Selecciona tu ciudad de residencia.';
  if (name === 'customer_agreement')
    return 'Debes aceptar el Acuerdo de Cliente de Corretaje (obligatorio).';
  if (name === 'terms_accepted')
    return 'Debes aceptar los términos y condiciones de la plataforma para continuar.';
  return 'Por favor completa todos los campos obligatorios de este paso.';
}

export function RegistrationForm({ kind }: { kind: RegistrationKind }) {
  const broker = kind === 'broker';
  const steps = broker
    ? ['Datos personales', 'Datos profesionales', 'Preferencias', 'Acuerdos']
    : [
        'Datos personales',
        'Preferencias',
        'Identidad y domicilio',
        'Perfil financiero',
        'Acuerdos',
      ];
  const [step, setStep] = useState(0);
  const lastStep = steps.length - 1;
  const [country, setCountry] = useState('');
  const router = useRouter();
  const [registeredId, setRegisteredId] = useState('');
  const [verify, setVerify] = useState(false);
  const [kycPending, setKycPending] = useState(false);
  const [editing, setEditing] = useState(false);
  const draft = useRef<ReturnType<typeof readKyc> | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [investorLevel, setInvestorLevel] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
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

  function toggleInterestSelection(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return;
    setSelectedInterests((prev) =>
      prev.includes(trimmed)
        ? prev.filter((item) => item !== trimmed)
        : prev.length >= 20
          ? prev
          : [...prev, trimmed],
    );
  }

  function removeInterest(value: string) {
    setSelectedInterests((prev) => prev.filter((item) => item !== value));
  }

  async function finishKyc() {
    if (!draft.current) return;
    setBusy(true);
    setVerify(false);
    setKycPending(true);
    setError('');
    try {
      const user = await browserHttp.request({
        path: '/api/v1/users/me',
        response: 'json',
        parse: z.object({ user_id: z.string() }).parse,
      });
      if (user.user_id !== registeredId) {
        setChallenge(null);
        setVerify(true);
        return;
      }
      const state = await browserHttp.request({
        path: '/api/v1/kyc/status',
        response: 'json',
        parse: z.object({ has_account: z.boolean() }).parse,
      });
      if (!state.has_account)
        await browserHttp.request({
          path: '/api/v1/kyc/account',
          method: 'POST',
          body: draft.current,
          response: 'json',
          parse: z.object({ alpaca_account_id: z.string(), status: z.string() })
            .parse,
        });
      draft.current = null;
      router.replace('/dashboard');
    } catch (cause) {
      const code =
        cause instanceof ApiError ? cause.metadata.status : undefined;
      if (code === 401) {
        setChallenge(null);
        setVerify(true);
      } else if (code === 422) {
        setEditing(true);
        const rawDetail = cause instanceof ApiError ? cause.message : '';
        const invalidFields =
          cause instanceof ApiError ? cause.metadata.invalidFields : undefined;
        const lower =
          `${rawDetail} ${(invalidFields ?? []).join(' ')}`.toLowerCase();
        if (
          lower.includes('net_worth') ||
          lower.includes('annual_income') ||
          lower.includes('funding_source')
        ) {
          setStep(3);
        } else if (lower.includes('agreement')) {
          setStep(4);
        } else {
          setStep(2);
        }
        const reason = formatKycSubmissionError(
          rawDetail,
          invalidFields,
          draft.current ?? undefined,
        );
        setError(
          `La solicitud KYC fue rechazada. ${reason} Revisa los datos y vuelve a enviarla.`,
        );
      } else
        setError(
          code === 409
            ? 'La apertura KYC ya está en proceso. Puedes consultar de nuevo su estado.'
            : code === 403
              ? 'Esta cuenta carece de permiso para solicitar la apertura KYC.'
              : 'Tu usuario ya existe. No pudimos confirmar la apertura KYC.',
        );
    } finally {
      setBusy(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    setError('');
    for (const control of form.querySelectorAll<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >('input,select,textarea')) {
      if (!control.closest('[hidden]') && !control.checkValidity()) {
        setError(getCustomFieldError(control));
        return;
      }
    }
    const data = new FormData(form);
    if (step === 0) {
      for (const fieldName of ['first_names', 'last_names'] as const) {
        const control = form.elements.namedItem(fieldName);
        if (control instanceof HTMLInputElement) {
          const normalized = formatPersonName(control.value);
          control.value = normalized;
          data.set(fieldName, normalized);
        }
      }
    }
    if (!broker && step === 2) {
      const dobError = validateBirthDateAge(
        String(data.get('date_of_birth') ?? ''),
      );
      if (dobError) {
        setError(dobError);
        return;
      }
      if (!data.get('city') || !data.get('state')) {
        setError('Completa la región y la ciudad de tu domicilio.');
        return;
      }
    }
    const body = readRegistration(data, kind);
    if (step < lastStep) {
      if (!broker && step === 3) {
        try {
          readKyc(data, body);
        } catch (cause) {
          setError(
            cause instanceof Error
              ? cause.message
              : 'Revisa el perfil financiero.',
          );
          return;
        }
      }
      setStep(step + 1);
      return;
    }
    if (!broker) {
      try {
        draft.current = readKyc(data, body);
      } catch (cause) {
        setError(
          cause instanceof Error ? cause.message : 'Revisa los datos KYC.',
        );
        return;
      }
      if (registeredId) {
        setEditing(false);
        await finishKyc();
        return;
      }
    }
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
      setRegisteredId(result.user_id);
      const passwordInput = form.elements.namedItem(
        'password',
      ) as HTMLInputElement;
      passwordInput.value = '';
      passwordInput.required = false;
      try {
        setChallenge(await startLogin(body.email, body.password));
      } catch {
        setError(
          'Tu cuenta ya está registrada. Inicia sesión para continuar con la verificación.',
        );
      }
      setVerify(true);
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

  return (
    <>
      {verify && (
        <LoginForm
          initialChallenge={challenge}
          registrationStatus={status}
          registeredUserId={registeredId}
          {...(!broker ? { onRegisteredUserVerified: finishKyc } : {})}
        />
      )}
      <div hidden={verify}>
        <div className={styles.wrapper}>
          <RegistrationHeader onToggleTheme={toggleTheme} />

          <main className={styles.page}>
            {status && !editing && (
              <section role="status" className={styles.panel}>
                <span className={styles.badge}>
                  <span className={styles.dot} /> Registro confirmado
                </span>
                <h1>
                  {status === 'active' ? 'Cuenta creada' : 'Solicitud recibida'}
                </h1>
                {kycPending ? (
                  <>
                    <p>{error || 'Confirmando la apertura KYC…'}</p>
                    {error && (
                      <button type="button" disabled={busy} onClick={finishKyc}>
                        Consultar y continuar
                      </button>
                    )}
                  </>
                ) : error ? (
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
            )}
            <div hidden={Boolean(status) && !editing}>
              <div className={styles.heroHeader}>
                <p className={styles.badge}>
                  <span className={styles.dot} /> Apertura de Cuenta · Bolsas de
                  Estados Unidos (USD)
                </p>
                <h1>Crear cuenta</h1>
                <p className={styles.subtitle}>
                  Opera sin riesgo con capital simulado en acciones y ETFs de
                  Wall Street (NYSE, NASDAQ y NYSE Arca) bajo seguridad 2FA.
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

              <form
                method="post"
                className={styles.panel}
                onSubmit={submit}
                data-kyc-edit={editing}
                noValidate
              >
                <RegistrationStepper steps={steps} step={step} />

                <fieldset hidden={step !== 0} disabled={busy}>
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
                          onBlur={(event) => {
                            event.currentTarget.value = formatPersonName(
                              event.currentTarget.value,
                            );
                          }}
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
                          onBlur={(event) => {
                            event.currentTarget.value = formatPersonName(
                              event.currentTarget.value,
                            );
                          }}
                          placeholder="Ej. León Gómez"
                          autoComplete="family-name"
                          maxLength={100}
                          required
                          pattern={'.*\\S.*'}
                        />
                      </div>
                    </div>

                    <div className={styles.field}>
                      <label
                        className={styles.fieldLabel}
                        htmlFor="email_input"
                      >
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
                      <label
                        className={styles.fieldLabel}
                        htmlFor="phone_input"
                      >
                        Teléfono con indicativo
                      </label>
                      <div className={styles.fieldControl}>
                        <input
                          id="phone_input"
                          name="phone"
                          type="tel"
                          inputMode="tel"
                          autoComplete="tel"
                          placeholder="Ej. +573001234567"
                          pattern={'\\+[1-9][0-9]{1,14}'}
                          title="Debe ser el indicativo de país (+) seguido únicamente de números (ej. +573001234567). No se permiten letras, espacios ni símbolos."
                          onInvalid={(e) =>
                            e.currentTarget.setCustomValidity(
                              'Formato inválido: escribe el indicativo del país (+) seguido solo de números (ej. +573001234567). No ingreses letras, espacios ni símbolos.',
                            )
                          }
                          onInput={(e) => e.currentTarget.setCustomValidity('')}
                          required
                        />
                      </div>
                      <small className={styles.fieldHelp}>
                        Indicativo de país (+) + número, solo dígitos (sin
                        letras ni símbolos).
                      </small>
                    </div>

                    <div className={styles.field}>
                      <span className={styles.fieldLabel}>País</span>
                      <div className={styles.fieldControl}>
                        <CountryCombobox
                          onCountryChange={setCountry}
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
                        De 8 a 128 caracteres, con al menos una letra y un
                        dígito.
                      </small>
                    </div>
                  </div>
                </fieldset>

                {broker && (
                  <fieldset hidden={step !== 1} disabled={busy}>
                    <legend>
                      <Icon name="shield" size={18} /> Datos profesionales (SCB
                      / AMV)
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

                <PreferencesStepFields
                  hidden={step !== (broker ? 2 : 1)}
                  disabled={busy}
                  investorLevel={investorLevel}
                  selectedInterests={selectedInterests}
                  onChangeInvestorLevel={setInvestorLevel}
                  onToggleInterest={toggleInterestSelection}
                  onRemoveInterest={removeInterest}
                />

                {!broker && (
                  <KycFields
                    key={country}
                    step={step}
                    country={country}
                    disabled={busy}
                  />
                )}

                <div className={styles.footerArea}>
                  <label
                    hidden={step !== lastStep || editing}
                    className={`${styles.check} ${styles.termsCheck}`}
                  >
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
                      de simulación bursátil en mercados de EE. UU. y la
                      política de tratamiento de datos.
                    </span>
                  </label>

                  {error && (
                    <p className={styles.error} role="alert">
                      {error}
                    </p>
                  )}

                  <div className={styles.submitRow}>
                    {step > (editing ? 2 : 0) && (
                      <button
                        type="button"
                        className={styles.backStepButton}
                        disabled={busy}
                        onClick={() => {
                          setError('');
                          setStep(step - 1);
                        }}
                      >
                        Atrás
                      </button>
                    )}
                    <button
                      type="submit"
                      className={styles.submitButton}
                      disabled={busy}
                    >
                      {busy
                        ? 'Enviando…'
                        : step < lastStep
                          ? 'Continuar'
                          : editing
                            ? 'Reenviar solicitud KYC'
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
            </div>
          </main>

          <TermsConditionsDialog dialogRef={termsDialog} />
        </div>
      </div>
    </>
  );
}
