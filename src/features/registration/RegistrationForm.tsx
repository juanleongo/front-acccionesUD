'use client';

import { formatPersonName } from '@/lib/format-person-name';
import { useLocale } from '@/lib/i18n';
import { tx as t, type Locale } from '@/lib/i18n/locale';
import { toggleDocumentTheme } from '@/lib/theme';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useRef, useState, type FormEvent } from 'react';
import { z } from 'zod';
import { Icon } from '@/components/ui/Icon';
import { startLogin, type Challenge } from '@/features/login/client';
import { LoadingState } from '@/components/ui/LoadingState';
import { LinkPendingIndicator } from '@/components/ui/LinkPendingIndicator';
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

function VerificationLoading() {
  const { tx } = useLocale();
  return (
    <LoadingState
      label={tx('Preparando verificación…', 'Preparing verification…')}
    />
  );
}

const LoginForm = dynamic(
  () => import('@/features/login').then((module) => module.LoginForm),
  { loading: VerificationLoading },
);

function getCustomFieldError(
  control: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
  locale: Locale,
): string {
  const name = control.name;
  if (name === 'first_names')
    return t(locale, 'Ingresa tus nombres.', 'Enter your first name(s).');
  if (name === 'last_names')
    return t(locale, 'Ingresa tus apellidos.', 'Enter your last name(s).');
  if (name === 'email')
    return t(
      locale,
      'Ingresa un correo electrónico válido (ej. nombre@correo.com).',
      'Enter a valid email address (e.g. name@email.com).',
    );
  if (name === 'phone')
    return t(
      locale,
      'El teléfono debe incluir el indicativo del país (+) seguido únicamente de números, sin letras, espacios ni símbolos (ej. +573001234567).',
      'Phone must include country code (+) followed by digits only, with no letters, spaces, or symbols (e.g. +573001234567).',
    );
  if (name === 'country')
    return t(
      locale,
      'Selecciona tu país de residencia.',
      'Select your country of residence.',
    );
  if (name === 'password')
    return t(
      locale,
      'La contraseña debe tener al menos 8 caracteres, incluyendo mayúscula, minúscula y número.',
      'Password must be at least 8 characters long, including letters and numbers.',
    );
  if (name === 'firm_name')
    return t(locale, 'Ingresa el nombre de tu firma.', 'Enter your firm name.');
  if (name === 'license_number')
    return t(
      locale,
      'Ingresa tu número de licencia profesional.',
      'Enter your professional license number.',
    );
  if (name === 'tax_id')
    return t(
      locale,
      'Ingresa un número de documento válido (para pasaporte puedes incluir letras y números, ej. PA1234567; para cédula/NIT usa solo números).',
      'Enter a valid ID number (passports may include letters and digits, e.g. PA1234567; national IDs accept digits only).',
    );
  if (name === 'date_of_birth')
    return (
      validateBirthDateAge(control.value, locale) ??
      t(
        locale,
        'Selecciona tu fecha de nacimiento (+18 años).',
        'Select your date of birth (18+ years).',
      )
    );
  if (name === 'postal_code')
    return t(
      locale,
      'Ingresa el código postal de tu ciudad.',
      'Enter your postal code.',
    );
  if (name === 'street_address')
    return t(
      locale,
      'Ingresa tu dirección de residencia.',
      'Enter your street address.',
    );
  if (name === 'state')
    return t(
      locale,
      'Selecciona tu departamento, estado o provincia.',
      'Select your state, province, or region.',
    );
  if (name === 'city')
    return t(
      locale,
      'Selecciona tu ciudad de residencia.',
      'Select your city of residence.',
    );
  if (name === 'customer_agreement')
    return t(
      locale,
      'Debes aceptar el Acuerdo de Cliente de Corretaje (obligatorio).',
      'You must accept the Brokerage Customer Agreement (required).',
    );
  if (name === 'terms_accepted')
    return t(
      locale,
      'Debes aceptar los términos y condiciones de la plataforma para continuar.',
      'You must accept the platform terms and conditions to continue.',
    );
  return t(
    locale,
    'Por favor completa todos los campos obligatorios de este paso.',
    'Please fill in all required fields in this step.',
  );
}

