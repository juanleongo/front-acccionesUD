/** Modelo de presentación; datos del mockup, no DTO ni sesión autenticada. */
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
  user: { name: 'Juan Pérez', initials: 'JP' },
  accountValue: '$142,250.00',
  metrics: [
    {
      title: 'Dinero total de tu cuenta',
      description: 'Tu efectivo libre + valor de acciones',
      value: '$142,250.00',
      note: '↗ Has ganado +$9,218.50 (+7.1%) en total',
      tone: 'blue',
      icon: 'wallet',
    },
    {
      title: 'Efectivo disponible',
      description: 'Dinero libre para comprar acciones ya',
      value: '$34,450.00',
      note: 'Listo para invertir en cualquier bolsa',
      tone: 'accent',
      icon: 'coin',
    },
    {
      title: 'Dinero en órdenes pendientes',
      description: 'Reservado para compras en espera',
      value: '$8,367.50',
      note: '● Apartado para 3 compras pendientes',
      tone: 'warning',
      icon: 'lock',
    },
    {
      title: 'Ganancias netas este mes',
      description: 'Resultado de tus ventas de marzo',
      value: '+$3,418.20',
      note: 'Ganancia neta cerrada · Sin pérdidas',
      tone: 'green',
      icon: 'shield',
    },
  ],
  stocks: [
    {
      symbol: 'AAPL',
      name: 'Apple Inc.',
      sector: 'Tecnología',
      exchange: 'NASDAQ',
      price: '$172.50 USD',
      change: '+1.79% (+$3.05)',
      negative: false,
    },
    {
      symbol: 'TSLA',
      name: 'Tesla Inc.',
      sector: 'Vehículos Eléctricos',
      exchange: 'NASDAQ',
      price: '$195.80 USD',
      change: '+4.08% (+$7.70)',
      negative: false,
    },
    {
      symbol: 'BANC',
      name: 'Santander UK',
      sector: 'Servicios Bancarios',
      exchange: 'Londres (LSE)',
      price: '£398.60 GBP',
      change: '-0.42% (-£1.70)',
      negative: true,
    },
  ],
};
