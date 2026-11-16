'use client';

import { useEffect, useRef, useState } from 'react';
import { City, State } from 'country-state-city';
import { Icon } from '@/components/ui/Icon';
import { countries } from './countries';
import type { readRegistration } from './contract';
import styles from './registration.module.css';

const RANGE_ORDER = [
  'RANGE_1',
  'RANGE_2',
  'RANGE_3',
  'RANGE_4',
  'RANGE_5',
  'RANGE_6',
] as const;

const RANGE_OPTIONS = [
  { code: 'RANGE_1', label: '$0 – $24,999 USD' },
  { code: 'RANGE_2', label: '$25,000 – $49,999 USD' },
  { code: 'RANGE_3', label: '$50,000 – $99,999 USD' },
  { code: 'RANGE_4', label: '$100,000 – $249,999 USD' },
  { code: 'RANGE_5', label: '$250,000 – $499,999 USD' },
  { code: 'RANGE_6', label: '$500,000 – $999,999 USD' },
] as const;

const FUNDING_SOURCES = [
  { value: 'employment_income', label: 'Salario' },
  { value: 'savings', label: 'Ahorros' },
  { value: 'investments', label: 'Inversiones' },
  { value: 'business_income', label: 'Ingresos empresariales' },
  { value: 'inheritance', label: 'Herencia' },
  { value: 'family', label: 'Apoyo familiar' },
] as const;

const MONTHS_ES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
] as const;

const WEEKDAYS_ES = ['LU', 'MA', 'MI', 'JU', 'VI', 'SA', 'DO'] as const;

type AgreementKey =
  'customer_agreement' | 'account_agreement' | 'margin_agreement';

const KYC_AGREEMENTS_CATALOG: ReadonlyArray<{
  key: AgreementKey;
  checkboxLabel: string;
  title: string;
  badge: string;
  required: boolean;
  summary: string;
  clauses: readonly { heading: string; body: string }[];
}> = [
  {
    key: 'customer_agreement',
    checkboxLabel: 'Acepto el acuerdo de cliente',
    title: 'Acuerdo de Cliente de Corretaje',
    badge: 'Obligatorio · Alpaca & Acciones UD',
    required: true,
    summary:
      'Contrato marco exigido por la SEC/FINRA y nuestro custodio Alpaca Securities LLC para enrutar órdenes en NYSE y NASDAQ.',
    clauses: [
      {
        heading: '1. Relación entre Acciones UD y el Custodio (Alpaca)',
        body: 'Acciones UD actúa como plataforma tecnológica y académica de negociación simulada conectada a la infraestructura de corretaje de Alpaca Securities LLC (miembro de FINRA/SIPC) en los mercados de Estados Unidos (NYSE, NASDAQ y AMEX).',
      },
      {
        heading: '2. Veracidad de Identidad (KYC / CIP)',
        body: 'El inversionista certifica que sus datos personales, documento de identidad (Cédula o Pasaporte) y residencia fiscal son verídicos conforme a las normas de prevención de lavado de activos (AML) y conozca a su cliente (KYC).',
      },
      {
        heading: '3. Ejecución de Órdenes y Horarios de Mercado',
        body: 'Las órdenes de mercado, límite, stop loss y take profit se procesan en dólares estadounidenses (USD) dentro del horario regular de Wall Street (09:30 a 16:00 ET) o quedan encoladas según su vigencia.',
      },
    ],
  },
  {
    key: 'account_agreement',
    checkboxLabel: 'Acepto el acuerdo de cuenta',
    title: 'Acuerdo de Custodia y Liquidación de Cuenta',
    badge: 'Opcional · Custodia USD',
    required: false,
    summary:
      'Regula el manejo de saldos disponibles, saldos reservados por órdenes abiertas, liquidación T+1 y estados de cuenta electrónicos.',
    clauses: [
      {
        heading: '1. Segregación de Saldos (Disponible vs. Reservado)',
        body: 'Todo capital comprometido en órdenes de compra abiertas pasa automáticamente al Saldo Reservado para garantizar la cobertura total de la operación antes de su ejecución.',
      },
      {
        heading: '2. Conversión Multi-Moneda a USD',
        body: 'Los depósitos realizados desde moneda local (COP, EUR, GBP) se convierten a dólares estadounidenses (USD) como divisa base única de negociación bursátil.',
      },
      {
        heading: '3. Reportes y Extractos Electrónicos',
        body: 'El titular autoriza la entrega electrónica de confirmaciones de ejecución, historial contable de billetera y reportes de portafolio dentro de la plataforma.',
      },
    ],
  },
  {
    key: 'margin_agreement',
    checkboxLabel: 'Acepto el acuerdo de margen',
    title: 'Declaración de Riesgo y Operativa Avanzada',
    badge: 'Opcional · Nivel Avanzado',
    required: false,
    summary:
      'Reconocimiento de volatilidad cambiaria, variaciones de precio (slippage) y condiciones de órdenes condicionales en bolsa.',
    clauses: [
      {
        heading: '1. Variación de Precio (Slippage) y Reautorización',
        body: 'En órdenes de mercado de alta volatilidad, si el precio cotizado varía por encima del umbral de tolerancia respecto a la previsualización, el sistema solicitará reautorización expresa del inversionista.',
      },
      {
        heading: '2. Naturaleza del Riesgo Bursátil',
        body: 'Las cotizaciones de renta variable estadounidense están sujetas a fluctuaciones de mercado en tiempo real. El rendimiento histórico de un activo no garantiza resultados futuros.',
      },
    ],
  },
];

