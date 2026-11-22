import type { Locale } from '@/lib/i18n/locale';

/** Modelo de presentación del dashboard; valores ilustrativos en mercados de EE. UU. (USD). */
export interface DashboardView {
  user: { name: string; initials: string };
  accountValue: string;
  metrics: {
    title: string;
    titleEn: string;
    description: string;
    descriptionEn: string;
    value: string;
    note: string;
    noteEn: string;
    tone: 'blue' | 'accent' | 'warning' | 'green';
    icon: 'wallet' | 'coin' | 'lock' | 'shield';
  }[];
  stocks: {
    symbol: string;
    name: string;
    sector: string;
    sectorEn: string;
    exchange: string;
    price: string;
    change: string;
    negative: boolean;
  }[];
}

export const dashboardPreview: DashboardView = {
  user: { name: 'Inversionista UD', initials: 'UD' },
  accountValue: '$100,000.00',
  metrics: [
    {
      title: 'Dinero total de tu cuenta',
      titleEn: 'Total Account Balance',
      description: 'Efectivo libre + valor de acciones en EE. UU.',
      descriptionEn: 'Available cash + U.S. stock market value',
      value: '$100,000.00',
      note: '↗ Capital de simulación en Wall Street (USD)',
      noteEn: '↗ Simulated Wall Street capital (USD)',
      tone: 'blue',
      icon: 'wallet',
    },
    {
      title: 'Efectivo disponible',
      titleEn: 'Available Cash',
      description: 'Saldo libre para operar en NYSE y NASDAQ',
      descriptionEn: 'Ready to trade on NYSE and NASDAQ',
      value: '$64,450.00',
      note: 'Listo para invertir en bolsas de EE. UU.',
      noteEn: 'Ready to invest in U.S. exchanges',
      tone: 'accent',
      icon: 'coin',
    },
    {
      title: 'Dinero en órdenes pendientes',
      titleEn: 'Reserved in Pending Orders',
      description: 'Reservado para compras en espera de ejecución',
      descriptionEn: 'Reserved for open buy orders awaiting execution',
      value: '$8,367.50',
      note: '● Apartado para órdenes en mercados de EE. UU.',
      noteEn: '● Held for open U.S. market orders',
      tone: 'warning',
      icon: 'lock',
    },
    {
      title: 'Rendimiento acumulado',
      titleEn: 'Cumulative Return',
      description: 'Resultado de operaciones en dólares (USD)',
      descriptionEn: 'Realized and unrealized trading gain (USD)',
      value: '+$3,418.20',
      note: 'Rentabilidad simulada · Mercados USA',
      noteEn: 'Simulated performance · U.S. Markets',
      tone: 'green',
      icon: 'shield',
    },
  ],
  stocks: [
    {
      symbol: 'AAPL',
      name: 'Apple Inc.',
      sector: 'Tecnología & Semiconductores',
      sectorEn: 'Technology & Semiconductors',
      exchange: 'NASDAQ',
      price: '$172.50 USD',
      change: '+1.79% (+$3.05)',
      negative: false,
    },
    {
      symbol: 'TSLA',
      name: 'Tesla, Inc.',
      sector: 'Vehículos Eléctricos & Energía',
      sectorEn: 'Electric Vehicles & Clean Energy',
      exchange: 'NASDAQ',
      price: '$195.80 USD',
      change: '+4.08% (+$7.70)',
      negative: false,
    },
    {
      symbol: 'JPM',
      name: 'JPMorgan Chase & Co.',
      sector: 'Sector Financiero & Banca USA',
      sectorEn: 'Financials & U.S. Banking',
      exchange: 'NYSE',
      price: '$198.20 USD',
      change: '+1.15% (+$2.25)',
      negative: false,
    },
  ],
};

export function localizeMetricText(
  metric: DashboardView['metrics'][number],
  locale: Locale,
) {
  return locale === 'en'
    ? {
        title: metric.titleEn,
        description: metric.descriptionEn,
        note: metric.noteEn,
      }
    : {
        title: metric.title,
        description: metric.description,
        note: metric.note,
      };
}
