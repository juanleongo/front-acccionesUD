'use client';

import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LoadingState } from '@/components/ui/LoadingState';
import { getLocations } from './locations-api';
import { Icon } from '@/components/ui/Icon';
import { BirthDatePicker } from './components/BirthDatePicker';
import { CustomSelect } from './components/CustomSelect';
import {
  FUNDING_SOURCES,
  KYC_AGREEMENTS_CATALOG,
  RANGE_OPTIONS,
  type AgreementKey,
} from './kyc-catalog';
import styles from './registration.module.css';

export {
  formatKycSubmissionError,
  readKyc,
  validateBirthDateAge,
} from './kyc-catalog';

const rangeSelectOptions = RANGE_OPTIONS.map((opt) => ({
  value: opt.code,
  label: opt.label,
}));

const yesNoOptions = [
  { value: 'no', label: 'No' },
  { value: 'yes', label: 'Sí' },
] as const;

export function KycFields({
  step,
  country,
  disabled,
}: {
  step: number;
  country: string;
  disabled: boolean;
}) {
  const activeCountry = country || 'CO';
  const [taxIdType, setTaxIdType] = useState('COL_NIT');
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [dob, setDob] = useState('');

  const [employmentStatus, setEmploymentStatus] = useState('employed');
  const [annualIncome, setAnnualIncome] = useState('RANGE_1');
  const [totalNetWorth, setTotalNetWorth] = useState('RANGE_2');
  const [liquidNetWorth, setLiquidNetWorth] = useState('RANGE_1');

  const [isControlPerson, setIsControlPerson] = useState('no');
  const [isFinra, setIsFinra] = useState('no');
  const [isPep, setIsPep] = useState('no');
  const [isFamilyPep, setIsFamilyPep] = useState('no');

  const [activeAgreementModal, setActiveAgreementModal] =
    useState<AgreementKey | null>(null);
  const agreementDialogRef = useRef<HTMLDialogElement>(null);

  const regionsQuery = useQuery({
    queryKey: ['locations', activeCountry],
    queryFn: ({ signal }) => getLocations(activeCountry, signal),
    staleTime: 86_400_000,
    enabled: step === 2,
  });
  const states = regionsQuery.data?.states ?? [];
  const activeState = states.find((state) => state.code === selectedState);
  const citiesQuery = useQuery({
    queryKey: ['locations', activeCountry, activeState?.code],
    queryFn: ({ signal }) =>
      getLocations(activeCountry, signal, activeState?.code),
    staleTime: 86_400_000,
    enabled: step === 2 && Boolean(activeState),
  });
  const cities = citiesQuery.data?.cities ?? [];

  const taxIdOptions =
    activeCountry === 'CO'
      ? [
          { value: 'COL_NIT', label: 'Cédula de ciudadanía / NIT' },
          { value: 'PASSPORT', label: 'Pasaporte' },
        ]
      : activeCountry === 'US'
        ? [
            { value: 'USA_SSN', label: 'Número de Seguro Social (SSN)' },
            { value: 'PASSPORT', label: 'Pasaporte' },
          ]
        : [
            {
              value: 'NATIONAL_ID',
              label: 'Documento Nacional de Identidad',
            },
            { value: 'PASSPORT', label: 'Pasaporte' },
            {
              value: 'COL_NIT',
              label: 'Cédula de ciudadanía / NIT (Colombia)',
            },
          ];

  const effectiveTaxIdType = taxIdOptions.some((o) => o.value === taxIdType)
    ? taxIdType
    : (taxIdOptions[0]?.value ?? 'COL_NIT');

  const isPassport = effectiveTaxIdType === 'PASSPORT';

  function openAgreementModal(key: AgreementKey) {
    setActiveAgreementModal(key);
    agreementDialogRef.current?.showModal();
  }

  const selectedAgreementDoc = KYC_AGREEMENTS_CATALOG.find(
    (item) => item.key === activeAgreementModal,
  );

  const stateOptions = states.map((st) => ({
    value: st.code,
    label: st.name,
  }));

  const cityOptions = cities.map((ct) => ({
    value: ct,
    label: ct,
  }));

  return (
    <div className={styles.kycScope}>
      <fieldset data-kyc-fields hidden={step !== 2} disabled={disabled}>
        <legend>
          <Icon name="shield" size={18} /> Identidad y domicilio
        </legend>
        <div className={styles.grid}>
          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="kyc_tax_id_type">
              Tipo de identificación fiscal
            </label>
            <div className={styles.fieldControl}>
              <CustomSelect
                id="kyc_tax_id_type"
                name="tax_id_type"
                options={taxIdOptions}
                value={effectiveTaxIdType}
                onChange={setTaxIdType}
                required
                disabled={disabled}
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="kyc_tax_id">
              {isPassport ? 'Número de pasaporte' : 'Número de documento'}
            </label>
            <div className={styles.fieldControl}>
              <input
                id="kyc_tax_id"
                name="tax_id"
                placeholder={
                  isPassport
                    ? 'Ej. PA1234567 (letras y números)'
                    : 'Ej. 1005753821'
                }
                pattern={isPassport ? '[A-Za-z0-9\\-]{4,25}' : '[0-9\\-]{4,20}'}
                minLength={4}
                maxLength={100}
                required
              />
            </div>
            <small className={styles.fieldHelp}>
              {isPassport
                ? 'Pasaporte alfanumérico: incluye las letras iniciales y los números (ej. PA1234567).'
                : 'Ingresa los dígitos de tu documento sin puntos ni espacios.'}
            </small>
          </div>

          <BirthDatePicker value={dob} onChange={setDob} />

          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="kyc_postal_code">
              Código postal
            </label>
            <div className={styles.fieldControl}>
              <input
                id="kyc_postal_code"
                name="postal_code"
                placeholder="Ej. 110111"
                maxLength={20}
                required
              />
            </div>
          </div>

          <div className={`${styles.field} ${styles.fullWidth}`}>
            <label className={styles.fieldLabel} htmlFor="kyc_street_address">
              Dirección de residencia
            </label>
            <div className={styles.fieldControl}>
              <input
                id="kyc_street_address"
                name="street_address"
                placeholder="Ej. Calle 40 # 7-19"
                maxLength={200}
                required
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="kyc_state">
              Departamento, estado o provincia
            </label>
            <div className={styles.fieldControl}>
              <CustomSelect
                id="kyc_state"
                name="state"
                options={stateOptions}
                value={activeState?.code ?? ''}
                onChange={(nextState) => {
                  setSelectedState(nextState);
                  setSelectedCity('');
                }}
                placeholder="Selecciona una región"
                required
                disabled={disabled}
              />
              <input
                type="hidden"
                name="state_name"
                value={activeState?.name ?? ''}
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="kyc_city">
              Ciudad
            </label>
            <div className={styles.fieldControl}>
              <CustomSelect
                id="kyc_city"
                name="city"
                options={cityOptions}
                value={cities.includes(selectedCity) ? selectedCity : ''}
                onChange={setSelectedCity}
                placeholder="Selecciona una ciudad"
                required
                disabled={disabled}
              />
            </div>
          </div>
        </div>
        {(regionsQuery.isFetching || citiesQuery.isFetching) && (
          <LoadingState mode="compact" label="Cargando regiones y ciudades…" />
        )}
        {(regionsQuery.error || citiesQuery.error) && (
          <div role="alert">
            No se pudo cargar el catálogo de ubicaciones.{' '}
            <button
              type="button"
              onClick={() => {
                if (regionsQuery.error) void regionsQuery.refetch();
                if (citiesQuery.error) void citiesQuery.refetch();
              }}
            >
              Reintentar
            </button>
          </div>
        )}
      </fieldset>

      <fieldset data-kyc-fields hidden={step !== 3} disabled={disabled}>
        <legend>
          <Icon name="pie" size={18} /> Perfil financiero (USD)
        </legend>
        <div className={styles.grid}>
          <div className={styles.field}>
            <label
              className={styles.fieldLabel}
              htmlFor="kyc_employment_status"
            >
              Situación laboral
            </label>
            <div className={styles.fieldControl}>
              <CustomSelect
                id="kyc_employment_status"
                name="employment_status"
                options={[
                  { value: 'employed', label: 'Empleado / Asalariado' },
                  { value: 'student', label: 'Estudiante' },
                  {
                    value: 'unemployed',
                    label: 'Independiente / Sin empleo',
                  },
                  { value: 'retired', label: 'Pensionado / Retirado' },
                ]}
                value={employmentStatus}
                onChange={setEmploymentStatus}
                required
                disabled={disabled}
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="kyc_annual_income">
              Ingreso anual estimado (USD)
            </label>
            <div className={styles.fieldControl}>
              <CustomSelect
                id="kyc_annual_income"
                name="annual_income_range"
                options={rangeSelectOptions}
                value={annualIncome}
                onChange={setAnnualIncome}
                required
                disabled={disabled}
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="kyc_total_net_worth">
              Patrimonio neto total (USD)
            </label>
            <div className={styles.fieldControl}>
              <CustomSelect
                id="kyc_total_net_worth"
                name="total_net_worth_range"
                options={rangeSelectOptions}
                value={totalNetWorth}
                onChange={setTotalNetWorth}
                required
                disabled={disabled}
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="kyc_liquid_net_worth">
              Patrimonio neto líquido (USD)
            </label>
            <div className={styles.fieldControl}>
              <CustomSelect
                id="kyc_liquid_net_worth"
                name="liquid_net_worth_range"
                options={rangeSelectOptions}
                value={liquidNetWorth}
                onChange={setLiquidNetWorth}
                required
                disabled={disabled}
              />
            </div>
          </div>

          <div className={styles.fundingSources}>
            <span className={`${styles.fieldLabel} ${styles.fullWidth}`}>
              Fuentes de fondos (selecciona al menos una)
            </span>
            {FUNDING_SOURCES.map((source) => (
              <label key={source.value} className={styles.check}>
                <input
                  type="checkbox"
                  name="funding_source"
                  value={source.value}
                />
                <span>{source.label}</span>
              </label>
            ))}
          </div>
        </div>
      </fieldset>

      <fieldset data-kyc-fields hidden={step !== 4} disabled={disabled}>
        <legend>
          <Icon name="check" size={18} /> Declaraciones regulatorias y acuerdos
        </legend>
        <div className={styles.grid}>
          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="kyc_control_person">
              ¿Eres directivo o accionista mayoritario (+10%) de una empresa en
              bolsa?
            </label>
            <div className={styles.fieldControl}>
              <CustomSelect
                id="kyc_control_person"
                name="is_control_person"
                options={yesNoOptions}
                value={isControlPerson}
                onChange={setIsControlPerson}
                disabled={disabled}
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="kyc_finra">
              ¿Trabajas en una bolsa de valores o entidad afiliada a FINRA?
            </label>
            <div className={styles.fieldControl}>
              <CustomSelect
                id="kyc_finra"
                name="is_affiliated_exchange_or_finra"
                options={yesNoOptions}
                value={isFinra}
                onChange={setIsFinra}
                disabled={disabled}
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="kyc_pep">
              ¿Eres una Persona Expuesta Políticamente (PEP)?
            </label>
            <div className={styles.fieldControl}>
              <CustomSelect
                id="kyc_pep"
                name="is_politically_exposed"
                options={yesNoOptions}
                value={isPep}
                onChange={setIsPep}
                disabled={disabled}
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="kyc_family_pep">
              ¿Tienes algún familiar directo expuesto políticamente?
            </label>
            <div className={styles.fieldControl}>
              <CustomSelect
                id="kyc_family_pep"
                name="immediate_family_exposed"
                options={yesNoOptions}
                value={isFamilyPep}
                onChange={setIsFamilyPep}
                disabled={disabled}
              />
            </div>
          </div>
        </div>

        <div className={styles.kycAgreementsSection}>
          <div className={styles.kycAgreementsHeader}>
            <span className={styles.stepSectionHeading}>
              Contratos de Custodia Bursátil (Alpaca Securities LLC &amp;
              Acciones UD)
            </span>
            <p className={styles.kycAgreementsIntro}>
              Para habilitar tu cuenta de corretaje en EE. UU., revisa cada
              acuerdo haciendo clic en <strong>Leer documento</strong> y marca
              tu aceptación:
            </p>
          </div>

          <div className={styles.kycAgreements}>
            {KYC_AGREEMENTS_CATALOG.map((item) => (
              <div key={item.key} className={styles.kycAgreementCard}>
                <div className={styles.kycAgreementMain}>
                  <label className={styles.kycAgreementCheckLabel}>
                    <input
                      type="checkbox"
                      name={item.key}
                      required={item.required}
                    />
                    <span>{item.checkboxLabel}</span>
                  </label>
                  <div className={styles.kycAgreementInfo}>
                    <div className={styles.kycAgreementTitleRow}>
                      <strong className={styles.stitchServiceTitle}>
                        {item.title}
                      </strong>
                      <span className={styles.stitchServiceBadge}>
                        {item.badge}
                      </span>
                    </div>
                    <p className={styles.stitchServiceDesc}>{item.summary}</p>
                  </div>
                </div>
                <button
                  type="button"
                  className={styles.kycReadBtn}
                  onClick={() => openAgreementModal(item.key)}
                >
                  Leer documento
                </button>
              </div>
            ))}
          </div>
        </div>
      </fieldset>

      <dialog
        ref={agreementDialogRef}
        className={styles.termsModal}
        aria-labelledby="kyc-agreement-modal-title"
        onClick={(e) => {
          if (e.target === agreementDialogRef.current) {
            agreementDialogRef.current.close();
          }
        }}
      >
        {selectedAgreementDoc ? (
          <div className={styles.termsModalInner}>
            <header className={styles.termsModalHeader}>
              <div>
                <span className={styles.termsBadge}>
                  {selectedAgreementDoc.badge}
                </span>
                <h2
                  id="kyc-agreement-modal-title"
                  className={styles.termsTitle}
                >
                  {selectedAgreementDoc.title}
                </h2>
              </div>
              <button
                type="button"
                className={styles.termsCloseBtn}
                onClick={() => agreementDialogRef.current?.close()}
                aria-label="Cerrar documento"
              >
                ✕
              </button>
            </header>
            <div className={styles.termsBody}>
              <p>{selectedAgreementDoc.summary}</p>
              {selectedAgreementDoc.clauses.map((clause) => (
                <div key={clause.heading}>
                  <h3>{clause.heading}</h3>
                  <p>{clause.body}</p>
                </div>
              ))}
            </div>
            <footer className={styles.termsFooter}>
              <button
                type="button"
                className={styles.primary}
                onClick={() => agreementDialogRef.current?.close()}
              >
                Entendido y cerrar
              </button>
            </footer>
          </div>
        ) : null}
      </dialog>
    </div>
  );
}
