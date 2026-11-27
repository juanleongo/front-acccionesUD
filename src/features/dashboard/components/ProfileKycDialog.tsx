'use client';

import type { FormEvent, RefObject } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LoadingState } from '@/components/ui/LoadingState';
import { PersonalProfileForm } from './PersonalProfileForm';
import { getInterestOptions, type PersonalProfile } from '../user-api';
import { Icon } from '@/components/ui/Icon';
import { countries, CustomSelect, KycFields } from '@/features/registration';
import { useLocale } from '@/lib/i18n';
import {
  formatAccountStatusLabel,
  formatKycStatus,
  formatUserRoles,
} from '../dashboard-constants';
import type { KycStatus, UserProfile } from '../user-api';
import styles from '../dashboard.module.css';

export interface ProfileKycDialogProps {
  dialogRef: RefObject<HTMLDialogElement | null>;
  user: UserProfile | undefined;
  kycData: KycStatus | undefined;
  hasRealAccount: boolean;
  userInitials: string;
  displayName: string;
  profileTab: 'info' | 'edit' | 'kyc';
  editableLevel: 'beginner' | 'experienced';
  editableInterests: string[];
  savingPreferences: boolean;
  saveSuccess: string;
  saveError: string;
  kycModalStep: number;
  kycBusy: boolean;
  kycMsg: string;
  kycErr: string;
  onChangeProfileTab: (tab: 'info' | 'edit' | 'kyc') => void;
  onChangeEditableLevel: (level: 'beginner' | 'experienced') => void;
  onToggleInterest: (value: string) => void;
  onSavePreferences: (e: FormEvent) => void;
  onChangeKycStep: (step: number) => void;
  onClearKycError: () => void;
  onSubmitKyc: (e: FormEvent<HTMLFormElement>) => void;
  onLogout: () => void;
  onPersonalProfileSaved: (profile: PersonalProfile) => void;
}

