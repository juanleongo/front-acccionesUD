import { z } from 'zod';

export type RegistrationKind = 'investor' | 'broker';

export const marketInterestsCatalog = [
  {
    value: 'Tecnología & Semiconductores',
    label: 'Tecnología & Semiconductores (NASDAQ: Apple, NVIDIA, Microsoft)',
  },
  {
    value: 'Mercados Tradicionales (NYSE & S&P 500)',
    label: 'Mercados Tradicionales de EE. UU. (NYSE, S&P 500 & Dow Jones)',
  },
  {
    value: 'Materias Primas: Oro & Metales',
    label: 'Materias Primas: Oro, Plata & Metales Preciosos (GLD, NEM)',
  },
  {
    value: 'Energía, Petróleo & Gas Natural',
    label: 'Energía, Petróleo & Gas Natural en EE. UU. (ExxonMobil, Chevron)',
  },
  {
    value: 'Sector Financiero & Banca USA',
    label: 'Sector Financiero, Banca & Pagos (JPMorgan, Visa, Goldman Sachs)',
  },
  {
    value: 'Inteligencia Artificial & Cloud',
    label: 'Inteligencia Artificial, Cloud & Ciberseguridad',
  },
  {
    value: 'Salud & Biotecnología',
    label: 'Salud, Farmacéuticas & Biotecnología (Eli Lilly, Pfizer, UNH)',
  },
  {
    value: 'ETFs & Fondos Indexados USA',
    label: 'Fondos Cotizados / ETFs de EE. UU. (SPY, QQQ, DIA, IWM)',
  },
  {
    value: 'Consumo Masivo & Retail',
    label: 'Consumo Masivo, Retail & E-Commerce (Amazon, Walmart, Coca-Cola)',
  },
  {
    value: 'Bienes Raíces (REITs) & Dividendos',
    label: 'Bienes Raíces (REITs) & Acciones de Dividendos en USD',
  },
] as const;

export function registrationPath(kind: RegistrationKind) {
  return kind === 'broker'
    ? '/api/v1/auth/register/broker'
    : '/api/v1/auth/register';
}

export const resultSchema = z.object({
  user_id: z.uuid(),
  account_status: z.enum(['active', 'pending_broker_activation']),
});

export function readRegistration(form: FormData, kind: RegistrationKind) {
  const value = (key: string) => String(form.get(key) ?? '');
  const interests = form
    .getAll('interests')
    .flatMap((entry) => String(entry).split(/\r?\n/))
    .map((line) => line.trim())
    .filter(Boolean);
  const uniqueInterests = [...new Set(interests)];
  return {
    first_names: value('first_names').trim(),
    last_names: value('last_names').trim(),
    email: value('email').trim(),
    phone: value('phone').trim(),
    country: value('country'),
    password: value('password'),
    terms_accepted: form.has('terms_accepted'),
    monthly_report: form.has('monthly_report'),
    interests: uniqueInterests,
    investor_level: value('investor_level') || null,
    broker_requested: form.has('broker_requested'),
    premium_requested: form.has('premium_requested'),
    ...(kind === 'broker'
      ? {
          firm_name: value('firm_name').trim(),
          license_number: value('license_number').trim(),
        }
      : {}),
  };
}
