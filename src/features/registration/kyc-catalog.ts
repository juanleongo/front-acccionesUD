import { formatPersonName } from '@/lib/format-person-name';
import { tx, type Locale } from '@/lib/i18n/locale';
import type { readRegistration } from './contract';
import { countries } from './countries';

export const RANGE_ORDER = [
  'RANGE_1',
  'RANGE_2',
  'RANGE_3',
  'RANGE_4',
  'RANGE_5',
  'RANGE_6',
] as const;

export const RANGE_OPTIONS = [
  { code: 'RANGE_1', label: '$0 – $24,999 USD' },
  { code: 'RANGE_2', label: '$25,000 – $49,999 USD' },
  { code: 'RANGE_3', label: '$50,000 – $99,999 USD' },
  { code: 'RANGE_4', label: '$100,000 – $249,999 USD' },
  { code: 'RANGE_5', label: '$250,000 – $499,999 USD' },
  { code: 'RANGE_6', label: '$500,000 – $999,999 USD' },
] as const;

export const FUNDING_SOURCES = [
  { value: 'employment_income', label: 'Salario', labelEn: 'Salary' },
  { value: 'savings', label: 'Ahorros', labelEn: 'Savings' },
  { value: 'investments', label: 'Inversiones', labelEn: 'Investments' },
  {
    value: 'business_income',
    label: 'Ingresos empresariales',
    labelEn: 'Business income',
  },
  { value: 'inheritance', label: 'Herencia', labelEn: 'Inheritance' },
  { value: 'family', label: 'Apoyo familiar', labelEn: 'Family support' },
] as const;

export function getFundingSources(locale: Locale = 'es') {
  return FUNDING_SOURCES.map((source) => ({
    value: source.value,
    label: locale === 'en' ? source.labelEn : source.label,
  }));
}

