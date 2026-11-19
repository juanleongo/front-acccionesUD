export interface BrokerReputation {
  broker_id: string;
  name: string;
  average: string | number | null;
  reviews_count: number;
  converted_proposals: number;
  distinct_investors: number;
  years_experience: number;
  broker_since: string;
}

export interface BrokerDirectoryItem {
  id: string;
  name: string;
  firm_name: string;
  specialty: string;
  years_experience: number;
  certifications: string[];
  description?: string | undefined;
  avatarUrl?: string | undefined;
  reputation: BrokerReputation;
}

export interface BrokerReviewItem {
  stars: number;
  comment: string;
  created_at: string;
  updated_at: string;
}

export interface BrokerLinkRecord {
  id: string;
  investor_id: string;
  broker_id: string;
  broker: {
    id: string;
    name: string;
    firm_name: string;
  };
  status:
    'requested' | 'active' | 'declined' | 'canceled' | 'expired' | 'ended';
  requested_at: string;
  expires_at: string;
  responded_at: string | null;
  started_at: string | null;
  ended_at: string | null;
  decline_reason: string | null;
  end_reason: string | null;
  consent_version: string;
  consent_accepted_at: string;
  order_review_enabled: boolean;
}

export interface TradingAuthorizationRecord {
  id: string;
  link_id: string;
  consent_version: string;
  granted_at: string;
  revoked_at: string | null;
  revoke_reason: 'investor' | 'link_ended' | null;
}

export interface CurrentBrokerLinkData {
  link: BrokerLinkRecord | null;
  trading_authorization: TradingAuthorizationRecord | null;
  pending_broker_selection: boolean;
  suggestions: BrokerDirectoryItem[];
}

export interface ProposalItem {
  id: string;
  link_id: string;
  status:
    | 'sent'
    | 'accepted'
    | 'rejected'
    | 'withdrawn'
    | 'approved'
    | 'declined_by_broker'
    | 'conversion_failed'
    | 'expired';
  status_reason: string | null;
  current_version: number;
  accepted_version: number | null;
  order_id: string | null;
  failure_code: string | null;
  broker: { id: string; name: string };
  investor: { id: string; name: string };
  symbol: string;
  side: 'buy' | 'sell';
  qty: string;
  type: 'market' | 'limit';
  limit_price?: string | null | undefined;
  estimated_cost: string;
  created_at: string;
  updated_at: string;
  expires_at: string;
}

export interface ProposalChatMessage {
  id: string;
  proposal_id: string;
  author_id: string;
  body: string;
  created_at: string;
}

export interface BrokerPendingRequest {
  id: string;
  investor_id: string;
  investor_name: string;
  requested_at: string;
}

export interface BrokerClientItem {
  investor_id: string;
  name: string;
  link_id: string;
  since: string;
  trading_authorized: boolean;
  order_review_enabled: boolean;
}