export function ProfileKycDialog({
  dialogRef,
  user,
  kycData,
  hasRealAccount,
  userInitials,
  displayName,
  profileTab,
  editableLevel,
  editableInterests,
  savingPreferences,
  saveSuccess,
  saveError,
  kycModalStep,
  kycBusy,
  kycMsg,
  kycErr,
  onChangeProfileTab,
  onChangeEditableLevel,
  onToggleInterest,
  onSavePreferences,
  onChangeKycStep,
  onClearKycError,
  onSubmitKyc,
  onLogout,
  onPersonalProfileSaved,
}: ProfileKycDialogProps) {
  const { locale, tx } = useLocale();
  const catalog = useQuery({
    queryKey: ['users', 'interest-options'],
    queryFn: ({ signal }) => getInterestOptions(signal),
    enabled: profileTab === 'edit',
    staleTime: 300_000,
    retry: false,
  });
  const countryName = user?.country
    ? (countries.find((c) => c.code === user.country)?.name ?? user.country)
    : '—';

  const accountStatusLabel = formatAccountStatusLabel(
    user?.account_status,
    locale,
  );

  return (
    <dialog ref={dialogRef} className={styles.profileDialog}>
      <form method="dialog">
        <button
          className={styles.modalCloseBtn}
          aria-label={tx('Cerrar ventana', 'Close dialog')}
        >
          <Icon name="close" size={16} />
        </button>
      </form>

      <div className={styles.profileHeader}>
        <div className={styles.profileAvatarLarge}>{userInitials}</div>
        <div className={styles.profileNameArea}>
          <h2>{displayName}</h2>
          <div className={styles.profileBadges}>
            <span className={styles.profileBadgeActive}>
              {tx(
                `Cuenta ${accountStatusLabel}`,
                `${accountStatusLabel} Account`,
              )}
            </span>
            <span className={styles.profileBadgeRole}>
              {formatUserRoles(user?.roles, locale)}
            </span>
          </div>
        </div>
      </div>

      <div className={styles.profileTabs}>
        <button
          type="button"
          className={`${styles.profileTab} ${profileTab === 'info' ? styles.profileTabActive : ''}`}
          aria-pressed={profileTab === 'info'}
          onClick={() => onChangeProfileTab('info')}
        >
          {tx('Datos & Seguridad', 'Profile & Security')}
        </button>
        <button
          type="button"
          className={`${styles.profileTab} ${profileTab === 'edit' ? styles.profileTabActive : ''}`}
          aria-pressed={profileTab === 'edit'}
          onClick={() => onChangeProfileTab('edit')}
        >
          {tx('Editar Intereses & Nivel', 'Edit Interests & Level')}
        </button>
        <button
          type="button"
          className={`${styles.profileTab} ${profileTab === 'kyc' ? styles.profileTabActive : ''}`}
          aria-pressed={profileTab === 'kyc'}
          onClick={() => onChangeProfileTab('kyc')}
        >
          {tx('Trámite KYC', 'KYC Verification')}{' '}
          {hasRealAccount ? '✓' : tx('· Pendiente', '· Pending')}
        </button>
      </div>

      {profileTab === 'info' ? (
        <>
          {user && (
            <PersonalProfileForm
              user={user}
              locked={
                hasRealAccount ||
                Boolean(
                  kycData?.has_account || kycData?.status || user.kyc_status,
                )
              }
              onSaved={onPersonalProfileSaved}
            />
          )}
          <div className={styles.profileCardsGrid}>
            <div className={styles.profileCard}>
              <span className={styles.profileCardTitle}>
                {tx('Correo Electrónico', 'Email Address')}
              </span>
              <span className={styles.profileCardValue}>
                {user?.email ?? '—'}
              </span>
            </div>

            <div className={styles.profileCard}>
              <span className={styles.profileCardTitle}>
                {tx('Teléfono de Contacto', 'Contact Phone')}
              </span>
              <span className={styles.profileCardValue}>
                {user?.phone ?? '—'}
              </span>
            </div>

            <div className={styles.profileCard}>
              <span className={styles.profileCardTitle}>
                {tx('País de Residencia', 'Country of Residence')}
              </span>
              <span className={styles.profileCardValue}>{countryName}</span>
            </div>

            <div className={styles.profileCard}>
              <span className={styles.profileCardTitle}>
                {tx('Nivel de Inversor', 'Investor Level')}
              </span>
              <span className={styles.profileCardValue}>
                {user?.investor_level === 'experienced'
                  ? tx(
                      'Con experiencia (Wall Street)',
                      'Experienced (Wall Street)',
                    )
                  : tx('Principiante (Formación)', 'Beginner (Learning mode)')}
              </span>
            </div>

            <div className={styles.profileCard}>
              <span className={styles.profileCardTitle}>
                {tx('Estado KYC / Identidad', 'KYC / Identity Status')}
              </span>
              <span className={styles.profileCardValue}>
                {formatKycStatus(
                  kycData?.status ?? user?.kyc_status,
                  hasRealAccount,
                  locale,
                )}
              </span>
            </div>

            <div className={styles.profileCard}>
              <span className={styles.profileCardTitle}>
                {tx('Seguridad 2FA / MFA', '2FA / MFA Security')}
              </span>
              <span className={styles.profileCardValue}>
                <span
                  className={
                    user?.mfa_enrolled
                      ? styles.badgeActiveSimple
                      : styles.badgeInactiveSimple
                  }
                >
                  {user?.mfa_enrolled
                    ? tx('● Activa', '● Active')
                    : tx('○ Inactiva', '○ Inactive')}
                </span>
              </span>
            </div>
          </div>

          {!hasRealAccount && !kycMsg && (
            <div className={styles.kycInlineCallout}>
              <span>
                {tx(
                  'Tu verificación de identidad KYC aún está pendiente de envío.',
                  'Your KYC identity verification has not been submitted yet.',
                )}
              </span>
              <button
                type="button"
                className={styles.primary}
                onClick={() => {
                  onChangeKycStep(2);
                  onChangeProfileTab('kyc');
                }}
              >
                {tx('Completar formulario KYC →', 'Complete KYC form →')}
              </button>
            </div>
          )}

          <div className={styles.profileInterestsSection}>
            <span className={styles.profileCardTitle}>
              {tx(
                'Sectores de Interés Bursátil Registrados',
                'Saved Market Sectors of Interest',
              )}
            </span>
            <div className={styles.interestsChips}>
              {user?.interests && user.interests.length > 0 ? (
                user.interests.map((interest) => (
                  <span key={interest} className={styles.interestTag}>
                    {interest}
                  </span>
                ))
              ) : (
                <span className={styles.emptyInterestsText}>
                  {tx(
                    'No has seleccionado sectores de interés aún.',
                    'You have not selected any sectors of interest yet.',
                  )}
                </span>
              )}
            </div>
          </div>

          <p className={styles.profileBackendHint}>
            {tx(
              'Tus datos de identificación personal están protegidos bajo tu perfil de custodia. Puedes actualizar tu nivel de experiencia, tus sectores de interés o completar tu verificación KYC en las pestañas superiores.',
              'Your personal identification records are protected under your custody profile. You can update your experience level, market interests, or complete your KYC application using the tabs above.',
            )}
          </p>
        </>
      ) : profileTab === 'edit' ? (
        <div className={styles.editorSection}>
          {catalog.isPending && (
            <LoadingState
              mode="compact"
              label={tx(
                'Consultando intereses disponibles…',
                'Loading available interests…',
              )}
            />
          )}
          {catalog.isError && (
            <p className={styles.profileErrorMessage} role="alert">
              {tx(
                'No pudimos consultar los intereses.',
                'Could not load interests.',
              )}{' '}
              <button
                type="button"
                className={styles.secondary}
                onClick={() => void catalog.refetch()}
              >
                {tx('Reintentar', 'Retry')}
              </button>
            </p>
          )}
          {saveSuccess && (
            <p className={styles.profileSuccessMessage} role="status">
              {saveSuccess}
            </p>
          )}
          {saveError && (
            <p className={styles.profileErrorMessage} role="alert">
              {saveError}
            </p>
          )}

          <div className={styles.editorField}>
            <label
              className={styles.editorLabel}
              htmlFor="profile_investor_level"
            >
              {tx('Nivel de Inversor', 'Investor Level')}
            </label>
            <span className={styles.editorHelp}>
              {tx(
                'El nivel principiante activa las guías didácticas y filtra instrumentos de alto riesgo en Wall Street.',
                'Beginner mode enables guided tooltips and filters high-risk Wall Street instruments.',
              )}
            </span>
            <CustomSelect
              id="profile_investor_level"
              name="investor_level"
              options={[
                {
                  value: 'beginner',
                  label: tx(
                    'Principiante (Con guías didácticas de apoyo)',
                    'Beginner (With guided learning tooltips)',
                  ),
                },
                {
                  value: 'experienced',
                  label: tx(
                    'Con experiencia (Operación activa sin restricciones)',
                    'Experienced (Full unrestricted trading access)',
                  ),
                },
              ]}
              value={editableLevel}
              onChange={(next) =>
                onChangeEditableLevel(next as 'beginner' | 'experienced')
              }
              searchable={false}
            />
          </div>

          <div className={styles.editorField}>
            <span id="profile-exchanges-label" className={styles.editorLabel}>
              {tx(
                'Mercados Bursátiles Principales de EE. UU.',
                'Primary U.S. Stock Exchanges',
              )}
            </span>
            <span className={styles.editorHelp}>
              {tx(
                'Selecciona las bolsas de valores que deseas priorizar en tu panel:',
                'Choose the stock exchanges to highlight in your workspace:',
              )}
            </span>
            <div
              role="group"
              aria-labelledby="profile-exchanges-label"
              className={`${styles.chipsGrid} ${styles.chipsGridSpaced}`}
            >
              {(catalog.data?.markets ?? []).map((mkt) => {
                const isSelected = editableInterests.includes(mkt);
                return (
                  <button
                    key={mkt}
                    type="button"
                    aria-pressed={isSelected}
                    className={`${styles.chipBtn} ${isSelected ? styles.chipBtnSelected : ''}`}
                    onClick={() => onToggleInterest(mkt)}
                  >
                    <span>{isSelected ? '✓' : '+'}</span> {mkt}
                  </button>
                );
              })}
            </div>

            <span id="profile-sectors-label" className={styles.editorLabel}>
              {tx(
                'Sectores Bursátiles de Interés',
                'Stock Sectors of Interest',
              )}
            </span>
            <span className={styles.editorHelp}>
              {tx(
                `Seleccionados: ${editableInterests.length} de 20 permitidos`,
                `Selected: ${editableInterests.length} of 20 maximum`,
              )}
            </span>
            <div
              role="group"
              aria-labelledby="profile-sectors-label"
              className={styles.chipsGrid}
            >
              {(catalog.data?.sectors ?? []).map((cat) => {
                const isSelected = editableInterests.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    aria-pressed={isSelected}
                    className={`${styles.chipBtn} ${isSelected ? styles.chipBtnSelected : ''}`}
                    onClick={() => onToggleInterest(cat)}
                  >
                    <span>{isSelected ? '✓' : '+'}</span> {cat}
                  </button>
                );
              })}
            </div>
          </div>

          <div className={styles.editorActions}>
            <button
              type="button"
              className={styles.primary}
              disabled={savingPreferences}
              onClick={onSavePreferences}
            >
              {savingPreferences
                ? tx('Guardando…', 'Saving…')
                : tx(
                    'Guardar Preferencias en Cuenta',
                    'Save Account Preferences',
                  )}
            </button>
            <button
              type="button"
              className={styles.chipBtn}
              onClick={() => onChangeProfileTab('info')}
            >
              {tx('Ver datos', 'View profile')}
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.editorSection}>
          {hasRealAccount || Boolean(kycMsg) ? (
            <>
              <div className={styles.profileSuccessMessage} role="status">
                <strong>
                  {kycMsg ||
                    tx(
                      '✓ Tu verificación KYC ya fue radicada.',
                      '✓ Your KYC verification has been submitted.',
                    )}
                </strong>{' '}
                {tx('Estado actual:', 'Current status:')}{' '}
                {formatKycStatus(
                  kycData?.status ?? user?.kyc_status,
                  true,
                  locale,
                )}
                .
              </div>
              <div className={styles.kycModalActions}>
                <button
                  type="button"
                  className={styles.primary}
                  onClick={() => onChangeProfileTab('info')}
                >
                  {tx(
                    'Ver resumen de mi perfil →',
                    'View my profile summary →',
                  )}
                </button>
              </div>
            </>
          ) : (
            <form
              className={styles.kycModalForm}
              onSubmit={onSubmitKyc}
              noValidate
            >
              {kycMsg && (
                <p className={styles.profileSuccessMessage} role="status">
                  {kycMsg}
                </p>
              )}
              {kycErr && (
                <p className={styles.profileErrorMessage} role="alert">
                  {kycErr}
                </p>
              )}
              <div className={styles.kycStepPills}>
                <span
                  className={
                    kycModalStep === 2 ? styles.kycStepActive : styles.kycStep
                  }
                >
                  {tx('1. Identidad y domicilio', '1. Identity & address')}
                </span>
                <span
                  className={
                    kycModalStep === 3 ? styles.kycStepActive : styles.kycStep
                  }
                >
                  {tx('2. Perfil financiero', '2. Financial profile')}
                </span>
                <span
                  className={
                    kycModalStep === 4 ? styles.kycStepActive : styles.kycStep
                  }
                >
                  {tx('3. Acuerdos de corretaje', '3. Brokerage agreements')}
                </span>
              </div>

              <KycFields
                key={user?.country ?? 'CO'}
                step={kycModalStep}
                country={user?.country ?? 'CO'}
                disabled={kycBusy}
              />

              <div className={styles.kycModalActions}>
                {kycModalStep > 2 && (
                  <button
                    type="button"
                    className={styles.chipBtn}
                    disabled={kycBusy}
                    onClick={() => {
                      onClearKycError();
                      onChangeKycStep(kycModalStep - 1);
                    }}
                  >
                    {tx('← Anterior', '← Previous')}
                  </button>
                )}
                <button
                  type="submit"
                  className={styles.primary}
                  disabled={kycBusy}
                >
                  {kycBusy
                    ? tx('Enviando solicitud…', 'Submitting application…')
                    : kycModalStep < 4
                      ? tx('Continuar →', 'Continue →')
                      : tx('Radicar solicitud KYC', 'Submit KYC application')}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      <div className={styles.profileDialogActions}>
        <button
          type="button"
          className={styles.logoutActionBtn}
          onClick={onLogout}
        >
          {tx('Cerrar Sesión', 'Sign Out')}
        </button>
      </div>
    </dialog>
  );
}
