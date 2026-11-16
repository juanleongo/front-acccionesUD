'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { KycFields, readKyc, validateBirthDateAge } from './KycFields';
import { useRef, useState, type FormEvent } from 'react';
import { Icon, type IconName } from '@/components/ui/Icon';
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

const SECTOR_ICONS: IconName[] = [
  'devices',
  'trend',
  'coin',
  'bolt',
  'wallet',
  'globe',
  'shield',
  'pie',
  'grid',
  'star',
];

function splitSectorLabel(item: { value: string; label: string }) {
  const match = /\(([^)]+)\)\s*$/.exec(item.label);
  return {
    title: item.value,
    subtitle: match?.[1] ?? item.label,
  };
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
        setStep(2);
        const rawDetail =
          cause instanceof ApiError ? cause.message.toLowerCase() : '';
        let reason =
          'Verifica que la fecha de nacimiento sea de un mayor de 18 años y que el número de documento o correo no estén ya registrados en el custodio Alpaca.';
        if (rawDetail.includes('date_of_birth') || rawDetail.includes('age')) {
          reason =
            'La fecha de nacimiento ingresada no cumple la mayoría de edad (+18 años) o es inválida.';
        } else if (
          rawDetail.includes('already exists') ||
          rawDetail.includes('email')
        ) {
          reason =
            'Este correo o número de documento ya tiene una cuenta registrada en el sandbox de Alpaca.';
        } else if (rawDetail.includes('tax_id')) {
          reason =
            'El número o formato de documento de identidad fue rechazado por el custodio.';
        }
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
                <div
                  className={styles.stepperCard}
                  aria-label="Pasos del registro"
                >
                  <p className={styles.srOnly} aria-live="polite">
                    Paso {step + 1} de {steps.length} · {steps[step]}
                  </p>
                  <progress
                    className={styles.srOnly}
                    aria-label="Progreso del registro"
                    value={step + 1}
                    max={steps.length}
                  />
                  <ol className={styles.stepperList}>
                    {steps.map((label, idx) => {
                      const done = idx < step;
                      const current = idx === step;
                      return (
                        <li
                          key={label}
                          className={`${styles.stepperItem} ${done ? styles.stepperItemDone : ''} ${current ? styles.stepperItemCurrent : ''}`}
                        >
                          <div className={styles.stepperTrackRow}>
                            <span
                              className={`${styles.stepperLine} ${idx === 0 ? styles.stepperLineHidden : ''} ${idx <= step ? styles.stepperLineActive : ''}`}
                            />
                            <span className={styles.stepperCircle}>
                              {done ? '✓' : idx + 1}
                            </span>
                            <span
                              className={`${styles.stepperLine} ${idx === steps.length - 1 ? styles.stepperLineHidden : ''} ${idx < step ? styles.stepperLineActive : ''}`}
                            />
                          </div>
                          <span className={styles.stepperLabel}>
                            {idx + 1}. {label}
                          </span>
                        </li>
                      );
                    })}
                  </ol>
                </div>
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

                <fieldset hidden={step !== (broker ? 2 : 1)} disabled={busy}>
                  <legend>
                    <Icon name="trend" size={18} /> Preferencias e intereses en
                    mercados de EE. UU.
                  </legend>
                  <div className={styles.grid}>
                    <div className={`${styles.field} ${styles.fullWidth}`}>
                      <label
                        className={styles.sectionBlockTitle}
                        htmlFor="investor_level_select"
                      >
                        1. Nivel de experiencia (opcional)
                      </label>
                      <select
                        id="investor_level_select"
                        name="investor_level"
                        value={investorLevel}
                        onChange={(e) => setInvestorLevel(e.target.value)}
                        tabIndex={-1}
                        className={styles.hiddenNativeSelect}
                      >
                        <option value="">Sin especificar</option>
                        <option value="beginner">Principiante</option>
                        <option value="experienced">Con experiencia</option>
                      </select>

                      <div
                        className={styles.experienceCardsGrid}
                        role="radiogroup"
                        aria-label="Selección visual de nivel de experiencia"
                      >
                        <button
                          type="button"
                          role="radio"
                          aria-checked={investorLevel === 'beginner'}
                          onClick={() =>
                            setInvestorLevel((prev) =>
                              prev === 'beginner' ? '' : 'beginner',
                            )
                          }
                          className={`${styles.experienceCard} ${investorLevel === 'beginner' ? styles.experienceCardActive : ''}`}
                        >
                          <div className={styles.experienceCardTop}>
                            <span className={styles.experienceIcon}>
                              <Icon name="user" size={20} />
                            </span>
                            <span className={styles.experienceRadio} />
                          </div>
                          <strong>Principiante</strong>
                          <small>
                            Iniciando en Wall Street · Instrumentos de menor
                            volatilidad, ETFs y herramientas de aprendizaje.
                          </small>
                        </button>

                        <button
                          type="button"
                          role="radio"
                          aria-checked={investorLevel === 'experienced'}
                          onClick={() =>
                            setInvestorLevel((prev) =>
                              prev === 'experienced' ? '' : 'experienced',
                            )
                          }
                          className={`${styles.experienceCard} ${investorLevel === 'experienced' ? styles.experienceCardActive : ''}`}
                        >
                          <div className={styles.experienceCardTop}>
                            <span className={styles.experienceIcon}>
                              <Icon name="trend" size={20} />
                            </span>
                            <span className={styles.experienceRadio} />
                          </div>
                          <strong>Con experiencia</strong>
                          <small>
                            Operación activa en NYSE / NASDAQ · Órdenes
                            avanzadas (Limit, Stop Loss, Take Profit) y análisis
                            bursátil.
                          </small>
                        </button>
                      </div>
                    </div>

                    <div className={`${styles.field} ${styles.fullWidth}`}>
                      <div className={styles.sectorHeaderRow}>
                        <label
                          className={styles.sectionBlockTitle}
                          htmlFor="interests_input"
                        >
                          2. Intereses (opcional)
                        </label>
                        <span className={styles.sectorCounterBadge}>
                          {selectedInterests.length}{' '}
                          {selectedInterests.length === 1
                            ? 'seleccionado'
                            : 'seleccionados'}
                        </span>
                      </div>

                      <div
                        className={styles.interestCatalogGrid}
                        role="group"
                        aria-label="Catálogo de sectores bursátiles"
                      >
                        {marketInterestsCatalog.map((item, idx) => {
                          const isSelected = selectedInterests.includes(
                            item.value,
                          );
                          const { title, subtitle } = splitSectorLabel(item);
                          const iconName =
                            SECTOR_ICONS[idx % SECTOR_ICONS.length] ?? 'trend';
                          return (
                            <button
                              key={item.value}
                              type="button"
                              aria-pressed={isSelected}
                              onClick={() =>
                                toggleInterestSelection(item.value)
                              }
                              className={`${styles.interestCard} ${isSelected ? styles.interestCardActive : ''}`}
                            >
                              <div className={styles.interestCardTop}>
                                <span className={styles.interestSectorIcon}>
                                  <Icon name={iconName} size={18} />
                                </span>
                                <span className={styles.interestCheckBadge}>
                                  {isSelected ? '✓' : '+'}
                                </span>
                              </div>
                              <strong className={styles.interestCardTitle}>
                                {title}
                              </strong>
                              <span className={styles.interestCardTickers}>
                                {subtitle}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      <div className={styles.customInterestsWrap}>
                        <textarea
                          id="interests_input"
                          name="interests"
                          rows={1}
                          className={styles.customInterestsBox}
                          placeholder="¿Tienes algún otro sector o activo de interés? Escríbelo aquí (opcional)…"
                          aria-describedby="interests-help"
                        />
                      </div>
                      <small id="interests-help" className={styles.fieldHelp}>
                        Selecciona uno o varios sectores arriba o escribe
                        intereses personalizados adicionales.
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

                  <div className={styles.servicesSection}>
                    <span className={styles.sectionBlockTitle}>
                      3. Servicios Adicionales y Acompañamiento
                    </span>
                    <div className={styles.servicesGrid}>
                      <label
                        className={`${styles.check} ${styles.serviceCard}`}
                      >
                        <div className={styles.serviceCardHeader}>
                          <span className={styles.serviceCardIcon}>
                            <Icon name="file" size={18} />
                          </span>
                          <input type="checkbox" name="monthly_report" />
                        </div>
                        <div className={styles.serviceCardBody}>
                          <strong>Recibir el informe mensual</strong>
                          <small>
                            Resumen ejecutivo del mercado estadounidense
                            (S&amp;P 500 y NASDAQ).
                          </small>
                        </div>
                        <em className={styles.serviceCardTagAccent}>
                          Incluido en simulación
                        </em>
                      </label>

                      <label
                        className={`${styles.check} ${styles.serviceCard}`}
                      >
                        <div className={styles.serviceCardHeader}>
                          <span className={styles.serviceCardIcon}>
                            <Icon name="users" size={18} />
                          </span>
                          <input type="checkbox" name="broker_requested" />
                        </div>
                        <div className={styles.serviceCardBody}>
                          <strong>
                            Solicitar acompañamiento de un comisionista
                          </strong>
                          <small>
                            Asesoría personalizada para estructurar tu
                            portafolio en USD.
                          </small>
                        </div>
                        <em className={styles.serviceCardTagMuted}>Opcional</em>
                      </label>

                      <label
                        className={`${styles.check} ${styles.serviceCard}`}
                      >
                        <div className={styles.serviceCardHeader}>
                          <span className={styles.serviceCardIcon}>
                            <Icon name="star" size={18} />
                          </span>
                          <input type="checkbox" name="premium_requested" />
                        </div>
                        <div className={styles.serviceCardBody}>
                          <strong>Solicitar el plan prémium</strong>
                          <small>
                            Acceso a listas de seguimiento avanzadas y alertas
                            de precio en tiempo real.
                          </small>
                        </div>
                        <em className={styles.serviceCardTagAccent}>
                          Simulación Pro
                        </em>
                      </label>
                    </div>
                  </div>
                </fieldset>

                {!broker && (
                  <KycFields step={step} country={country} disabled={busy} />
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

          <dialog ref={termsDialog} className={styles.termsDialog}>
            <h2>Términos y Condiciones · Acciones UD</h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
              Plataforma de simulación bursátil educativa en mercados de EE. UU.
              (NYSE, NASDAQ y NYSE Arca):
            </p>
            <ul className={styles.termsList}>
              <li>
                <strong>1. Naturaleza de Simulación (Paper Trading):</strong>{' '}
                Todos los fondos, saldos y órdenes operan en un entorno virtual
                de práctica y aprendizaje cuantitativo. No se captan recursos
                del público ni se compromete dinero real.
              </li>
              <li>
                <strong>
                  2. Tratamiento de Datos (Habeas Data - Ley 1581 de 2012):
                </strong>{' '}
                Tu información personal (nombres, correo, teléfono y país) se
                almacena bajo estándares de cifrado y se usa exclusivamente para
                fines de autenticación, control de sesiones y trazabilidad
                académica en la Universidad Distrital Francisco José de Caldas.
              </li>
              <li>
                <strong>3. Autenticación en Dos Pasos (2FA / TOTP):</strong> Es
                obligatorio configurar un autenticador móvil basado en tiempo
                (TOTP de 30 segundos) y resguardar los códigos de recuperación
                para la protección de tu cuenta.
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
      </div>
    </>
  );
}
