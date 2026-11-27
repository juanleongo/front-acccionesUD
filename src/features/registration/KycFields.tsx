'use client';

import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LoadingState } from '@/components/ui/LoadingState';
import { Icon } from '@/components/ui/Icon';
import { useLocale } from '@/lib/i18n';
import { getLocations } from './locations-api';
import { BirthDatePicker } from './components/BirthDatePicker';
import { CustomSelect } from './components/CustomSelect';
import {
  getFundingSources,
  getKycAgreementsCatalog,
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

export function KycFields({
  step,
  country,
  disabled,
}: {
  step: number;
  country: string;
  disabled: boolean;
}) {
  const { locale, tx } = useLocale();
  const yesNoOptions = [
    { value: 'no', label: 'No' },
    { value: 'yes', label: tx('Sí', 'Yes') },
  ];
  const fundingSources = getFundingSources(locale);
  const agreementsCatalog = getKycAgreementsCatalog(locale);
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
          {
            value: 'COL_NIT',
            label: tx(
              'Cédula de ciudadanía / NIT',
              'National ID / Tax ID (CC / NIT)',
            ),
          },
          { value: 'PASSPORT', label: tx('Pasaporte', 'Passport') },
        ]
      : activeCountry === 'US'
        ? [
            {
              value: 'USA_SSN',
              label: tx(
                'Número de Seguro Social (SSN)',
                'Social Security Number (SSN)',
              ),
            },
            { value: 'PASSPORT', label: tx('Pasaporte', 'Passport') },
          ]
        : [
            {
              value: 'NATIONAL_ID',
              label: tx(
                'Documento Nacional de Identidad',
                'National Identity Document',
              ),
            },
            { value: 'PASSPORT', label: tx('Pasaporte', 'Passport') },
            {
              value: 'COL_NIT',
              label: tx(
                'Cédula de ciudadanía / NIT (Colombia)',
                'Colombian National ID / NIT',
              ),
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

  const selectedAgreementDoc = agreementsCatalog.find(
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
          <Icon name="shield" size={18} />{' '}
          {tx('Identidad y domicilio', 'Identity & address')}
        </legend>
        <div className={styles.grid}>
          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="kyc_tax_id_type">
              {tx('Tipo de identificación fiscal', 'Tax identification type')}
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
              {isPassport
                ? tx('Número de pasaporte', 'Passport number')
                : tx('Número de documento', 'Document number')}
            </label>
            <div className={styles.fieldControl}>
              <input
                id="kyc_tax_id"
                name="tax_id"
                placeholder={
                  isPassport
                    ? tx(
                        'Ej. PA1234567 (letras y números)',
                        'E.g. PA1234567 (letters & digits)',
                      )
                    : tx('Ej. 1005753821', 'E.g. 1005753821')
                }
                pattern={isPassport ? '[A-Za-z0-9\\-]{4,25}' : '[0-9\\-]{4,20}'}
                minLength={4}
                maxLength={100}
                required
              />
            </div>
            <small className={styles.fieldHelp}>
              {isPassport
                ? tx(
                    'Pasaporte alfanumérico: incluye las letras iniciales y los números (ej. PA1234567).',
                    'Alphanumeric passport: include leading letters and digits (e.g. PA1234567).',
                  )
                : tx(
                    'Ingresa los dígitos de tu documento sin puntos ni espacios.',
                    'Enter document digits without dots or spaces.',
                  )}
            </small>
          </div>

          <BirthDatePicker value={dob} onChange={setDob} />

          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="kyc_postal_code">
              {tx('Código postal', 'Postal code')}
            </label>
            <div className={styles.fieldControl}>
              <input
                id="kyc_postal_code"
                name="postal_code"
                placeholder={tx('Ej. 110111', 'E.g. 110111')}
                maxLength={20}
                required
              />
            </div>
          </div>

          <div className={`${styles.field} ${styles.fullWidth}`}>
            <label className={styles.fieldLabel} htmlFor="kyc_street_address">
              {tx('Dirección de residencia', 'Street address')}
            </label>
            <div className={styles.fieldControl}>
              <input
                id="kyc_street_address"
                name="street_address"
                placeholder={tx('Ej. Calle 40 # 7-19', 'E.g. 40 Main St #7-19')}
                maxLength={200}
                required
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="kyc_state">
              {tx(
                'Departamento, estado o provincia',
                'State, province, or region',
              )}
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
                placeholder={tx('Selecciona una región', 'Select a region')}
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
              {tx('Ciudad', 'City')}
            </label>
            <div className={styles.fieldControl}>
              <CustomSelect
                id="kyc_city"
                name="city"
                options={cityOptions}
                value={cities.includes(selectedCity) ? selectedCity : ''}
                onChange={setSelectedCity}
                placeholder={tx('Selecciona una ciudad', 'Select a city')}
                required
                disabled={
                  disabled ||
                  !activeState ||
                  citiesQuery.isFetching ||
                  cities.length === 0
                }
              />
            </div>
          </div>
        </div>
        {(regionsQuery.isFetching || citiesQuery.isFetching) && (
          <LoadingState
            mode="compact"
            label={tx(
              'Cargando regiones y ciudades…',
              'Loading states and cities…',
            )}
          />
        )}
        {(regionsQuery.error || citiesQuery.error) && (
          <div role="alert" className={styles.inlineErrorBanner}>
            <span>
              {tx(
                'No se pudo cargar el catálogo de ubicaciones.',
                'Could not load the locations catalog.',
              )}
            </span>
            <button
              type="button"
              className={styles.retryBtn}
              onClick={() => {
                if (regionsQuery.error) void regionsQuery.refetch();
                if (citiesQuery.error) void citiesQuery.refetch();
              }}
            >
              {tx('Reintentar', 'Retry')}
            </button>
          </div>
        )}
      </fieldset>

      <fieldset data-kyc-fields hidden={step !== 3} disabled={disabled}>
        <legend>
          <Icon name="pie" size={18} />{' '}
          {tx('Perfil financiero (USD)', 'Financial profile (USD)')}
        </legend>
        <div className={styles.grid}>
          <div className={styles.field}>
            <label
              className={styles.fieldLabel}
              htmlFor="kyc_employment_status"
            >
              {tx('Situación laboral', 'Employment status')}
            </label>
            <div className={styles.fieldControl}>
              <CustomSelect
                id="kyc_employment_status"
                name="employment_status"
                options={[
                  {
                    value: 'employed',
                    label: tx('Empleado / Asalariado', 'Employed / Salaried'),
                  },
                  { value: 'student', label: tx('Estudiante', 'Student') },
                  {
                    value: 'unemployed',
                    label: tx(
                      'Independiente / Sin empleo',
                      'Self-employed / Unemployed',
                    ),
                  },
                  {
                    value: 'retired',
                    label: tx('Pensionado / Retirado', 'Retired'),
                  },
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
              {tx(
                'Ingreso anual estimado (USD)',
                'Estimated annual income (USD)',
              )}
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
              {tx('Patrimonio neto total (USD)', 'Total net worth (USD)')}
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
              {tx('Patrimonio neto líquido (USD)', 'Liquid net worth (USD)')}
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
              {tx(
                'Fuentes de fondos (selecciona al menos una)',
                'Funding sources (select at least one)',
              )}
            </span>
            {fundingSources.map((source) => (
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
          <Icon name="check" size={18} />{' '}
          {tx(
            'Declaraciones regulatorias y acuerdos',
            'Regulatory disclosures & agreements',
          )}
        </legend>
        <div className={styles.grid}>
          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="kyc_control_person">
              {tx(
                '¿Eres directivo o accionista mayoritario (+10%) de una empresa en bolsa?',
                'Are you an officer or +10% shareholder of a publicly traded company?',
              )}
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
              {tx(
                '¿Trabajas en una bolsa de valores o entidad afiliada a FINRA?',
                'Are you affiliated with a stock exchange or FINRA member firm?',
              )}
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
              {tx(
                '¿Eres una Persona Expuesta Políticamente (PEP)?',
                'Are you a Politically Exposed Person (PEP)?',
              )}
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
              {tx(
                '¿Tienes algún familiar directo expuesto políticamente?',
                'Do you have an immediate family member who is politically exposed?',
              )}
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
              {tx(
                'Contratos de Custodia Bursátil (Alpaca Securities LLC & Acciones UD)',
                'Brokerage Custody Agreements (Alpaca Securities LLC & Acciones UD)',
              )}
            </span>
            <p className={styles.kycAgreementsIntro}>
              {tx(
                'Para habilitar tu cuenta de corretaje en EE. UU., revisa cada acuerdo haciendo clic en',
                'To enable your US brokerage account, review each agreement by clicking',
              )}{' '}
              <strong>{tx('Leer documento', 'Read document')}</strong>{' '}
              {tx('y marca tu aceptación:', 'and check your acceptance:')}
            </p>
          </div>

          <div className={styles.kycAgreements}>
            {agreementsCatalog.map((item) => (
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
                  {tx('Leer documento', 'Read document')}
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
                aria-label={tx('Cerrar documento', 'Close document')}
              >
                ✕
              </button>
            </header>
            <div className={styles.termsBody}>
              <p className={styles.termsBodyParagraph}>
                {selectedAgreementDoc.summary}
              </p>
              {selectedAgreementDoc.clauses.map((clause) => (
                <div key={clause.heading} className={styles.termsClauseBlock}>
                  <h3 className={styles.termsBodyHeading}>{clause.heading}</h3>
                  <p className={styles.termsBodyParagraph}>{clause.body}</p>
                </div>
              ))}
            </div>
            <footer className={styles.termsFooter}>
              <button
                type="button"
                className={styles.primary}
                onClick={() => agreementDialogRef.current?.close()}
              >
                {tx('Entendido y cerrar', 'Got it, close')}
              </button>
            </footer>
          </div>
        ) : null}
      </dialog>
    </div>
  );
}
