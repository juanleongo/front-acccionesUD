'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { browserHttp } from '@/lib/api/client';
import { ApiError } from '@/lib/api';
import { LoginForm, startLogin, type Challenge } from '@/features/login';
import { countries } from './countries';
import {
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

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const body = readRegistration(new FormData(form), kind);
    if (
      body.interests.length > 20 ||
      body.interests.some((i) => [...i].length > 50)
    ) {
      setError('Escribe hasta 20 intereses de máximo 50 caracteres cada uno.');
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
    <main className={styles.page}>
      <Link href="/" className={styles.back}>
        ← Volver a Acciones UD
      </Link>
      {status ? (
        <section role="status" className={styles.panel}>
          <h1>
            {status === 'active' ? 'Cuenta creada' : 'Solicitud recibida'}
          </h1>
          {error ? (
            <>
              <p>{error}</p>
              <Link href="/login">Iniciar sesión</Link>
            </>
          ) : (
            <p>Preparando la verificación en dos pasos…</p>
          )}
        </section>
      ) : (
        <>
          <h1>Crear cuenta</h1>
          <nav className={styles.kinds} aria-label="Tipo de cuenta">
            <Link href="/registro" aria-current={!broker ? 'page' : undefined}>
              Inversionista
            </Link>
            <Link
              href="/registro/broker"
              aria-current={broker ? 'page' : undefined}
            >
              Comisionista
            </Link>
          </nav>
          <form method="post" className={styles.panel} onSubmit={submit}>
            <fieldset disabled={busy}>
              <legend>Datos personales</legend>
              <div className={styles.grid}>
                <label>
                  Nombres
                  <input
                    name="first_names"
                    autoComplete="given-name"
                    maxLength={100}
                    required
                    pattern={'.*\\S.*'}
                  />
                </label>
                <label>
                  Apellidos
                  <input
                    name="last_names"
                    autoComplete="family-name"
                    maxLength={100}
                    required
                    pattern={'.*\\S.*'}
                  />
                </label>
                <label>
                  Correo electrónico
                  <input
                    type="email"
                    name="email"
                    autoComplete="email"
                    maxLength={254}
                    required
                  />
                </label>
                <label>
                  Teléfono con indicativo
                  <input
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="+573001234567"
                    pattern={'\\+[1-9][0-9]{1,14}'}
                    title="Incluye + y el indicativo del país, sin espacios."
                    required
                  />
                </label>
                <label>
                  País
                  <select
                    name="country"
                    defaultValue=""
                    autoComplete="country"
                    required
                  >
                    <option value="" disabled>
                      Selecciona tu país
                    </option>
                    {countries.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Contraseña
                  <input
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    maxLength={128}
                    required
                    pattern={'(?=.*\\p{L})(?=.*\\p{N}).+'}
                    aria-describedby="password-help"
                  />
                  <small id="password-help">
                    De 8 a 128 caracteres, con una letra y un dígito.
                  </small>
                </label>
              </div>
            </fieldset>
            {broker && (
              <fieldset disabled={busy}>
                <legend>Datos profesionales</legend>
                <div className={styles.grid}>
                  <label>
                    Nombre de la firma
                    <input
                      name="firm_name"
                      autoComplete="organization"
                      maxLength={200}
                      required
                      pattern={'.*\\S.*'}
                    />
                  </label>
                  <label>
                    Número de licencia profesional
                    <input
                      name="license_number"
                      maxLength={50}
                      required
                      pattern={'.*\\S.*'}
                    />
                  </label>
                </div>
              </fieldset>
            )}
            <fieldset disabled={busy}>
              <legend>Preferencias</legend>
              <label>
                Nivel de experiencia (opcional)
                <select name="investor_level" defaultValue="">
                  <option value="">Sin especificar</option>
                  <option value="beginner">Principiante</option>
                  <option value="experienced">Con experiencia</option>
                </select>
              </label>
              <label>
                Intereses (opcional)
                <textarea
                  name="interests"
                  rows={2}
                  aria-describedby="interests-help"
                />
                <small id="interests-help">
                  Uno por línea, hasta 20 intereses de 50 caracteres cada uno.
                </small>
              </label>
              <label className={styles.check}>
                <input type="checkbox" name="monthly_report" />
                Recibir el informe mensual
              </label>
              <label className={styles.check}>
                <input type="checkbox" name="broker_requested" />
                Solicitar acompañamiento de un comisionista
              </label>
              <label className={styles.check}>
                <input type="checkbox" name="premium_requested" />
                Solicitar el plan prémium
              </label>
            </fieldset>
            <label className={styles.check}>
              <input
                disabled={busy}
                type="checkbox"
                name="terms_accepted"
                required
              />
              Acepto los términos y condiciones
            </label>
            {error && (
              <p className={styles.error} role="alert">
                {error}
              </p>
            )}
            <button type="submit" disabled={busy}>
              {busy
                ? 'Enviando…'
                : broker
                  ? 'Solicitar registro de comisionista'
                  : 'Crear cuenta de inversionista'}
            </button>
          </form>
        </>
      )}
    </main>
  );
}
