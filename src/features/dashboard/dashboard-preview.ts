/** Modelo de presentación del dashboard; valores ilustrativos en mercados de EE. UU. (USD). */
export interface DashboardView {
  user: { name: string; initials: string };
  accountValue: string;
  metrics: {
    title: string;
    description: string;
    value: string;
    note: string;
    tone: 'blue' | 'accent' | 'warning' | 'green';
    icon: 'wallet' | 'coin' | 'lock' | 'shield';
  }[];
  stocks: {
    symbol: string;
    name: string;
    sector: string;
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
      description: 'Efectivo libre + valor de acciones en EE. UU.',
      value: '$100,000.00',
      note: '↗ Capital de simulación en Wall Street (USD)',
      tone: 'blue',
      icon: 'wallet',
    },
    {
      title: 'Efectivo disponible',
      description: 'Saldo libre para operar en NYSE y NASDAQ',
      value: '$64,450.00',
      note: 'Listo para invertir en bolsas de EE. UU.',
      tone: 'accent',
      icon: 'coin',
    },
    {
      title: 'Dinero en órdenes pendientes',
      description: 'Reservado para compras en espera de ejecución',
      value: '$8,367.50',
      note: '● Apartado para órdenes en mercados de EE. UU.',
      tone: 'warning',
      icon: 'lock',
    },
    {
      title: 'Rendimiento acumulado',
      description: 'Resultado de operaciones en dólares (USD)',
      value: '+$3,418.20',
      note: 'Rentabilidad simulada · Mercados USA',
      tone: 'green',
      icon: 'shield',
    },
  ],
  stocks: [
    {
      symbol: 'AAPL',
      name: 'Apple Inc.',
      sector: 'Tecnología & Semiconductores',
      exchange: 'NASDAQ',
      price: '$172.50 USD',
      change: '+1.79% (+$3.05)',
      negative: false,
    },
    {
      symbol: 'TSLA',
      name: 'Tesla, Inc.',
      sector: 'Vehículos Eléctricos & Energía',
      exchange: 'NASDAQ',
      price: '$195.80 USD',
      change: '+4.08% (+$7.70)',
      negative: false,
    },
    {
      symbol: 'JPM',
      name: 'JPMorgan Chase & Co.',
      sector: 'Sector Financiero & Banca USA',
      exchange: 'NYSE',
      price: '$198.20 USD',
      change: '+1.15% (+$2.25)',
      negative: false,
    },
  ],
};