export const INITIAL_BROKERS_DIRECTORY: BrokerDirectoryItem[] = [
  {
    id: 'a0112233-4455-6677-8899-aabbccddeeff',
    name: 'Carlos Andrés Rodríguez MSc.',
    firm_name: 'Andes Capital & Wall Street Advisory',
    specialty: 'Tecnología, Semiconductores & S&P 500 (NASDAQ / NYSE)',
    years_experience: 11,
    certifications: ['FINRA Series 7', 'CFA Level III', 'AMV Renta Variable'],
    description:
      'Estratega senior en acciones de gran capitalización en EE. UU., cobertura cambiaria USD y carteras de crecimiento tecnológico.',
    avatarUrl:
      'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=240&auto=format&fit=crop&q=80',
    reputation: {
      broker_id: 'a0112233-4455-6677-8899-aabbccddeeff',
      name: 'Carlos Andrés Rodríguez MSc.',
      average: '4.9',
      reviews_count: 128,
      converted_proposals: 342,
      distinct_investors: 64,
      years_experience: 11,
      broker_since: '2019-03-15T00:00:00Z',
    },
  },
  {
    id: 'b1223344-5566-7788-99aa-bbccddeeff00',
    name: 'Valentina Morales CFA',
    firm_name: 'Distrital Global Equity Partners',
    specialty: 'ETFs Indexados, Dividendos & Renta Variable Conservadora',
    years_experience: 8,
    certifications: ['CFA Charterholder', 'FINRA Series 63'],
    description:
      'Especialista en construcción de portafolios diversificados con ETFs (SPY, QQQ, VTI) y gestión estricta de riesgo.',
    avatarUrl:
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=240&auto=format&fit=crop&q=80',
    reputation: {
      broker_id: 'b1223344-5566-7788-99aa-bbccddeeff00',
      name: 'Valentina Morales CFA',
      average: '4.8',
      reviews_count: 94,
      converted_proposals: 215,
      distinct_investors: 49,
      years_experience: 8,
      broker_since: '2020-07-01T00:00:00Z',
    },
  },
  {
    id: 'c2334455-6677-8899-aabb-ccddeeff0011',
    name: 'Sebastián Salazar PhD',
    firm_name: 'Quant & AI Trading Desk',
    specialty: 'Inteligencia Artificial, Cloud & Momentum Trading',
    years_experience: 9,
    certifications: ['CQF Quantitative Finance', 'FINRA Series 7'],
    description:
      'Análisis cuantitativo de flujo institucional en NASDAQ, ejecución algorítmica de órdenes límite y cobertura sectorial.',
    avatarUrl:
      'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=240&auto=format&fit=crop&q=80',
    reputation: {
      broker_id: 'c2334455-6677-8899-aabb-ccddeeff0011',
      name: 'Sebastián Salazar PhD',
      average: '5.0',
      reviews_count: 87,
      converted_proposals: 290,
      distinct_investors: 52,
      years_experience: 9,
      broker_since: '2021-01-10T00:00:00Z',
    },
  },
];

export const INITIAL_CURRENT_LINK: CurrentBrokerLinkData = {
  link: {
    id: 'd3445566-7788-99aa-bbcc-ddeeff001122',
    investor_id: 'e4556677-8899-aabb-ccdd-eeff00112233',
    broker_id: 'a0112233-4455-6677-8899-aabbccddeeff',
    broker: {
      id: 'a0112233-4455-6677-8899-aabbccddeeff',
      name: 'Carlos Andrés Rodríguez MSc.',
      firm_name: 'Andes Capital & Wall Street Advisory',
    },
    status: 'active',
    requested_at: '2026-10-15T14:00:00Z',
    expires_at: '2026-10-22T14:00:00Z',
    responded_at: '2026-10-15T15:10:00Z',
    started_at: '2026-10-15T15:10:00Z',
    ended_at: null,
    decline_reason: null,
    end_reason: null,
    consent_version: 'v1',
    consent_accepted_at: '2026-10-15T14:00:00Z',
    order_review_enabled: true,
  },
  trading_authorization: {
    id: 'f5667788-99aa-bbcc-ddee-ff0011223344',
    link_id: 'd3445566-7788-99aa-bbcc-ddeeff001122',
    consent_version: 'v1',
    granted_at: '2026-10-15T15:30:00Z',
    revoked_at: null,
    revoke_reason: null,
  },
  pending_broker_selection: false,
  suggestions: INITIAL_BROKERS_DIRECTORY,
};

