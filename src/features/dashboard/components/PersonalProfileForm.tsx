'use client';

import { useState, type FormEvent } from 'react';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { countries } from '@/features/registration';
import { ApiError } from '@/lib/api';
import { formatPersonName } from '@/lib/format-person-name';
import { useLocale } from '@/lib/i18n';
import {
  updatePersonalProfile,
  type PersonalProfile,
  type UserProfile,
} from '../user-api';
import styles from '../dashboard.module.css';
import ui from './personal-profile.module.css';

export function PersonalProfileForm({
  user,
  locked,
  onSaved,
}: {
  user: UserProfile;
  locked: boolean;
  onSaved: (profile: PersonalProfile) => void;
}) {
  const { locale, tx } = useLocale();
  const [draft, setDraft] = useState<PersonalProfile>({
    first_names: user.first_names,
    last_names: user.last_names,
    phone: user.phone,
    country: user.country,
  });
  const [busy, setBusy] = useState(false);
  const [serverLocked, setServerLocked] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const isLocked = locked || serverLocked;
  const names = new Intl.DisplayNames([locale], { type: 'region' });
  async function save(event: FormEvent) {
    event.preventDefault();
    if (busy || isLocked) return;
    setError('');
    setSuccess(false);
    const normalized = {
      ...draft,
      first_names: formatPersonName(draft.first_names),
      last_names: formatPersonName(draft.last_names),
      phone: draft.phone.trim(),
      country: draft.country.toUpperCase(),
    };
    if (
      !normalized.first_names ||
      !normalized.last_names ||
      !/^\+[1-9]\d{7,14}$/.test(normalized.phone) ||
      !countries.some((c) => c.code === normalized.country)
    ) {
      setError(
        tx(
          'Completa nombres, apellidos y país. El teléfono debe incluir + e indicativo, con 8 a 15 dígitos.',
          'Enter your names, surname and country. Phone must include + and country code, with 8 to 15 digits.',
        ),
      );
      return;
    }
    const changed = Object.fromEntries(
      Object.entries(normalized).filter(
        ([key, value]) => user[key as keyof PersonalProfile] !== value,
      ),
    );
    if (!Object.keys(changed).length) {
      setSuccess(true);
      return;
    }
    setBusy(true);
    try {
      const result = await updatePersonalProfile(changed);
      setDraft(result);
      onSaved(result);
      setSuccess(true);
    } catch (cause) {
      if (
        cause instanceof ApiError &&
        cause.metadata.code === 'PROFILE_KYC_LOCKED'
      )
        setServerLocked(true);
      setError(
        cause instanceof ApiError &&
          cause.metadata.code === 'PROFILE_KYC_LOCKED'
          ? tx(
              'La verificación de identidad ya comenzó. Tus datos personales están protegidos y no se pueden modificar aquí.',
              'Identity verification has already started. Your personal details are protected and cannot be edited here.',
            )
          : tx(
              'No pudimos guardar los datos. Revisa los campos e inténtalo de nuevo.',
              'Could not save your details. Check the fields and try again.',
            ),
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section
      className={ui.panel}
      aria-label={tx('Datos personales', 'Personal details')}
    >
      <h3 className={ui.title}>
        {tx('Tus datos personales', 'Your personal details')}
      </h3>
      <p className={ui.hint}>
        {isLocked
          ? tx(
              'La verificación de identidad ya comenzó. Estos datos quedan protegidos para mantener la identidad de tu cuenta.',
              'Identity verification has started. These details are protected to preserve your account identity.',
            )
          : tx(
              'Puedes corregir tus datos antes de iniciar la verificación de identidad. Guarda los cambios antes de continuar con KYC.',
              'You can correct your details before starting identity verification. Save changes before continuing to KYC.',
            )}
      </p>
      <form noValidate onSubmit={save}>
        <fieldset disabled={busy || isLocked} className={ui.fields}>
          {(['first_names', 'last_names', 'phone'] as const).map((key) => (
            <label className={ui.field} key={key} htmlFor={`personal-${key}`}>
              <span>
                {key === 'first_names'
                  ? tx('Nombres', 'Given names')
                  : key === 'last_names'
                    ? tx('Apellidos', 'Surnames')
                    : tx('Teléfono con indicativo', 'Phone with country code')}
              </span>
              <input
                id={`personal-${key}`}
                autoComplete={
                  key === 'phone'
                    ? 'tel'
                    : key === 'first_names'
                      ? 'given-name'
                      : 'family-name'
                }
                type={key === 'phone' ? 'tel' : 'text'}
                value={draft[key]}
                onChange={(e) => {
                  setDraft({ ...draft, [key]: e.target.value });
                  setSuccess(false);
                }}
              />
            </label>
          ))}
          <div className={ui.field}>
            <label htmlFor="personal-country">
              {tx('País de residencia', 'Country of residence')}
            </label>
            <CustomSelect
              id="personal-country"
              name="country"
              value={draft.country}
              onChange={(value) => {
                setDraft({ ...draft, country: value });
                setSuccess(false);
              }}
              options={countries.map((country) => ({
                value: country.code,
                label: names.of(country.code) ?? country.name,
              }))}
            />
          </div>
        </fieldset>
        {error && (
          <p className={styles.profileErrorMessage} role="alert">
            {error}
          </p>
        )}
        {success && (
          <p className={styles.profileSuccessMessage} role="status">
            {tx('Datos personales guardados.', 'Personal details saved.')}
          </p>
        )}
        {!isLocked && (
          <button type="submit" className={styles.primary} disabled={busy}>
            {busy
              ? tx('Guardando…', 'Saving…')
              : tx('Guardar datos personales', 'Save personal details')}
          </button>
        )}
      </form>
    </section>
  );
}