export const MONTHS_ES = [
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

export const MONTHS_EN = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

export const WEEKDAYS_ES = ['LU', 'MA', 'MI', 'JU', 'VI', 'SA', 'DO'] as const;
export const WEEKDAYS_EN = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'] as const;

export type AgreementKey =
  'customer_agreement' | 'account_agreement' | 'margin_agreement';

export const KYC_AGREEMENTS_CATALOG: ReadonlyArray<{
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

export const KYC_AGREEMENTS_CATALOG_EN: ReadonlyArray<{
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
    checkboxLabel: 'I accept the customer agreement',
    title: 'Brokerage Customer Agreement',
    badge: 'Required · Alpaca & Acciones UD',
    required: true,
    summary:
      'Framework agreement required by the SEC/FINRA and our custodian Alpaca Securities LLC to route orders on NYSE and NASDAQ.',
    clauses: [
      {
        heading:
          '1. Relationship Between Acciones UD and the Custodian (Alpaca)',
        body: 'Acciones UD acts as an academic and technological simulated trading platform connected to Alpaca Securities LLC brokerage infrastructure (member FINRA/SIPC) across US markets (NYSE, NASDAQ, and AMEX).',
      },
      {
        heading: '2. Identity Verification Accuracy (KYC / CIP)',
        body: 'The investor certifies that personal data, identity document (National ID or Passport), and tax residency are truthful in compliance with anti-money laundering (AML) and know-your-customer (KYC) rules.',
      },
      {
        heading: '3. Order Execution & Market Hours',
        body: 'Market, limit, stop loss, and take profit orders are processed in US Dollars (USD) during regular Wall Street hours (09:30 to 16:00 ET) or queued according to time-in-force rules.',
      },
    ],
  },
  {
    key: 'account_agreement',
    checkboxLabel: 'I accept the account agreement',
    title: 'Custody & Account Settlement Agreement',
    badge: 'Optional · USD Custody',
    required: false,
    summary:
      'Governs available cash balances, balances reserved for open orders, T+1 settlement, and electronic account statements.',
    clauses: [
      {
        heading: '1. Balance Segregation (Available vs. Reserved)',
        body: 'All capital committed to open buy orders is automatically moved to the Reserved Balance to guarantee full coverage before execution.',
      },
      {
        heading: '2. Multi-Currency Conversion to USD',
        body: 'Deposits submitted from local currencies (COP, EUR, GBP) are converted into US Dollars (USD) as the single base trading currency.',
      },
      {
        heading: '3. Electronic Reports & Statements',
        body: 'The account holder authorizes electronic delivery of trade confirmations, wallet ledger history, and portfolio reports within the platform.',
      },
    ],
  },
  {
    key: 'margin_agreement',
    checkboxLabel: 'I accept the margin agreement',
    title: 'Risk Disclosure & Advanced Operations',
    badge: 'Optional · Advanced Level',
    required: false,
    summary:
      'Acknowledgment of currency volatility, price slippage, and terms for conditional stock market orders.',
    clauses: [
      {
        heading: '1. Price Slippage & Reauthorization',
        body: 'During highly volatile market orders, if the quoted price moves above the tolerance threshold from the preview quote, the system requests explicit reauthorization from the investor.',
      },
      {
        heading: '2. Nature of Equity Market Risk',
        body: 'US equity quotes are subject to real-time market fluctuations. Historical performance of an asset does not guarantee future returns.',
      },
    ],
  },
];

export function getKycAgreementsCatalog(locale: Locale = 'es') {
  return locale === 'en' ? KYC_AGREEMENTS_CATALOG_EN : KYC_AGREEMENTS_CATALOG;
}

function toAlpha3(code: string): string {
  const upper = code.trim().toUpperCase();
  if (upper.length === 3) return upper;
  return countries.find((c) => c.code === upper)?.alpha3 ?? 'COL';
}

export function validateBirthDateAge(
  dob: string,
  locale: Locale = 'es',
): string | null {
  const trimmed = dob.trim();
  if (!trimmed) {
    return tx(
      locale,
      'Selecciona tu fecha de nacimiento.',
      'Select your date of birth.',
    );
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (!match) {
    return tx(
      locale,
      'Ingresa una fecha de nacimiento válida.',
      'Enter a valid date of birth.',
    );
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
    return tx(
      locale,
      'La fecha de nacimiento seleccionada no es válida.',
      'The selected date of birth is invalid.',
    );
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
    return tx(
      locale,
      'Debes ser mayor de 18 años para abrir una cuenta de inversión.',
      'You must be at least 18 years old to open an investment account.',
    );
  }
  if (age > 105) {
    return tx(
      locale,
      'Verifica el año de tu fecha de nacimiento.',
      'Verify your birth year.',
    );
  }
  return null;
}

function findNonAsciiTextField(
  payload: Record<string, unknown> | undefined,
  locale: Locale = 'es',
): { fieldKey: string; fieldLabel: string; sample: string } | null {
  if (!payload) return null;
  const contact =
    typeof payload.contact === 'object' && payload.contact !== null
      ? (payload.contact as Record<string, unknown>)
      : null;
  const identity =
    typeof payload.identity === 'object' && payload.identity !== null
      ? (payload.identity as Record<string, unknown>)
      : null;

  const streetVal = Array.isArray(contact?.street_address)
    ? String(contact?.street_address[0] ?? '')
    : typeof contact?.street_address === 'string'
      ? contact.street_address
      : '';

  const candidates: Array<{ key: string; label: string; value: string }> = [
    {
      key: 'city',
      label: tx(locale, 'Ciudad', 'City'),
      value: String(contact?.city ?? ''),
    },
    {
      key: 'state',
      label: tx(locale, 'Departamento / Estado', 'State / Province'),
      value: String(contact?.state ?? ''),
    },
    {
      key: 'street_address',
      label: tx(locale, 'Dirección de residencia', 'Street address'),
      value: streetVal,
    },
    {
      key: 'postal_code',
      label: tx(locale, 'Código postal', 'Postal code'),
      value: String(contact?.postal_code ?? ''),
    },
    {
      key: 'given_name',
      label: tx(locale, 'Nombre(s)', 'First name(s)'),
      value: String(identity?.given_name ?? ''),
    },
    {
      key: 'family_name',
      label: tx(locale, 'Apellido(s)', 'Last name(s)'),
      value: String(identity?.family_name ?? ''),
    },
  ];

  for (const item of candidates) {
    if (item.value && /[^\x20-\x7E]/.test(item.value)) {
      return { fieldKey: item.key, fieldLabel: item.label, sample: item.value };
    }
  }
  return null;
}

export function formatKycSubmissionError(
  rawMessage: string,
  invalidFields?: readonly string[],
  submittedPayload?: Record<string, unknown>,
  locale: Locale = 'es',
): string {
  const lower = rawMessage.toLowerCase();
  const fieldsText = (invalidFields ?? []).join(', ').toLowerCase();
  const combined = `${lower} ${fieldsText}`;
  const isAsciiIssue =
    combined.includes('ascii') ||
    combined.includes('printable') ||
    combined.includes('non-control') ||
    combined.includes('character');

  if (
    combined.includes('date_of_birth') ||
    combined.includes('birthday') ||
    combined.includes('underage') ||
    /\bage\b/.test(combined)
  ) {
    return tx(
      locale,
      'La fecha de nacimiento ingresada fue rechazada. Verifica que corresponda a una persona mayor de 18 años.',
      'The submitted date of birth was rejected. Make sure the applicant is at least 18 years old.',
    );
  }
  if (combined.includes('email_address') || combined.includes('email')) {
    if (combined.includes('already exists') || combined.includes('duplicate')) {
      return tx(
        locale,
        'El correo electrónico de tu cuenta ya tiene una cuenta de corretaje registrada en el custodio Alpaca.',
        'Your email address already has a brokerage account registered with the custodian Alpaca.',
      );
    }
    return tx(
      locale,
      'El formato del correo electrónico no fue aceptado por el custodio Alpaca.',
      'The email address format was rejected by the custodian Alpaca.',
    );
  }
  if (combined.includes('tax_id')) {
    if (combined.includes('already exists') || combined.includes('duplicate')) {
      return tx(
        locale,
        'El número de documento ingresado ya se encuentra registrado en otra cuenta del custodio Alpaca.',
        'The entered tax/ID number is already registered on another Alpaca custodian account.',
      );
    }
    return tx(
      locale,
      'El número o tipo de documento de identidad (Cédula/NIT o Pasaporte) fue rechazado por el custodio Alpaca. Verifica que no tenga espacios ni símbolos inválidos.',
      'The ID document number or type (National ID or Passport) was rejected by Alpaca. Check that it has no spaces or invalid symbols.',
    );
  }

  const detectedNonAscii = findNonAsciiTextField(submittedPayload, locale);
  if (isAsciiIssue || detectedNonAscii) {
    if (combined.includes('city') || detectedNonAscii?.fieldKey === 'city') {
      const hint = detectedNonAscii ? ` ("${detectedNonAscii.sample}")` : '';
      return tx(
        locale,
        `El campo Ciudad${hint} contiene tildes o caracteres especiales no admitidos por el custodio (ej. á, é, í, ó, ú, ñ). Escribe o elige una ciudad sin tildes.`,
        `The City field${hint} contains accents or special characters not accepted by the custodian. Enter or select a city without accents.`,
      );
    }
    if (combined.includes('state') || detectedNonAscii?.fieldKey === 'state') {
      const hint = detectedNonAscii ? ` ("${detectedNonAscii.sample}")` : '';
      return tx(
        locale,
        `El campo Departamento / Estado${hint} contiene tildes o caracteres especiales no admitidos por el custodio. Usa letras sin tilde.`,
        `The State / Province field${hint} contains accents or special characters not accepted by the custodian. Use plain ASCII letters.`,
      );
    }
    if (
      combined.includes('street_address') ||
      detectedNonAscii?.fieldKey === 'street_address'
    ) {
      const hint = detectedNonAscii ? ` ("${detectedNonAscii.sample}")` : '';
      return tx(
        locale,
        `El campo Dirección de residencia${hint} contiene tildes o caracteres especiales no admitidos. Usa solo letras sin tilde, números y espacios.`,
        `The Street address field${hint} contains accents or special characters not allowed. Use only plain letters, numbers, and spaces.`,
      );
    }
    if (
      combined.includes('given_name') ||
      combined.includes('family_name') ||
      detectedNonAscii?.fieldKey === 'given_name' ||
      detectedNonAscii?.fieldKey === 'family_name'
    ) {
      const hint = detectedNonAscii ? ` ("${detectedNonAscii.sample}")` : '';
      const fieldName =
        detectedNonAscii?.fieldLabel ??
        tx(locale, 'Nombre o Apellido', 'First or Last name');
      return tx(
        locale,
        `El campo ${fieldName}${hint} contiene tildes o ñ no admitidas por el custodio en EE. UU.`,
        `The ${fieldName} field${hint} contains accents or non-ASCII characters not accepted by the US custodian.`,
      );
    }
    if (detectedNonAscii) {
      return tx(
        locale,
        `El campo ${detectedNonAscii.fieldLabel} ("${detectedNonAscii.sample}") contiene tildes o caracteres especiales no admitidos por el custodio (á, é, í, ó, ú, ñ).`,
        `The ${detectedNonAscii.fieldLabel} field ("${detectedNonAscii.sample}") contains accents or special characters not accepted by the custodian.`,
      );
    }
    return tx(
      locale,
      'Uno de los textos enviados contiene tildes (á, é, í, ó, ú), ñ o caracteres especiales no admitidos por el custodio en EE. UU.',
      'One of the submitted fields contains accents or special characters not accepted by the US custodian.',
    );
  }

  if (combined.includes('city')) {
    return tx(
      locale,
      'El campo Ciudad no fue admitido por el custodio en EE. UU. Verifica el nombre o selecciona otra ciudad sin caracteres especiales.',
      'The City field was rejected by the US custodian. Verify the name or select a city without special characters.',
    );
  }
  if (combined.includes('state')) {
    return tx(
      locale,
      'El campo Departamento / Estado no fue admitido por el custodio en EE. UU.',
      'The State / Province field was rejected by the US custodian.',
    );
  }
  if (combined.includes('street_address')) {
    return tx(
      locale,
      'El campo Dirección de residencia no cumple el formato requerido por el custodio (evita símbolos especiales y usa letras/números estándar).',
      'The Street address does not meet the custodian format (avoid special symbols and use standard letters/numbers).',
    );
  }
  if (combined.includes('postal_code')) {
    return tx(
      locale,
      'El código postal ingresado no cumple el formato válido para el país o departamento seleccionado.',
      'The postal code does not match the expected format for the selected country or state.',
    );
  }
  if (combined.includes('phone_number') || combined.includes('phone')) {
    return tx(
      locale,
      'El número de teléfono fue rechazado por el custodio. Asegúrate de que incluya el indicativo internacional con signo + y solo dígitos (ej. +573001234567).',
      'The phone number was rejected by the custodian. Make sure it starts with + followed by country code and digits only (e.g. +573001234567).',
    );
  }
  if (
    combined.includes('liquid_net_worth') ||
    combined.includes('total_net_worth') ||
    combined.includes('annual_income')
  ) {
    return tx(
      locale,
      'El perfil financiero presenta inconsistencias: el patrimonio neto líquido no puede superar el patrimonio neto total.',
      'Financial profile mismatch: liquid net worth cannot exceed total net worth.',
    );
  }
  if (
    combined.includes('customer_agreement') ||
    combined.includes('agreement')
  ) {
    return tx(
      locale,
      'Debes aceptar el Acuerdo de Cliente de Corretaje (obligatorio) para radicar la apertura KYC.',
      'You must accept the Brokerage Customer Agreement (required) to submit KYC onboarding.',
    );
  }
  if (
    rawMessage &&
    !lower.startsWith('error http') &&
    !lower.includes('alpaca rejected the submitted data')
  ) {
    return tx(
      locale,
      `El custodio reportó el siguiente detalle de validación: "${rawMessage}".`,
      `The custodian reported the following validation detail: "${rawMessage}".`,
    );
  }
  return tx(
    locale,
    'El custodio no pudo validar los datos enviados. Revisa que ninguno de tus datos (ciudad, dirección, nombre o documento) contenga caracteres especiales o formatos inválidos.',
    'The custodian could not validate the submitted data. Verify that your details (city, address, name, ID) have no special characters or invalid formats.',
  );
}

export function readKyc(
  form: FormData,
  base: ReturnType<typeof readRegistration>,
  locale: Locale = 'es',
) {
  const value = (key: string) => String(form.get(key) ?? '').trim();
  const dobError = validateBirthDateAge(value('date_of_birth'), locale);
  if (dobError) {
    throw new Error(dobError);
  }

  const funding = form
    .getAll('funding_source')
    .map((entry) => String(entry).trim())
    .filter(Boolean);

  if (funding.length === 0) {
    throw new Error(
      tx(
        locale,
        'Selecciona al menos una fuente de fondos.',
        'Select at least one funding source.',
      ),
    );
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
      tx(
        locale,
        'El patrimonio neto líquido no puede superar el patrimonio neto total.',
        'Liquid net worth cannot exceed total net worth.',
      ),
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

  // The location selector submits the region name expected by the KYC contract.
  const stateName = value('state_name') || value('state');

  return {
    identity: {
      given_name: formatPersonName(base.first_names),
      family_name: formatPersonName(base.last_names),
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

export function getDaysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

export function getFirstWeekdayMondayStart(
  year: number,
  monthIndex: number,
): number {
  const day = new Date(year, monthIndex, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

export function formatSpanishDate(iso: string, locale: Locale = 'es'): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return '';
  const year = Number(match[1]);
  const monthIdx = Number(match[2]) - 1;
  const day = Number(match[3]);
  if (locale === 'en') {
    const monthName = MONTHS_EN[monthIdx];
    if (!monthName) return iso;
    return `${monthName} ${day}, ${year}`;
  }
  const monthName = MONTHS_ES[monthIdx];
  if (!monthName) return iso;
  return `${day} de ${monthName.toLowerCase()} de ${year}`;
}