export const INITIAL_PROPOSALS: ProposalItem[] = [
  {
    id: '90112233-4455-6677-8899-aabbccddeeff',
    link_id: 'd3445566-7788-99aa-bbcc-ddeeff001122',
    status: 'sent',
    status_reason: null,
    current_version: 1,
    accepted_version: null,
    order_id: null,
    failure_code: null,
    broker: {
      id: 'a0112233-4455-6677-8899-aabbccddeeff',
      name: 'Carlos Andrés Rodríguez MSc.',
    },
    investor: {
      id: 'e4556677-8899-aabb-ccdd-eeff00112233',
      name: 'Inversionista Acciones UD',
    },
    symbol: 'NVDA',
    side: 'buy',
    qty: '5',
    type: 'limit',
    limit_price: '885.00',
    estimated_cost: '4513.50',
    created_at: '2026-11-17T14:20:00Z',
    updated_at: '2026-11-17T14:20:00Z',
    expires_at: '2026-11-20T14:20:00Z',
  },
  {
    id: '80223344-5566-7788-99aa-bbccddeeff11',
    link_id: 'd3445566-7788-99aa-bbcc-ddeeff001122',
    status: 'approved',
    status_reason: 'Orden ejecutada y firmada con evidencia en chat',
    current_version: 1,
    accepted_version: 1,
    order_id: '41e92a11-7b20-4c9a-88ef-001122334455',
    failure_code: null,
    broker: {
      id: 'a0112233-4455-6677-8899-aabbccddeeff',
      name: 'Carlos Andrés Rodríguez MSc.',
    },
    investor: {
      id: 'e4556677-8899-aabb-ccdd-eeff00112233',
      name: 'Inversionista Acciones UD',
    },
    symbol: 'AAPL',
    side: 'buy',
    qty: '15',
    type: 'market',
    limit_price: null,
    estimated_cost: '2729.52',
    created_at: '2026-11-12T15:00:00Z',
    updated_at: '2026-11-12T15:35:00Z',
    expires_at: '2026-11-15T15:00:00Z',
  },
];

export const INITIAL_PROPOSAL_MESSAGES: Record<string, ProposalChatMessage[]> =
  {
    '90112233-4455-6677-8899-aabbccddeeff': [
      {
        id: 'msg-001',
        proposal_id: '90112233-4455-6677-8899-aabbccddeeff',
        author_id: 'a0112233-4455-6677-8899-aabbccddeeff',
        body: 'Hola, te envío esta propuesta de compra límite en NVDA a $885.00 USD aprovechando el retroceso técnico intradía en NASDAQ.',
        created_at: '2026-11-17T14:21:00Z',
      },
      {
        id: 'msg-002',
        proposal_id: '90112233-4455-6677-8899-aabbccddeeff',
        author_id: 'e4556677-8899-aabb-ccdd-eeff00112233',
        body: 'Excelente Carlos, reviso el precio límite y procedo a autorizar con mi código 2FA.',
        created_at: '2026-11-17T14:28:00Z',
      },
    ],
  };

export const INITIAL_BROKER_REVIEWS: Record<string, BrokerReviewItem[]> = {
  'a0112233-4455-6677-8899-aabbccddeeff': [
    {
      stars: 5,
      comment:
        'Excelente acompañamiento en la apertura de posiciones en semiconductores y respuesta inmediata en las propuestas.',
      created_at: '2026-11-10T16:00:00Z',
      updated_at: '2026-11-10T16:00:00Z',
    },
    {
      stars: 5,
      comment: 'Muy claro con la gestión de riesgo y órdenes límite en NYSE.',
      created_at: '2026-11-02T11:30:00Z',
      updated_at: '2026-11-02T11:30:00Z',
    },
  ],
};

export const INITIAL_BROKER_REQUESTS: BrokerPendingRequest[] = [
  {
    id: 'req-77889900-1122-3344-5566-778899aabbcc',
    investor_id: 'inv-99887766-5544-3322-1100-ffeeddccbbaa',
    investor_name: 'María Fernanda Vélez Benítez',
    requested_at: '2026-11-18T11:15:00Z',
  },
];

export const INITIAL_BROKER_CLIENTS: BrokerClientItem[] = [
  {
    investor_id: 'e4556677-8899-aabb-ccdd-eeff00112233',
    name: 'Juan José León Gómez',
    link_id: 'd3445566-7788-99aa-bbcc-ddeeff001122',
    since: '2026-10-15T15:10:00Z',
    trading_authorized: true,
    order_review_enabled: true,
  },
  {
    investor_id: 'f6778899-0011-2233-4455-66778899aabb',
    name: 'Davidson Esfleider Sánchez Gordillo',
    link_id: '11223344-5566-7788-99aa-bbccddeeff22',
    since: '2026-10-20T09:40:00Z',
    trading_authorized: true,
    order_review_enabled: false,
  },
];
