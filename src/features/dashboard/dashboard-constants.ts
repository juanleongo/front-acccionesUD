'use client';

import type { IconName } from '@/components/ui/Icon';
import type { Locale } from '@/lib/i18n/locale';

export type DashboardSection =
  'dashboard' | 'markets' | 'orders' | 'portfolio' | 'funds' | 'advisors';

export const navItems: ReadonlyArray<{
  id: DashboardSection;
  label: string;
  labelEn: string;
  icon: IconName;
}> = [
  { id: 'dashboard', label: 'Dashboard', labelEn: 'Dashboard', icon: 'grid' },
  {
    id: 'markets',
    label: 'Mercados en Vivo',
    labelEn: 'Live Markets',
    icon: 'trend',
  },
  {
    id: 'orders',
    label: 'Terminal de Órdenes',
    labelEn: 'Order Terminal',
    icon: 'devices',
  },
  { id: 'portfolio', label: 'Portafolio', labelEn: 'Portfolio', icon: 'pie' },
  {
    id: 'funds',
    label: 'Depósitos & Retiros',
    labelEn: 'Deposits & Withdrawals',
    icon: 'wallet',
  },
  { id: 'advisors', label: 'Comisionistas', labelEn: 'Brokers', icon: 'users' },
];

export const sectionTitles: Record<DashboardSection, string> = {
  dashboard: 'Panel de Control · Resumen General',
  markets: 'Mercados en Vivo · Cotizaciones de Wall Street',
  orders: 'Terminal de Órdenes · Ejecución en NYSE & NASDAQ',
  portfolio: 'Portafolio de Inversión · Posiciones Activas',
  funds: 'Depósitos & Retiros · Gestión de Fondos Simulados (USD)',
  advisors: 'Comisionistas Bursátiles · Directorio de Asesores',
};

const sectionTitlesEn: Record<DashboardSection, string> = {
  dashboard: 'Control Panel · Overview',
  markets: 'Live Markets · Wall Street Quotes',
  orders: 'Order Terminal · NYSE & NASDAQ Execution',
  portfolio: 'Investment Portfolio · Active Positions',
  funds: 'Deposits & Withdrawals · Simulated Funds (USD)',
  advisors: 'Licensed Brokers · Advisor Directory',
};

export function getSectionTitle(
  section: DashboardSection,
  locale: Locale,
): string {
  return locale === 'en' ? sectionTitlesEn[section] : sectionTitles[section];
}

export const accountStatusLabels: Record<string, string> = {
  active: 'Activa',
  pending_broker_activation: 'Pendiente de activación',
  disabled: 'Suspendida',
};

const accountStatusLabelsEn: Record<string, string> = {
  active: 'Active',
  pending_broker_activation: 'Pending activation',
  disabled: 'Suspended',
};

export function formatAccountStatusLabel(
  status: string | null | undefined,
  locale: Locale,
): string {
  if (!status) return locale === 'en' ? 'Active' : 'Activa';
  const map = locale === 'en' ? accountStatusLabelsEn : accountStatusLabels;
  return map[status] ?? status;
}

export const roleLabels: Record<string, string> = {
  investor: 'Inversionista Bursátil',
  broker: 'Comisionista Certificado',
  administrator: 'Administrador',
};

const roleLabelsEn: Record<string, string> = {
  investor: 'Stock Investor',
  broker: 'Certified Broker',
  administrator: 'Administrator',
};

export const kycStatusLabels: Record<string, string> = {
  ACTIVE: 'Verificada y activa',
  SUBMITTED: 'En revisión por custodio',
  ACTION_REQUIRED: 'Requiere información adicional',
  APPROVED: 'Aprobada',
  REJECTED: 'Rechazada',
};

const kycStatusLabelsEn: Record<string, string> = {
  ACTIVE: 'Verified & active',
  SUBMITTED: 'Under custodian review',
  ACTION_REQUIRED: 'Additional information required',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
};

