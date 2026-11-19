'use client';

import type { FormEvent, RefObject } from 'react';
import { Icon } from '@/components/ui/Icon';
import {
  countries,
  CustomSelect,
  KycFields,
  marketInterestsCatalog,
} from '@/features/registration';
import {
  accountStatusLabels,
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
}: ProfileKycDialogProps) {
  const countryName = user?.country
    ? (countries.find((c) => c.code === user.country)?.name ?? user.country)
    : 'Colombia';

  const accountStatusLabel = user?.account_status
    ? (accountStatusLabels[user.account_status] ?? 'Activa')
    : 'Activa';

  return (
    <dialog ref={dialogRef} className={styles.profileDialog}>
      <form method="dialog">
        <button className={styles.modalCloseBtn} aria-label="Cerrar ventana">
          <Icon name="close" size={16} />
        </button>
      </form>

      <div className={styles.profileHeader}>
        <div className={styles.profileAvatarLarge}>{userInitials}</div>
        <div className={styles.profileNameArea}>
          <h2>{displayName}</h2>
          <div className={styles.profileBadges}>
            <span className={styles.profileBadgeActive}>
              Cuenta {accountStatusLabel}
            </span>
            <span className={styles.profileBadgeRole}>
              {formatUserRoles(user?.roles)}
            </span>
          </div>
        </div>
      </div>

      <div className={styles.profileTabs}>
        <button
          type="button"
          className={`${styles.profileTab} ${profileTab === 'info' ? styles.profileTabActive : ''}`}
          onClick={() => onChangeProfileTab('info')}
        >
          Datos &amp; Seguridad
        </button>
        <button
          type="button"
          className={`${styles.profileTab} ${profileTab === 'edit' ? styles.profileTabActive : ''}`}
          onClick={() => onChangeProfileTab('edit')}
        >
          Editar Intereses &amp; Nivel
        </button>
        <button
          type="button"
          className={`${styles.profileTab} ${profileTab === 'kyc' ? styles.profileTabActive : ''}`}
          onClick={() => onChangeProfileTab('kyc')}
        >
          Trámite KYC {hasRealAccount ? '✓' : '· Pendiente'}
        </button>
      </div>

      {profileTab === 'info' ? (
        <>
          <div className={styles.profileCardsGrid}>
            <div className={styles.profileCard}>
              <span className={styles.profileCardTitle}>
                Correo Electrónico
              </span>
              <span className={styles.profileCardValue}>
                {user?.email ?? 'correo@ejemplo.com'}
              </span>
            </div>

            <div className={styles.profileCard}>
              <span className={styles.profileCardTitle}>
                Teléfono de Contacto
              </span>
              <span className={styles.profileCardValue}>
                {user?.phone ?? '+57 300 000 0000'}
              </span>
            </div>

            <div className={styles.profileCard}>
              <span className={styles.profileCardTitle}>
                País de Residencia
              </span>
              <span className={styles.profileCardValue}>{countryName}</span>
            </div>

            <div className={styles.profileCard}>
              <span className={styles.profileCardTitle}>Nivel de Inversor</span>
              <span className={styles.profileCardValue}>
                {user?.investor_level === 'experienced'
                  ? 'Con experiencia (Wall Street)'
                  : 'Principiante (Formación)'}
              </span>
            </div>

            <div className={styles.profileCard}>
              <span className={styles.profileCardTitle}>
                Estado KYC / Identidad
              </span>
              <span className={styles.profileCardValue}>
                {formatKycStatus(
                  kycData?.status ?? user?.kyc_status,
                  hasRealAccount,
                )}
              </span>
            </div>

            <div className={styles.profileCard}>
              <span className={styles.profileCardTitle}>
                Seguridad 2FA / MFA
              </span>
              <span className={styles.profileCardValue}>
                <span
                  className={
                    user?.mfa_enrolled
                      ? styles.badgeActiveSimple
                      : styles.badgeInactiveSimple
                  }
                >
                  {user?.mfa_enrolled ? '● Activa' : '○ Inactiva'}
                </span>
              </span>
            </div>
          </div>

          {!hasRealAccount && !kycMsg && (
            <div className={styles.kycInlineCallout}>
              <span>
                Tu verificación de identidad KYC aún está pendiente de envío.
              </span>
              <button
                type="button"
                className={styles.primary}
                onClick={() => {
                  onChangeKycStep(2);
                  onChangeProfileTab('kyc');
                }}
              >
                Completar formulario KYC →
              </button>
            </div>
          )}

          <div className={styles.profileInterestsSection}>
            <span className={styles.profileCardTitle}>
              Sectores de Interés Bursátil Registrados
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
                  No has seleccionado sectores de interés aún.
                </span>
              )}
            </div>
          </div>

          <p className={styles.profileBackendHint}>
            Tus datos de identificación personal están protegidos bajo tu perfil
            de custodia. Puedes actualizar tu nivel de experiencia, tus sectores
            de interés o completar tu verificación KYC en las pestañas
            superiores.
          </p>
        </>
      ) : profileTab === 'edit' ? (
        <div className={styles.editorSection}>
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
              Nivel de Inversor
            </label>
            <span className={styles.editorHelp}>
              El nivel principiante activa las guías didácticas y filtra
              instrumentos de alto riesgo en Wall Street.
            </span>
            <CustomSelect
              id="profile_investor_level"
              name="investor_level"
              options={[
                {
                  value: 'beginner',
                  label: 'Principiante (Con guías didácticas de apoyo)',
                },
                {
                  value: 'experienced',
                  label: 'Con experiencia (Operación activa sin restricciones)',
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
            <label className={styles.editorLabel}>
              Mercados Bursátiles Principales de EE. UU.
            </label>
            <span className={styles.editorHelp}>
              Selecciona las bolsas de valores que deseas priorizar en tu panel:
            </span>
            <div className={`${styles.chipsGrid} ${styles.chipsGridSpaced}`}>
              {['NYSE', 'NASDAQ', 'AMEX'].map((mkt) => {
                const isSelected = editableInterests.includes(mkt);
                return (
                  <button
                    key={mkt}
                    type="button"
                    className={`${styles.chipBtn} ${isSelected ? styles.chipBtnSelected : ''}`}
                    onClick={() => onToggleInterest(mkt)}
                  >
                    <span>{isSelected ? '✓' : '+'}</span> {mkt}
                  </button>
                );
              })}
            </div>

            <label className={styles.editorLabel}>
              Sectores Bursátiles de Interés
            </label>
            <span className={styles.editorHelp}>
              Seleccionados: {editableInterests.length} de 20 permitidos
            </span>
            <div className={styles.chipsGrid}>
              {marketInterestsCatalog.map((cat) => {
                const isSelected = editableInterests.includes(cat.value);
                return (
                  <button
                    key={cat.value}
                    type="button"
                    className={`${styles.chipBtn} ${isSelected ? styles.chipBtnSelected : ''}`}
                    onClick={() => onToggleInterest(cat.value)}
                  >
                    <span>{isSelected ? '✓' : '+'}</span> {cat.value}
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
                ? 'Guardando…'
                : 'Guardar Preferencias en Cuenta'}
            </button>
            <button
              type="button"
              className={styles.chipBtn}
              onClick={() => onChangeProfileTab('info')}
            >
              Ver datos
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.editorSection}>
          {hasRealAccount || Boolean(kycMsg) ? (
            <>
              <div className={styles.profileSuccessMessage} role="status">
                <strong>
                  {kycMsg || '✓ Tu verificación KYC ya fue radicada.'}
                </strong>{' '}
                Estado actual:{' '}
                {formatKycStatus(kycData?.status ?? user?.kyc_status, true)}.
              </div>
              <div className={styles.kycModalActions}>
                <button
                  type="button"
                  className={styles.primary}
                  onClick={() => onChangeProfileTab('info')}
                >
                  Ver resumen de mi perfil →
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
                  1. Identidad y domicilio
                </span>
                <span
                  className={
                    kycModalStep === 3 ? styles.kycStepActive : styles.kycStep
                  }
                >
                  2. Perfil financiero
                </span>
                <span
                  className={
                    kycModalStep === 4 ? styles.kycStepActive : styles.kycStep
                  }
                >
                  3. Acuerdos de corretaje
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
                    ← Anterior
                  </button>
                )}
                <button
                  type="submit"
                  className={styles.primary}
                  disabled={kycBusy}
                >
                  {kycBusy
                    ? 'Enviando solicitud…'
                    : kycModalStep < 4
                      ? 'Continuar →'
                      : 'Radicar solicitud KYC'}
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
          Cerrar Sesión
        </button>
      </div>
    </dialog>
  );
}
