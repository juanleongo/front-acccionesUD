'use client';

export type OrderSide = 'buy' | 'sell';
export type OrderType = 'market' | 'limit' | 'stop_loss' | 'take_profit';
export type TimeInForce = 'DAY' | 'GTC' | 'IOC';
export type OrderStatus =
  | 'FILLED'
  | 'OPEN'
  | 'QUEUED_OUT_OF_HOURS'
  | 'REAUTHORIZATION_REQUIRED'
  | 'CANCELLED';

export interface TradingSymbol {
  symbol: string;
  name: string;
  exchange: 'NASDAQ' | 'NYSE' | 'NYSE Arca';
  priceUsd: number;
  changePct: number;
}

export interface OrderPreview {
  preview_id: string;
  symbol: string;
  side: OrderSide;
  order_type: OrderType;
  quantity: number;
  quoted_price_usd: number;
  limit_price_usd: number | null;
  stop_price_usd: number | null;
  subtotal_usd: number;
  platform_fee_usd: number;
  advisor_fee_usd: number;
  total_usd: number;
  expires_at_ms: number;
  ttl_seconds: number;
  market_open: boolean;
}

export interface OrderRecord {
  id: string;
  client_order_id: string;
  symbol: string;
  side: OrderSide;
  order_type: OrderType;
  time_in_force: TimeInForce;
  quantity: number;
  execution_price_usd: number | null;
  limit_price_usd: number | null;
  stop_price_usd: number | null;
  total_usd: number;
  status: OrderStatus;
  execution_source: 'Alpaca Sandbox (US)' | 'SimulatedExchangeAdapter';
  created_at: string;
}

export const TRADING_SYMBOLS: TradingSymbol[] = [
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    exchange: 'NASDAQ',
    priceUsd: 224.23,
    changePct: 1.42,
  },
  {
    symbol: 'TSLA',
    name: 'Tesla Inc.',
    exchange: 'NASDAQ',
    priceUsd: 218.4,
    changePct: -0.85,
  },
  {
    symbol: 'NVDA',
    name: 'NVIDIA Corp.',
    exchange: 'NASDAQ',
    priceUsd: 141.5,
    changePct: 3.18,
  },
  {
    symbol: 'MSFT',
    name: 'Microsoft Corp.',
    exchange: 'NASDAQ',
    priceUsd: 422.1,
    changePct: 0.64,
  },
  {
    symbol: 'AMZN',
    name: 'Amazon.com Inc.',
    exchange: 'NASDAQ',
    priceUsd: 186.3,
    changePct: 1.12,
  },
  {
    symbol: 'JPM',
    name: 'JPMorgan Chase & Co.',
    exchange: 'NYSE',
    priceUsd: 215.8,
    changePct: 0.35,
  },
  {
    symbol: 'SPY',
    name: 'SPDR S&P 500 ETF',
    exchange: 'NYSE Arca',
    priceUsd: 585.12,
    changePct: 0.78,
  },
];

export const INITIAL_MOCK_ORDERS: OrderRecord[] = [
  {
    id: 'ord-1001',
    client_order_id: 'cli-aapl-9012',
    symbol: 'AAPL',
    side: 'buy',
    order_type: 'market',
    time_in_force: 'DAY',
    quantity: 15,
    execution_price_usd: 221.5,
    limit_price_usd: null,
    stop_price_usd: null,
    total_usd: 3322.5,
    status: 'FILLED',
    execution_source: 'Alpaca Sandbox (US)',
    created_at: '11/11/2026 10:14 ET',
  },
  {
    id: 'ord-1002',
    client_order_id: 'cli-nvda-9013',
    symbol: 'NVDA',
    side: 'buy',
    order_type: 'limit',
    time_in_force: 'GTC',
    quantity: 40,
    execution_price_usd: null,
    limit_price_usd: 135.0,
    stop_price_usd: null,
    total_usd: 5400.0,
    status: 'OPEN',
    execution_source: 'Alpaca Sandbox (US)',
    created_at: '12/11/2026 11:30 ET',
  },
  {
    id: 'ord-1003',
    client_order_id: 'cli-tsla-9014',
    symbol: 'TSLA',
    side: 'sell',
    order_type: 'stop_loss',
    time_in_force: 'GTC',
    quantity: 10,
    execution_price_usd: null,
    limit_price_usd: null,
    stop_price_usd: 205.0,
    total_usd: 2050.0,
    status: 'OPEN',
    execution_source: 'Alpaca Sandbox (US)',
    created_at: '12/11/2026 14:05 ET',
  },
  {
    id: 'ord-1004',
    client_order_id: 'cli-msft-9015',
    symbol: 'MSFT',
    side: 'buy',
    order_type: 'limit',
    time_in_force: 'DAY',
    quantity: 5,
    execution_price_usd: null,
    limit_price_usd: 418.0,
    stop_price_usd: null,
    total_usd: 2090.0,
    status: 'REAUTHORIZATION_REQUIRED',
    execution_source: 'Alpaca Sandbox (US)',
    created_at: '13/11/2026 09:32 ET',
  },
  {
    id: 'ord-1005',
    client_order_id: 'cli-spy-9016',
    symbol: 'SPY',
    side: 'buy',
    order_type: 'market',
    time_in_force: 'DAY',
    quantity: 2,
    execution_price_usd: null,
    limit_price_usd: null,
    stop_price_usd: null,
    total_usd: 1170.24,
    status: 'QUEUED_OUT_OF_HOURS',
    execution_source: 'Alpaca Sandbox (US)',
    created_at: '13/11/2026 17:45 ET',
  },
];

export const ORDER_TYPE_META: Record<
  OrderType,
  {
    label: string;
    shortLabel: string;
    description: string;
    badge: string;
  }
> = {
  market: {
    label: 'Market Order (A Mercado)',
    shortLabel: 'Market',
    description:
      'Ejecución inmediata al mejor precio disponible en Wall Street.',
    badge: 'Inmediata',
  },
  limit: {
    label: 'Limit Order (Límite)',
    shortLabel: 'Limit',
    description:
      'Se ejecuta únicamente al precio límite indicado o uno más favorable. Reserva saldo.',
    badge: 'Precio Fijo',
  },
  stop_loss: {
    label: 'Stop Loss (Protección)',
    shortLabel: 'Stop Loss',
    description:
      'Activa orden automática para limitar pérdidas si la acción cae al nivel Stop.',
    badge: 'Gestión Riesgo',
  },
  take_profit: {
    label: 'Take Profit (Toma de Ganancia)',
    shortLabel: 'Take Profit',
    description:
      'Cierra o ejecuta posición automáticamente al alcanzar tu objetivo de ganancia.',
    badge: 'Objetivo',
  },
};