export function formatUserRoles(
  roles?: readonly string[],
  locale: Locale = 'es',
): string {
  const map = locale === 'en' ? roleLabelsEn : roleLabels;
  if (!roles || roles.length === 0) {
    return locale === 'en' ? 'Stock Investor' : 'Inversionista Bursátil';
  }
  return roles.map((r) => map[r] ?? r).join(' · ');
}

export function formatKycStatus(
  rawStatus: string | null | undefined,
  hasRealAccount: boolean,
  locale: Locale = 'es',
): string {
  const map = locale === 'en' ? kycStatusLabelsEn : kycStatusLabels;
  if (rawStatus) {
    return map[rawStatus.toUpperCase()] ?? rawStatus;
  }
  if (locale === 'en') {
    return hasRealAccount ? 'Submitted' : 'Pending submission';
  }
  return hasRealAccount ? 'Radicada' : 'Pendiente por radicar';
}

export function subscribeGuideStore(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener('acciones_ud_guide_change', callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener('acciones_ud_guide_change', callback);
  };
}

export function getGuideSnapshot(): boolean {
  try {
    return localStorage.getItem('acciones_ud_hide_guide') === 'true';
  } catch {
    return false;
  }
}

export function getGuideServerSnapshot(): boolean {
  return false;
}

export function setGuideDismissedPreference(hide: boolean) {
  try {
    localStorage.setItem('acciones_ud_hide_guide', hide ? 'true' : 'false');
    window.dispatchEvent(new Event('acciones_ud_guide_change'));
  } catch {
    /* localStorage opcional */
  }
}

export interface AdvisorItem {
  id: string;
  name: string;
  license: string;
  licenseEn: string;
  photo: string;
  rating: string;
  success: string;
  proposals: number;
  assigned?: boolean;
  specialty: string;
  specialtyEn: string;
  bio: string;
  bioEn: string;
  strategy: string;
  strategyEn: string;
  recommendedAssets: string[];
}