function toAlpha3(code: string): string {
  const upper = code.trim().toUpperCase();
  if (upper.length === 3) return upper;
  return countries.find((c) => c.code === upper)?.alpha3 ?? 'COL';
}

export function validateBirthDateAge(dob: string): string | null {
  const trimmed = dob.trim();
  if (!trimmed) {
    return 'Selecciona tu fecha de nacimiento.';
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (!match) {
    return 'Ingresa una fecha de nacimiento válida.';
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const birthDate = new Date(Date.UTC(year, month - 1, day));
  if (
    birthDate.getUTCFullYear() !== year ||
    birthDate.getUTCMonth() !== month - 1 ||
    birthDate.getUTCDate() !== day
  ) {
    return 'La fecha de nacimiento seleccionada no es válida.';
  }

  const now = new Date();
  const todayYear = now.getFullYear();
  const todayMonth = now.getMonth() + 1;
  const todayDay = now.getDate();

  let age = todayYear - year;
  if (todayMonth < month || (todayMonth === month && todayDay < day)) {
    age -= 1;
  }

  if (age < 18) {
    return 'Debes ser mayor de 18 años para abrir una cuenta de inversión.';
  }
  if (age > 105) {
    return 'Verifica el año de tu fecha de nacimiento.';
  }
  return null;
}

export function readKyc(
  form: FormData,
  base: ReturnType<typeof readRegistration>,
) {
  const value = (key: string) => String(form.get(key) ?? '').trim();
  const dobError = validateBirthDateAge(value('date_of_birth'));
  if (dobError) {
    throw new Error(dobError);
  }

  const funding = form
    .getAll('funding_source')
    .map((entry) => String(entry).trim())
    .filter(Boolean);

  if (funding.length === 0) {
    throw new Error('Selecciona al menos una fuente de fondos.');
  }

  const annualRange = value('annual_income_range') || 'RANGE_1';
  const totalRange = value('total_net_worth_range') || 'RANGE_1';
  const liquidRange = value('liquid_net_worth_range') || 'RANGE_1';

  const totalIdx = RANGE_ORDER.indexOf(
    totalRange as (typeof RANGE_ORDER)[number],
  );
  const liquidIdx = RANGE_ORDER.indexOf(
    liquidRange as (typeof RANGE_ORDER)[number],
  );
  if (totalIdx !== -1 && liquidIdx !== -1 && liquidIdx > totalIdx) {
    throw new Error(
      'El patrimonio neto líquido no puede superar el patrimonio neto total.',
    );
  }

  const countryCode = base.country || 'CO';
  const countryAlpha3 = toAlpha3(countryCode);
  const citizenshipAlpha3 = toAlpha3(
    value('country_of_citizenship') || countryCode,
  );
  const taxResidenceAlpha3 = toAlpha3(
    value('country_of_tax_residence') || countryCode,
  );

  const rawState = value('state');
  const matchedState = State.getStatesOfCountry(countryCode).find(
    (item) => item.isoCode === rawState || item.name === rawState,
  );
  const stateName = matchedState ? matchedState.name : rawState;

  return {
    identity: {
      given_name: base.first_names,
      family_name: base.last_names,
      date_of_birth: value('date_of_birth'),
      tax_id: value('tax_id'),
      tax_id_type: value('tax_id_type') || 'COL_NIT',
      country_of_citizenship: citizenshipAlpha3,
      country_of_tax_residence: taxResidenceAlpha3,
      funding_source: funding,
      annual_income_range: annualRange,
      liquid_net_worth_range: liquidRange,
      total_net_worth_range: totalRange,
    },
    contact: {
      email_address: base.email,
      phone_number: base.phone,
      street_address: [value('street_address')].filter(Boolean),
      city: value('city'),
      state: stateName,
      postal_code: value('postal_code'),
      country: countryAlpha3,
    },
    employment_status: (value('employment_status') || 'employed') as
      'employed' | 'unemployed' | 'retired' | 'student',
    disclosures: {
      is_control_person: value('is_control_person') === 'yes',
      is_affiliated_exchange_or_finra:
        value('is_affiliated_exchange_or_finra') === 'yes',
      is_politically_exposed: value('is_politically_exposed') === 'yes',
      immediate_family_exposed: value('immediate_family_exposed') === 'yes',
    },
    agreements: {
      customer_agreement: form.has('customer_agreement'),
      account_agreement: form.has('account_agreement'),
      margin_agreement: form.has('margin_agreement'),
    },
  };
}

function getDaysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function getFirstWeekdayMondayStart(year: number, monthIndex: number): number {
  const day = new Date(year, monthIndex, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

function formatSpanishDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return '';
  const year = Number(match[1]);
  const monthIdx = Number(match[2]) - 1;
  const day = Number(match[3]);
  const monthName = MONTHS_ES[monthIdx];
  if (!monthName) return iso;
  return `${day} de ${monthName.toLowerCase()} de ${year}`;
}

interface SelectOption {
  value: string;
  label: string;
}

function CustomSelect({
  id,
  name,
  options,
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
}: {
  id: string;
  name: string;
  options: readonly SelectOption[];
  value: string;
  onChange: (nextValue: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
        setSearch('');
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  const selectedOption = options.find((opt) => opt.value === value);
  const showSearch = options.length > 7;
  const filteredOptions = showSearch
    ? options.filter((opt) =>
        opt.label.toLowerCase().includes(search.trim().toLowerCase()),
      )
    : options;

  return (
    <div className={styles.customSelectWrapper} ref={wrapperRef}>
      <select
        id={id}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        disabled={disabled}
        tabIndex={-1}
        className={styles.hiddenNativeSelect}
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <button
        type="button"
        disabled={disabled}
        className={`${styles.customSelectTrigger} ${
          open ? styles.customSelectTriggerOpen : ''
        }`}
        onClick={() => {
          setOpen((prev) => !prev);
          setSearch('');
        }}
        aria-expanded={open}
      >
        <span
          className={
            selectedOption
              ? styles.customSelectValue
              : styles.customSelectPlaceholder
          }
        >
          {selectedOption
            ? selectedOption.label
            : (placeholder ?? 'Seleccionar')}
        </span>
        <span
          className={`${styles.customSelectChevron} ${
            open ? styles.chevronOpen : ''
          }`}
          aria-hidden="true"
        >
          ▼
        </span>
      </button>

      {open ? (
        <div className={styles.customSelectMenu}>
          {showSearch ? (
            <div className={styles.customSelectSearchBox}>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar en la lista..."
                className={styles.customSelectSearchInput}
                autoFocus
              />
            </div>
          ) : null}
          <ul className={styles.customSelectList} role="listbox">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <li
                    key={opt.value}
                    role="option"
                    aria-selected={isSelected}
                    className={`${styles.customSelectOption} ${
                      isSelected ? styles.customSelectOptionActive : ''
                    }`}
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                      setSearch('');
                    }}
                  >
                    <span>{opt.label}</span>
                    {isSelected ? (
                      <span className={styles.countryCheck} aria-hidden="true">
                        ✓
                      </span>
                    ) : null}
                  </li>
                );
              })
            ) : (
              <li className={styles.comboboxEmpty}>
                No se encontraron coincidencias
              </li>
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

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
  const [calendarOpen, setCalendarOpen] = useState(false);

  const [employmentStatus, setEmploymentStatus] = useState('employed');
  const [annualIncome, setAnnualIncome] = useState('RANGE_1');
  const [totalNetWorth, setTotalNetWorth] = useState('RANGE_2');
  const [liquidNetWorth, setLiquidNetWorth] = useState('RANGE_1');

  const [isControlPerson, setIsControlPerson] = useState('no');
  const [isFinra, setIsFinra] = useState('no');
  const [isPep, setIsPep] = useState('no');
  const [isFamilyPep, setIsFamilyPep] = useState('no');

  const currentYear = new Date().getFullYear();
  const maxAdultYear = currentYear - 18;
  const minAdultYear = currentYear - 100;

  const [viewYear, setViewYear] = useState(maxAdultYear - 4);
  const [viewMonth, setViewMonth] = useState(0);
  const calendarRef = useRef<HTMLDivElement>(null);

  const [activeAgreementModal, setActiveAgreementModal] =
    useState<AgreementKey | null>(null);
  const agreementDialogRef = useRef<HTMLDialogElement>(null);

  const states = State.getStatesOfCountry(activeCountry);
  const cities = selectedState
    ? City.getCitiesOfState(activeCountry, selectedState)
    : [];

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

  useEffect(() => {
    if (!calendarOpen) return;
    function handleOutside(event: MouseEvent) {
      if (
        calendarRef.current &&
        !calendarRef.current.contains(event.target as Node)
      ) {
        setCalendarOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [calendarOpen]);

  const years: number[] = [];
  for (let y = maxAdultYear; y >= minAdultYear; y -= 1) {
    years.push(y);
  }

  const daysInCurrentMonth = getDaysInMonth(viewYear, viewMonth);
  const firstWeekdayOffset = getFirstWeekdayMondayStart(viewYear, viewMonth);

  function selectCalendarDay(day: number) {
    const mm = String(viewMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    const formatted = `${viewYear}-${mm}-${dd}`;
    setDob(formatted);
    setCalendarOpen(false);
  }

  function openAgreementModal(key: AgreementKey) {
    setActiveAgreementModal(key);
    agreementDialogRef.current?.showModal();
  }

  const selectedAgreementDoc = KYC_AGREEMENTS_CATALOG.find(
    (item) => item.key === activeAgreementModal,
  );

  const stateOptions = states.map((st) => ({
    value: st.isoCode,
    label: st.name,
  }));

  const cityOptions = cities.map((ct) => ({
    value: ct.name,
    label: ct.name,
  }));

  const rangeSelectOptions = RANGE_OPTIONS.map((opt) => ({
    value: opt.code,
    label: opt.label,
  }));

  const yesNoOptions = [
    { value: 'no', label: 'No' },
    { value: 'yes', label: 'Sí' },
  ] as const;

  return (
    <>
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

          <div className={styles.field} ref={calendarRef}>
            <label className={styles.fieldLabel} htmlFor="kyc_dob">
              Fecha de nacimiento
            </label>
            <div className={styles.customDateWrapper}>
              <input
                id="kyc_dob"
                type="text"
                name="date_of_birth"
                value={dob}
                onChange={(e) => {
                  const val = e.target.value;
                  setDob(val);
                  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(val);
                  if (match) {
                    setViewYear(Number(match[1]));
                    setViewMonth(Number(match[2]) - 1);
                  }
                }}
                placeholder="AAAA-MM-DD"
                className={styles.srOnly}
                tabIndex={-1}
                required
              />
              <button
                type="button"
                className={`${styles.customDateTrigger} ${
                  calendarOpen ? styles.customDateTriggerOpen : ''
                }`}
                onClick={() => setCalendarOpen((prev) => !prev)}
                aria-expanded={calendarOpen}
              >
                <span
                  className={
                    dob ? styles.customDateValue : styles.customDatePlaceholder
                  }
                >
                  {dob
                    ? formatSpanishDate(dob)
                    : 'Selecciona tu fecha (+18 años)'}
                </span>
                <span className={styles.customDateIcon} aria-hidden="true">
                  <Icon name="calendar" size={16} />
                </span>
              </button>

              {calendarOpen ? (
                <div
                  className={styles.customCalendarPopover}
                  role="dialog"
                  aria-label="Selector de fecha de nacimiento"
                >
                  <div className={styles.customCalendarHeader}>
                    <select
                      aria-label="Mes de nacimiento"
                      className={styles.customCalendarSelect}
                      value={viewMonth}
                      onChange={(e) => setViewMonth(Number(e.target.value))}
                    >
                      {MONTHS_ES.map((m, idx) => (
                        <option key={m} value={idx}>
                          {m}
                        </option>
                      ))}
                    </select>
                    <select
                      aria-label="Año de nacimiento"
                      className={styles.customCalendarSelect}
                      value={viewYear}
                      onChange={(e) => setViewYear(Number(e.target.value))}
                    >
                      {years.map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.customCalendarWeekdays}>
                    {WEEKDAYS_ES.map((wd) => (
                      <span key={wd} className={styles.customCalendarWeekday}>
                        {wd}
                      </span>
                    ))}
                  </div>

                  <div className={styles.customCalendarDays}>
                    {Array.from({ length: firstWeekdayOffset }).map((_, i) => (
                      <span
                        key={`empty-${i}`}
                        className={styles.customCalendarDayEmpty}
                      />
                    ))}
                    {Array.from({ length: daysInCurrentMonth }).map((_, i) => {
                      const dayNum = i + 1;
                      const isoCandidate = `${viewYear}-${String(
                        viewMonth + 1,
                      ).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                      const isSelected = dob === isoCandidate;
                      const isUnderage =
                        validateBirthDateAge(isoCandidate) !== null;
                      return (
                        <button
                          key={dayNum}
                          type="button"
                          disabled={isUnderage}
                          className={`${styles.customCalendarDayBtn} ${
                            isSelected ? styles.customCalendarDaySelected : ''
                          }`}
                          onClick={() => selectCalendarDay(dayNum)}
                        >
                          {dayNum}
                        </button>
                      );
                    })}
                  </div>

                  <div className={styles.customCalendarFooter}>
                    <span>Requisito legal: Mayor de 18 años</span>
                    {dob ? (
                      <button
                        type="button"
                        className={styles.customCalendarClearBtn}
                        onClick={() => setDob('')}
                      >
                        Limpiar
                      </button>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

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
                value={selectedState}
                onChange={(nextState) => {
                  setSelectedState(nextState);
                  setSelectedCity('');
                }}
                placeholder="Selecciona una región"
                required
                disabled={disabled}
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
                value={selectedCity}
                onChange={setSelectedCity}
                placeholder="Selecciona una ciudad"
                required
                disabled={disabled}
              />
            </div>
          </div>
        </div>
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
            <span className={styles.fieldLabel} style={{ gridColumn: '1/-1' }}>
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
    </>
  );
}
