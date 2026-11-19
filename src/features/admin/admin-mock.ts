export interface PendingBrokerItem {
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  country: string;
  licenseAMV: string;
  specialty: string;
  requestedAt: string;
  status: 'pending_broker_activation' | 'active';
}

export interface ManagedUserItem {
  userId: string;
  fullName: string;
  email: string;
  role: string;
  isPremium: boolean;
  accountStatus: string;
  registeredAt: string;
}

export const initialPendingBrokers: PendingBrokerItem[] = [
  {
    userId: 'aa3e17f1-1963-4f0c-adae-326154e65482',
    fullName: 'Juan José León',
    email: 'sursomartinez@gmail.com',
    phone: '+573115775108',
    country: 'CO',
    licenseAMV: 'AMV-11111 (Firma: leon)',
    specialty: 'Acciones de Crecimiento & ETFs en NYSE / NASDAQ',
    requestedAt: '12/Nov/2026 01:30',
    status: 'pending_broker_activation',
  },
  {
    userId: '89b43566-7fd8-4c7e-ac95-20a490c4de8e',
    fullName: 'Test Broker AR',
    email: 'test@test.com',
    phone: '+5711111111',
    country: 'AR',
    licenseAMV: 'AMV-AR-9901 (Firma Internacional)',
    specialty: 'Renta Variable y ADRs Latinoamericanos en Wall Street',
    requestedAt: '11/Nov/2026 13:12',
    status: 'pending_broker_activation',
  },
  {
    userId: '19f5fcb4-9a1d-4d3e-affe-96da0057cf2d',
    fullName: 'Prueba Ti (Comisionista Senior)',
    email: 'broker.ti@accionesud.com',
    phone: '+573001112235',
    country: 'CO',
    licenseAMV: 'LIC-001 (Firma de Prueba)',
    specialty: 'Activos de Alta Capitalización del S&P 500',
    requestedAt: '11/Nov/2026 15:03',
    status: 'active',
  },
  {
    userId: '39bf8e8a-d3ec-4172-82c5-99e9508ffce1',
    fullName: 'Broker Dos (Asesor Bursátil)',
    email: 'broker2.ti@accionesud.com',
    phone: '+573001112237',
    country: 'CO',
    licenseAMV: 'LIC-002 (Firma Dos)',
    specialty: 'Tecnología & Semiconductores en NASDAQ',
    requestedAt: '11/Nov/2026 15:09',
    status: 'active',
  },
];

export const initialManagedUsers: ManagedUserItem[] = [
  {
    userId: '9e4e5c80-92cb-46ec-a795-868bae8a8ef0',
    fullName: 'Daniel Sanabria Rivera',
    email: 'moto46play@gmail.com',
    role: 'investor',
    isPremium: true,
    accountStatus: 'active',
    registeredAt: '12/Nov/2026',
  },
  {
    userId: '75613e9a-678f-40a6-877f-54ccf3db1010',
    fullName: 'Juan León',
    email: 'fabioagus52@gmail.com',
    role: 'investor',
    isPremium: false,
    accountStatus: 'active',
    registeredAt: '12/Nov/2026',
  },
  {
    userId: '52c952ac-3fe5-4b0d-932c-bf920e7a1b4b',
    fullName: 'Initial Administrator',
    email: 'admin@accionesud.com',
    role: 'administrator',
    isPremium: true,
    accountStatus: 'active',
    registeredAt: '11/Nov/2026',
  },
  {
    userId: '932792e8-d8b7-43ac-a268-122eb5cfaea7',
    fullName: 'Admin Bootstrap TI',
    email: 'admin.ti@accionesud.com',
    role: 'administrator',
    isPremium: true,
    accountStatus: 'active',
    registeredAt: '11/Nov/2026',
  },
  {
    userId: 'afe9aa95-8f19-4593-bb42-fe7613792d0c',
    fullName: 'Admin Dos TI',
    email: 'admin2.ti@accionesud.com',
    role: 'administrator',
    isPremium: true,
    accountStatus: 'active',
    registeredAt: '11/Nov/2026',
  },
  {
    userId: '8c3bb02c-0618-4ee2-a6e0-046003d10673',
    fullName: 'Admin MFA Active',
    email: 'adminmfa.ti@accionesud.com',
    role: 'administrator',
    isPremium: true,
    accountStatus: 'active',
    registeredAt: '12/Nov/2026',
  },
  {
    userId: 'c0674321-9a64-4f13-9070-e57dfb35b4e8',
    fullName: 'Investor Test TI',
    email: 'investor.ti@accionesud.com',
    role: 'investor',
    isPremium: false,
    accountStatus: 'active',
    registeredAt: '11/Nov/2026',
  },
];

