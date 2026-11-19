'use client';

import type { IconName } from '@/components/ui/Icon';

export type DashboardSection =
  'dashboard' | 'markets' | 'orders' | 'portfolio' | 'funds' | 'advisors';

export const navItems: ReadonlyArray<{
  id: DashboardSection;
  label: string;
  icon: IconName;
}> = [
  { id: 'dashboard', label: 'Dashboard', icon: 'grid' },
  { id: 'markets', label: 'Mercados en Vivo', icon: 'trend' },
  { id: 'orders', label: 'Terminal de Órdenes', icon: 'devices' },
  { id: 'portfolio', label: 'Portafolio', icon: 'pie' },
  { id: 'funds', label: 'Depósitos & Retiros', icon: 'wallet' },
  { id: 'advisors', label: 'Comisionistas', icon: 'users' },
];

export const sectionTitles: Record<DashboardSection, string> = {
  dashboard: 'Panel de Control · Resumen General',
  markets: 'Mercados en Vivo · Cotizaciones de Wall Street',
  orders: 'Terminal de Órdenes · Ejecución en NYSE & NASDAQ',
  portfolio: 'Portafolio de Inversión · Posiciones Activas',
  funds: 'Depósitos & Retiros · Gestión de Fondos Simulados (USD)',
  advisors: 'Comisionistas Bursátiles · Directorio de Asesores',
};

export const accountStatusLabels: Record<string, string> = {
  active: 'Activa',
  pending_broker_activation: 'Pendiente de activación',
  disabled: 'Suspendida',
};

export const roleLabels: Record<string, string> = {
  investor: 'Inversionista Bursátil',
  broker: 'Comisionista Certificado',
  administrator: 'Administrador',
};

export const kycStatusLabels: Record<string, string> = {
  ACTIVE: 'Verificada y activa',
  SUBMITTED: 'En revisión por custodio',
  ACTION_REQUIRED: 'Requiere información adicional',
  APPROVED: 'Aprobada',
  REJECTED: 'Rechazada',
};

export function formatUserRoles(roles?: readonly string[]): string {
  if (!roles || roles.length === 0) return 'Inversionista Bursátil';
  return roles.map((r) => roleLabels[r] ?? r).join(' · ');
}

export function formatKycStatus(
  rawStatus: string | null | undefined,
  hasRealAccount: boolean,
): string {
  if (rawStatus) {
    return kycStatusLabels[rawStatus.toUpperCase()] ?? rawStatus;
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
  photo: string;
  rating: string;
  success: string;
  proposals: number;
  assigned?: boolean;
  specialty: string;
  bio: string;
  strategy: string;
  recommendedAssets: string[];
}

export const advisorsData: AdvisorItem[] = [
  {
    id: 'carlos-rodriguez',
    name: 'Carlos Rodríguez, CFA',
    license: 'Licencia AMV #UD-ADV-042 · Wall Street',
    photo: '/advisors/advisor-1.jpg',
    rating: '4.9 de 5.0',
    success: '94.2%',
    proposals: 184,
    assigned: true,
    specialty: 'NYSE & NASDAQ Tech · S&P 500 Large Cap',
    bio: 'Más de 12 años de trayectoria estructurando portafolios bursátiles en Wall Street. Enfoque disciplinado en compañías de alta capitalización, dividendos crecientes y análisis financiero de valor.',
    strategy:
      'Estrategia de Dividend Growth & Cash Flow con cobertura en opciones y asignación dinámica entre acciones líderes del S&P 500 y activos defensivos en USD.',
    recommendedAssets: ['AAPL', 'MSFT', 'JPM', 'SPY'],
  },
  {
    id: 'ana-morales',
    name: 'Ana María Morales, MSc',
    license: 'Licencia AMV #UD-ADV-019 · NYSE Commodities',
    photo: '/advisors/advisor-2.jpg',
    rating: '4.85 de 5.0',
    success: '91.8%',
    proposals: 142,
    specialty: 'NYSE · Energía, Minería & Materias Primas',
    bio: 'Magíster en Finanzas Cuantitativas con especialidad en el sector energético global y materias primas cotizadas en Wall Street. Experiencia en macroeconomía y ciclos de inflación.',
    strategy:
      'Ciclos de materias primas y valor relativo con coberturas cambiarias y exposición a productores de energía con balance sólido y flujo de caja libre.',
    recommendedAssets: ['CVX', 'XOM', 'FCX', 'GLD'],
  },
  {
    id: 'felipe-tanaka',
    name: 'Felipe Tanaka',
    license: 'Licencia AMV #UD-ADV-088 · NASDAQ Tech',
    photo: '/advisors/advisor-3.jpg',
    rating: '4.95 de 5.0',
    success: '96.5%',
    proposals: 210,
    specialty: 'NASDAQ · Inteligencia Artificial & Semiconductores',
    bio: 'Pionero en análisis técnico algorítmico y momentum en firmas tecnológicas de vanguardia. Rastreo directo de innovación en silicio, centros de datos e infraestructura de IA.',
    strategy:
      'Momentum cuantitativo en semiconductores y líderes de software de IA con stop-loss disciplinado y tomas de ganancias progresivas.',
    recommendedAssets: ['NVDA', 'TSM', 'AMD', 'AVGO'],
  },
  {
    id: 'valentina-gomez',
    name: 'Valentina Gómez Restrepo',
    license: 'Licencia AMV #UD-ADV-053 · S&P 500',
    photo: '/advisors/advisor-4.jpg',
    rating: '4.88 de 5.0',
    success: '93.0%',
    proposals: 165,
    specialty: 'S&P 500 · Dividend Aristocrats & Valor',
    bio: 'Especialista en portafolios defensivos y preservación de patrimonio a largo plazo en dólares. Análisis exhaustivo de empresas con más de 25 años incrementando dividendos.',
    strategy:
      'Indexación ponderada por dividendos y reinversión compuesta, minimizando volatilidad y protegiendo contra caídas abruptas del mercado.',
    recommendedAssets: ['PG', 'KO', 'PEP', 'JNJ'],
  },
  {
    id: 'mateo-benavides',
    name: 'Mateo Benavides, MBA',
    license: 'Licencia AMV #UD-ADV-071 · NYSE Arca',
    photo: '/advisors/advisor-5.jpg',
    rating: '4.82 de 5.0',
    success: '90.4%',
    proposals: 128,
    specialty: 'NYSE Arca · ETFs Sectoriales & Rebalanceo',
    bio: 'MBA con amplia experiencia en fondos cotizados (ETFs), asignación multiactivo y optimización de costes operacionales en plataformas de corretaje de EE. UU.',
    strategy:
      'Asignación táctica de activos mediante ETFs de bajo coste con rebalanceo trimestral automático para capturar rotaciones sectoriales en Nueva York.',
    recommendedAssets: ['QQQ', 'VOO', 'IWM', 'XLK'],
  },
];