export function RegistrationForm({ kind }: { kind: RegistrationKind }) {
  const { locale, tx } = useLocale();
  const broker = kind === 'broker';
  const steps = broker
    ? [
        tx('Datos personales', 'Personal details'),
        tx('Datos profesionales', 'Professional details'),
        tx('Preferencias', 'Preferences'),
        tx('Acuerdos', 'Agreements'),
      ]
    : [
        tx('Datos personales', 'Personal details'),
        tx('Preferencias', 'Preferences'),
        tx('Identidad y domicilio', 'Identity & address'),
        tx('Perfil financiero', 'Financial profile'),
        tx('Acuerdos', 'Agreements'),
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
  const [invalidField, setInvalidField] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [investorLevel, setInvestorLevel] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const termsDialog = useRef<HTMLDialogElement>(null);

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
          locale,
        );
        setError(
          tx(
            `La solicitud KYC fue rechazada. ${reason} Revisa los datos y vuelve a enviarla.`,
            `KYC submission was rejected. ${reason} Review your details and submit again.`,
          ),
        );
      } else
        setError(
          code === 409
            ? tx(
                'La apertura KYC ya está en proceso. Puedes consultar de nuevo su estado.',
                'KYC onboarding is already in progress. You can check its status again.',
              )
            : code === 403
              ? tx(
                  'Esta cuenta carece de permiso para solicitar la apertura KYC.',
                  'This account lacks permission to submit KYC onboarding.',
                )
              : tx(
                  'Tu usuario ya existe. No pudimos confirmar la apertura KYC.',
                  'Your user already exists. We could not confirm KYC onboarding.',
                ),
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
    setInvalidField(null);
    for (const control of form.querySelectorAll<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >('input,select,textarea')) {
      if (!control.closest('[hidden]') && !control.checkValidity()) {
        setInvalidField(control.name || null);
        setError(getCustomFieldError(control, locale));
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
        locale,
      );
      if (dobError) {
        setError(dobError);
        return;
      }
      if (!data.get('city') || !data.get('state')) {
        setError(
          tx(
            'Completa la región y la ciudad de tu domicilio.',
            'Complete your address region and city.',
          ),
        );
        return;
      }
    }
    const body = readRegistration(data, kind);
    if (step < lastStep) {
      if (!broker && step === 3) {
        try {
          readKyc(data, body, locale);
        } catch (cause) {
          setError(
            cause instanceof Error
              ? cause.message
              : tx(
                  'Revisa el perfil financiero.',
                  'Check your financial profile.',
                ),
          );
          return;
        }
      }
      setStep(step + 1);
      return;
    }
    if (!broker) {
      try {
        draft.current = readKyc(data, body, locale);
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : tx('Revisa los datos KYC.', 'Check your KYC details.'),
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
        tx(
          'Selecciona hasta 20 intereses de máximo 50 caracteres cada uno.',
          'Select up to 20 interests of at most 50 characters each.',
        ),
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
          tx(
            'Tu cuenta ya está registrada. Inicia sesión para continuar con la verificación.',
            'Your account is already registered. Sign in to continue verification.',
          ),
        );
      }
      setVerify(true);
    } catch (cause) {
      const code =
        cause instanceof ApiError ? cause.metadata.status : undefined;
      if (code === 409)
        setError(
          tx(
            'Ya existe una cuenta con este correo electrónico.',
            'An account with this email address already exists.',
          ),
        );
      else if (code === 422 && cause instanceof ApiError) {
        const labels = new Set<string>();
        for (const path of cause.metadata.invalidFields ?? []) {
          const field = form.elements.namedItem(
            path.replace(/^body\./, '').split('.')[0] ?? '',
          );
          if (field instanceof HTMLElement) {
            const label =
              field.closest('label')?.firstChild?.textContent?.trim() ||
              (field.id
                ? form
                    .querySelector(`label[for="${field.id}"]`)
                    ?.textContent?.trim()
                : undefined);
            if (label) labels.add(label);
          }
        }
        setError(
          labels.size
            ? `${tx('Revisa estos campos', 'Check these fields')}: ${[...labels].join(', ')}.`
            : tx('Revisa los datos del formulario.', 'Check the form details.'),
        );
      } else
        setError(
          tx(
            'No pudimos confirmar el registro. Inténtalo de nuevo más tarde.',
            'Could not confirm registration. Please try again later.',
          ),
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
          <RegistrationHeader
            onToggleTheme={() => {
              toggleDocumentTheme();
            }}
          />

          <main className={styles.page}>
            {status && !editing && (
              <section role="status" className={styles.panel}>
                <span className={styles.badge}>
                  <span className={styles.dot} />{' '}
                  {tx('Registro confirmado', 'Registration confirmed')}
                </span>
                <h1 className={styles.statusHeading}>
                  {status === 'active'
                    ? tx('Cuenta creada', 'Account created')
                    : tx('Solicitud recibida', 'Application received')}
                </h1>
                {kycPending ? (
                  <>
                    <p className={styles.statusText}>
                      {error ||
                        tx(
                          'Confirmando la apertura KYC…',
                          'Confirming KYC onboarding…',
                        )}
                    </p>
                    {error && (
                      <button
                        type="button"
                        className={styles.submitButton}
                        disabled={busy}
                        onClick={finishKyc}
                      >
                        {tx('Consultar y continuar', 'Check and continue')}
                      </button>
                    )}
                  </>
                ) : error ? (
                  <>
                    <p className={styles.statusText}>{error}</p>
                    <Link href="/login" className={styles.submitButton}>
                      {tx('Iniciar sesión', 'Sign in')}
                    </Link>
                  </>
                ) : (
                  <p className={styles.statusText}>
                    {tx(
                      'Preparando la verificación en dos pasos…',
                      'Preparing two-factor verification…',
                    )}
                  </p>
                )}
              </section>
            )}
            <div hidden={Boolean(status) && !editing}>
              <div className={styles.heroHeader}>
                <p className={styles.badge}>
                  <span className={styles.dot} />{' '}
                  {tx(
                    'Apertura de Cuenta · Bolsas de Estados Unidos (USD)',
                    'Account Opening · US Stock Markets (USD)',
                  )}
                </p>
                <h1 className={styles.heroTitle}>
                  {tx('Crear cuenta', 'Create account')}
                </h1>
                <p className={styles.subtitle}>
                  {tx(
                    'Opera sin riesgo con capital simulado en acciones y ETFs de Wall Street (NYSE, NASDAQ y NYSE Arca) bajo seguridad 2FA.',
                    'Trade risk-free with simulated capital in Wall Street stocks and ETFs (NYSE, NASDAQ, and NYSE Arca) protected by 2FA.',
                  )}
                </p>
              </div>

              <nav
                className={styles.kinds}
                aria-label={tx('Tipo de cuenta', 'Account type')}
              >
                <Link
                  href="/registro"
                  aria-current={!broker ? 'page' : undefined}
                >
                  <Icon name="user" size={18} />{' '}
                  {tx('Inversionista', 'Investor')}
                  <LinkPendingIndicator />
                </Link>
                <Link
                  href="/registro/broker"
                  aria-current={broker ? 'page' : undefined}
                >
                  <Icon name="users" size={18} /> {tx('Comisionista', 'Broker')}
                  <LinkPendingIndicator />
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
                    <Icon name="user" size={18} />{' '}
                    {tx('Datos personales', 'Personal details')}
                  </legend>
                  <div className={styles.grid}>
                    <div className={styles.field}>
                      <label
                        className={styles.fieldLabel}
                        htmlFor="first_names_input"
                      >
                        {tx('Nombres', 'First name(s)')}
                      </label>
                      <div className={styles.fieldControl}>
                        <input
                          id="first_names_input"
                          name="first_names"
                          aria-invalid={
                            invalidField === 'first_names' || undefined
                          }
                          onChange={() => {
                            if (invalidField === 'first_names') {
                              setInvalidField(null);
                              setError('');
                            }
                          }}
                          onBlur={(event) => {
                            event.currentTarget.value = formatPersonName(
                              event.currentTarget.value,
                            );
                          }}
                          placeholder={tx('Ej. Juan José', 'E.g. John')}
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
                        {tx('Apellidos', 'Last name(s)')}
                      </label>
                      <div className={styles.fieldControl}>
                        <input
                          id="last_names_input"
                          name="last_names"
                          aria-invalid={
                            invalidField === 'last_names' || undefined
                          }
                          onChange={() => {
                            if (invalidField === 'last_names') {
                              setInvalidField(null);
                              setError('');
                            }
                          }}
                          onBlur={(event) => {
                            event.currentTarget.value = formatPersonName(
                              event.currentTarget.value,
                            );
                          }}
                          placeholder={tx('Ej. León Gómez', 'E.g. Smith')}
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
                        {tx('Correo electrónico', 'Email address')}
                      </label>
                      <div className={styles.fieldControl}>
                        <input
                          id="email_input"
                          type="email"
                          name="email"
                          aria-invalid={invalidField === 'email' || undefined}
                          onChange={() => {
                            if (invalidField === 'email') {
                              setInvalidField(null);
                              setError('');
                            }
                          }}
                          placeholder={tx(
                            'correo@ejemplo.com',
                            'name@example.com',
                          )}
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
                        {tx(
                          'Teléfono con indicativo',
                          'Phone with country code',
                        )}
                      </label>
                      <div className={styles.fieldControl}>
                        <input
                          id="phone_input"
                          name="phone"
                          type="tel"
                          inputMode="tel"
                          autoComplete="tel"
                          aria-invalid={invalidField === 'phone' || undefined}
                          onChange={() => {
                            if (invalidField === 'phone') {
                              setInvalidField(null);
                              setError('');
                            }
                          }}
                          placeholder={tx(
                            'Ej. +573001234567',
                            'E.g. +573001234567',
                          )}
                          pattern={'\\+[1-9][0-9]{1,14}'}
                          title={tx(
                            'Debe ser el indicativo de país (+) seguido únicamente de números (ej. +573001234567). No se permiten letras, espacios ni símbolos.',
                            'Must be a country code (+) followed by digits only (e.g. +573001234567). Letters, spaces, or symbols are not allowed.',
                          )}
                          required
                        />
                      </div>
                      <small className={styles.fieldHelp}>
                        {tx(
                          'Indicativo de país (+) + número, solo dígitos (sin letras ni símbolos).',
                          'Country code (+) + number, digits only (no letters or symbols).',
                        )}
                      </small>
                    </div>

                    <div className={styles.field}>
                      <span className={styles.fieldLabel}>
                        {tx('País', 'Country')}
                      </span>
                      <div className={styles.fieldControl}>
                        <CountryCombobox
                          onCountryChange={(nextCountry) => {
                            setCountry(nextCountry);
                            if (invalidField === 'country') {
                              setInvalidField(null);
                              setError('');
                            }
                          }}
                          countries={countries}
                          defaultValue=""
                          disabled={busy}
                        />
                      </div>
                      <small className={styles.fieldHelp}>
                        {tx(
                          'Filtra escribiendo o selecciona tu país de residencia.',
                          'Type to filter or select your country of residence.',
                        )}
                      </small>
                    </div>

                    <div className={styles.field}>
                      <label
                        className={styles.fieldLabel}
                        htmlFor="password_input"
                      >
                        {tx('Contraseña', 'Password')}
                      </label>
                      <div className={styles.fieldControl}>
                        <input
                          id="password_input"
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          aria-invalid={
                            invalidField === 'password' || undefined
                          }
                          onChange={() => {
                            if (invalidField === 'password') {
                              setInvalidField(null);
                              setError('');
                            }
                          }}
                          placeholder={tx(
                            'Mínimo 8 caracteres (letras y números)',
                            'Minimum 8 characters (letters & digits)',
                          )}
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
                              ? tx('Ocultar contraseña', 'Hide password')
                              : tx('Mostrar contraseña', 'Show password')
                          }
                          title={
                            showPassword
                              ? tx('Ocultar contraseña', 'Hide password')
                              : tx('Mostrar contraseña', 'Show password')
                          }
                        >
                          <Icon
                            name={showPassword ? 'eyeOff' : 'eye'}
                            size={18}
                          />
                        </button>
                      </div>
                      <small id="password-help" className={styles.fieldHelp}>
                        {tx(
                          'De 8 a 128 caracteres, con al menos una letra y un dígito.',
                          '8 to 128 characters, with at least one letter and one digit.',
                        )}
                      </small>
                    </div>
                  </div>
                </fieldset>

                {broker && (
                  <fieldset hidden={step !== 1} disabled={busy}>
                    <legend>
                      <Icon name="shield" size={18} />{' '}
                      {tx(
                        'Datos profesionales (SCB / AMV)',
                        'Professional credentials (SCB / AMV)',
                      )}
                    </legend>
                    <div className={styles.grid}>
                      <div className={styles.field}>
                        <label
                          className={styles.fieldLabel}
                          htmlFor="firm_name_input"
                        >
                          {tx('Nombre de la firma', 'Firm name')}
                        </label>
                        <div className={styles.fieldControl}>
                          <input
                            id="firm_name_input"
                            name="firm_name"
                            aria-invalid={
                              invalidField === 'firm_name' || undefined
                            }
                            onChange={() => {
                              if (invalidField === 'firm_name') {
                                setInvalidField(null);
                                setError('');
                              }
                            }}
                            placeholder={tx(
                              'Ej. Acciones UD Capital S.A.',
                              'E.g. Acciones UD Capital S.A.',
                            )}
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
                          {tx(
                            'Número de licencia profesional',
                            'Professional license number',
                          )}
                        </label>
                        <div className={styles.fieldControl}>
                          <input
                            id="license_number_input"
                            name="license_number"
                            aria-invalid={
                              invalidField === 'license_number' || undefined
                            }
                            onChange={() => {
                              if (invalidField === 'license_number') {
                                setInvalidField(null);
                                setError('');
                              }
                            }}
                            placeholder={tx(
                              'Ej. AMV-UD-042',
                              'E.g. AMV-UD-042',
                            )}
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
                      aria-invalid={
                        invalidField === 'terms_accepted' || undefined
                      }
                      onChange={() => {
                        if (invalidField === 'terms_accepted') {
                          setInvalidField(null);
                          setError('');
                        }
                      }}
                      required
                    />
                    <span>
                      {tx('Acepto los', 'I accept the')}{' '}
                      <button
                        type="button"
                        className={styles.termsLink}
                        onClick={(e) => {
                          e.preventDefault();
                          termsDialog.current?.showModal();
                        }}
                      >
                        {tx('términos y condiciones', 'terms and conditions')}
                      </button>{' '}
                      {tx(
                        'de simulación bursátil en mercados de EE. UU. y la política de tratamiento de datos.',
                        'for simulated US equity trading and the privacy policy.',
                      )}
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
                          setInvalidField(null);
                          setStep(step - 1);
                        }}
                      >
                        {tx('Atrás', 'Back')}
                      </button>
                    )}
                    <button
                      type="submit"
                      className={styles.submitButton}
                      disabled={busy}
                    >
                      {busy
                        ? tx('Enviando…', 'Submitting…')
                        : step < lastStep
                          ? tx('Continuar', 'Continue')
                          : editing
                            ? tx(
                                'Reenviar solicitud KYC',
                                'Resubmit KYC application',
                              )
                            : broker
                              ? tx(
                                  'Solicitar registro de comisionista',
                                  'Request broker registration',
                                )
                              : tx(
                                  'Crear cuenta de inversionista',
                                  'Create investor account',
                                )}
                    </button>
                    <p className={styles.loginPrompt}>
                      {tx(
                        '¿Ya tienes una cuenta en Acciones UD?',
                        'Already have an Acciones UD account?',
                      )}{' '}
                      <Link href="/login">
                        {tx('Iniciar sesión', 'Sign in')}
                      </Link>
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