export const defaultSystemRoles: Array<{
  role: string;
  permissions: string[];
}> = [
  {
    role: 'administrator',
    permissions: [
      'admin:users',
      'admin:rbac',
      'admin:markets',
      'account:manage',
    ],
  },
  {
    role: 'broker',
    permissions: [
      'account:manage',
      'orders:execute',
      'advisors:propose',
      'portfolio:view',
    ],
  },
  {
    role: 'investor',
    permissions: [
      'account:manage',
      'orders:execute',
      'portfolio:view',
      'markets:read',
    ],
  },
];

export const defaultSystemPermissions: Array<{
  code: string;
  description: string;
}> = [
  {
    code: 'admin:users',
    description: 'Alta de administradores y activación de comisionistas AMV.',
  },
  {
    code: 'admin:rbac',
    description: 'Asignación, modificación y revocación de roles del sistema.',
  },
  {
    code: 'admin:markets',
    description: 'Gestión de horarios bursátiles y excepciones de Wall Street.',
  },
  {
    code: 'account:manage',
    description: 'Administración de perfil personal, MFA y preferencias.',
  },
  {
    code: 'orders:execute',
    description: 'Transmisión y cancelación de órdenes en NYSE y NASDAQ.',
  },
  {
    code: 'portfolio:view',
    description: 'Consulta de saldos en USD, posiciones y rendimientos.',
  },
  {
    code: 'markets:read',
    description: 'Lectura de cotizaciones bursátiles y velas en tiempo real.',
  },
];

export const initialMarketOverrides: Array<{
  id: string;
  market: string;
  date: string;
  closed: boolean;
  open_time: string | null;
  close_time: string | null;
}> = [
  {
    id: 'ov-01',
    market: 'NYSE',
    date: '2026-11-26',
    closed: false,
    open_time: '09:30',
    close_time: '13:00',
  },
  {
    id: 'ov-02',
    market: 'NASDAQ',
    date: '2026-11-26',
    closed: false,
    open_time: '09:30',
    close_time: '13:00',
  },
  {
    id: 'ov-03',
    market: 'NYSE',
    date: '2026-12-25',
    closed: true,
    open_time: null,
    close_time: null,
  },
  {
    id: 'ov-04',
    market: 'NASDAQ',
    date: '2026-12-25',
    closed: true,
    open_time: null,
    close_time: null,
  },
  {
    id: 'ov-05',
    market: 'AMEX',
    date: '2027-01-01',
    closed: true,
    open_time: null,
    close_time: null,
  },
];

export const initialAuditLogs: Array<{
  id: string;
  actor_user_id: string;
  action: string;
  target_type: string;
  target_id: string;
  payload: Record<string, unknown>;
  occurred_at: string;
}> = [
  {
    id: 'aud-01',
    actor_user_id: '52c952ac-3fe5-4b0d-932c-bf920e7a1b4b',
    action: 'broker_activated',
    target_type: 'user',
    target_id: '19f5fcb4-9a1d-4d3e-affe-96da0057cf2d',
    payload: { role: 'broker', status: 'active' },
    occurred_at: '2026-11-12T15:03:00Z',
  },
  {
    id: 'aud-02',
    actor_user_id: '52c952ac-3fe5-4b0d-932c-bf920e7a1b4b',
    action: 'premium_changed',
    target_type: 'user',
    target_id: '9e4e5c80-92cb-46ec-a795-868bae8a8ef0',
    payload: { is_premium: true },
    occurred_at: '2026-11-12T18:20:00Z',
  },
  {
    id: 'aud-03',
    actor_user_id: '52c952ac-3fe5-4b0d-932c-bf920e7a1b4b',
    action: 'administrator_created',
    target_type: 'user',
    target_id: 'afe9aa95-8f19-4593-bb42-fe7613792d0c',
    payload: { email: 'admin2.ti@accionesud.com' },
    occurred_at: '2026-11-11T16:10:00Z',
  },
];