export const advisorsData: AdvisorItem[] = [
  {
    id: 'carlos-rodriguez',
    name: 'Carlos Rodríguez, CFA',
    license: 'Licencia AMV #UD-ADV-042 · Wall Street',
    licenseEn: 'AMV License #UD-ADV-042 · Wall Street',
    photo: '/advisors/advisor-1.jpg',
    rating: '4.9',
    success: '94.2%',
    proposals: 184,
    assigned: true,
    specialty: 'NYSE & NASDAQ Tech · S&P 500 Large Cap',
    specialtyEn: 'NYSE & NASDAQ Tech · S&P 500 Large Cap',
    bio: 'Más de 12 años de trayectoria estructurando portafolios bursátiles en Wall Street. Enfoque disciplinado en compañías de alta capitalización, dividendos crecientes y análisis financiero de valor.',
    bioEn:
      'Over 12 years structuring Wall Street equity portfolios. Disciplined focus on large-cap leaders, dividend growth, and fundamental value research.',
    strategy:
      'Estrategia de Dividend Growth & Cash Flow con cobertura en opciones y asignación dinámica entre acciones líderes del S&P 500 y activos defensivos en USD.',
    strategyEn:
      'Dividend Growth & Cash Flow strategy with dynamic allocation across S&P 500 market leaders and defensive USD holdings.',
    recommendedAssets: ['AAPL', 'MSFT', 'JPM', 'SPY'],
  },
  {
    id: 'ana-morales',
    name: 'Ana María Morales, MSc',
    license: 'Licencia AMV #UD-ADV-019 · NYSE Commodities',
    licenseEn: 'AMV License #UD-ADV-019 · NYSE Commodities',
    photo: '/advisors/advisor-2.jpg',
    rating: '4.85',
    success: '91.8%',
    proposals: 142,
    specialty: 'NYSE · Energía, Minería & Materias Primas',
    specialtyEn: 'NYSE · Energy, Mining & Commodities',
    bio: 'Magíster en Finanzas Cuantitativas con especialidad en el sector energético global y materias primas cotizadas en Wall Street. Experiencia en macroeconomía y ciclos de inflación.',
    bioEn:
      'MSc in Quantitative Finance specializing in global energy and Wall Street commodity equities, macro cycles, and inflation hedging.',
    strategy:
      'Ciclos de materias primas y valor relativo con coberturas cambiarias y exposición a productores de energía con balance sólido y flujo de caja libre.',
    strategyEn:
      'Commodity cycle and relative-value positioning targeting energy producers with resilient balance sheets and strong free cash flow.',
    recommendedAssets: ['CVX', 'XOM', 'FCX', 'GLD'],
  },
  {
    id: 'felipe-tanaka',
    name: 'Felipe Tanaka',
    license: 'Licencia AMV #UD-ADV-088 · NASDAQ Tech',
    licenseEn: 'AMV License #UD-ADV-088 · NASDAQ Tech',
    photo: '/advisors/advisor-3.jpg',
    rating: '4.95',
    success: '96.5%',
    proposals: 210,
    specialty: 'NASDAQ · Inteligencia Artificial & Semiconductores',
    specialtyEn: 'NASDAQ · Artificial Intelligence & Semiconductors',
    bio: 'Pionero en análisis técnico algorítmico y momentum en firmas tecnológicas de vanguardia. Rastreo directo de innovación en silicio, centros de datos e infraestructura de IA.',
    bioEn:
      'Specialist in quantitative momentum and technical structure for frontier tech equities, tracking silicon, data-center, and AI infrastructure.',
    strategy:
      'Momentum cuantitativo en semiconductores y líderes de software de IA con stop-loss disciplinado y tomas de ganancias progresivas.',
    strategyEn:
      'Quantitative momentum across semiconductor and AI software leaders paired with disciplined risk limits and staged profit-taking.',
    recommendedAssets: ['NVDA', 'TSM', 'AMD', 'AVGO'],
  },
  {
    id: 'valentina-gomez',
    name: 'Valentina Gómez Restrepo',
    license: 'Licencia AMV #UD-ADV-053 · S&P 500',
    licenseEn: 'AMV License #UD-ADV-053 · S&P 500',
    photo: '/advisors/advisor-4.jpg',
    rating: '4.88',
    success: '93.0%',
    proposals: 165,
    specialty: 'S&P 500 · Dividend Aristocrats & Valor',
    specialtyEn: 'S&P 500 · Dividend Aristocrats & Value',
    bio: 'Especialista en portafolios defensivos y preservación de patrimonio a largo plazo en dólares. Análisis exhaustivo de empresas con más de 25 años incrementando dividendos.',
    bioEn:
      'Defensive equity specialist focused on long-term USD capital preservation and companies with 25+ years of consecutive dividend increases.',
    strategy:
      'Indexación ponderada por dividendos y reinversión compuesta, minimizando volatilidad y protegiendo contra caídas abruptas del mercado.',
    strategyEn:
      'Dividend-weighted allocation with disciplined compounding to dampen volatility and cushion market drawdowns.',
    recommendedAssets: ['PG', 'KO', 'PEP', 'JNJ'],
  },
  {
    id: 'mateo-benavides',
    name: 'Mateo Benavides, MBA',
    license: 'Licencia AMV #UD-ADV-071 · NYSE Arca',
    licenseEn: 'AMV License #UD-ADV-071 · NYSE Arca',
    photo: '/advisors/advisor-5.jpg',
    rating: '4.82',
    success: '90.4%',
    proposals: 128,
    specialty: 'NYSE Arca · ETFs Sectoriales & Rebalanceo',
    specialtyEn: 'NYSE Arca · Sector ETFs & Rebalancing',
    bio: 'MBA con amplia experiencia en fondos cotizados (ETFs), asignación multiactivo y optimización de costes operacionales en plataformas de corretaje de EE. UU.',
    bioEn:
      'MBA experienced in U.S. exchange-traded funds (ETFs), multi-asset allocation, and cost-efficient execution workflows.',
    strategy:
      'Asignación táctica de activos mediante ETFs de bajo coste con rebalanceo trimestral automático para capturar rotaciones sectoriales en Nueva York.',
    strategyEn:
      'Tactical allocation across low-cost sector ETFs with structured quarterly rebalancing to capture New York market rotations.',
    recommendedAssets: ['QQQ', 'VOO', 'IWM', 'XLK'],
  },
];
