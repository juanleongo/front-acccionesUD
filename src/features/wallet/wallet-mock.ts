'use client';

export type CurrencyCode = 'USD' | 'COP' | 'EUR' | 'GBP';

export type LedgerTxType =
  | 'DEPOSIT'
  | 'WITHDRAWAL'
  | 'ORDER_RESERVATION'
  | 'ORDER_RELEASE'
  | 'TRADE_SETTLEMENT'
  | 'COMMISSION';

export interface WalletBalance {
  currency: 'USD';
  available_balance_usd: number;
  reserved_balance_usd: number;
  invested_equity_usd: number;
}

export interface FxRate {
  pair: string;
  currency: Exclude<CurrencyCode, 'USD'>;
  name: string;
  unitsPerUsd: number;
  usdPerUnit: number;
  validUntil: string;
}

export interface LedgerTransaction {
  id: string;
  tx_type: LedgerTxType;
  concept: string;
  original_currency: CurrencyCode;
  original_amount: number;
  amount_usd: number;
  fee_usd: number;
  balance_after_usd: number;
  external_ref: string;
  status: 'COMPLETADO' | 'RESERVADO' | 'LIQUIDADO';
  created_at: string;
}

export const FX_RATES: FxRate[] = [
  {
    pair: 'USD/COP',
    currency: 'COP',
    name: 'Peso Colombiano',
    unitsPerUsd: 4320.0,
    usdPerUnit: 1 / 4320.0,
    validUntil: 'Actualizado hace 1 min',
  },
  {
    pair: 'USD/EUR',
    currency: 'EUR',
    name: 'Euro',
    unitsPerUsd: 0.92,
    usdPerUnit: 1 / 0.92,
    validUntil: 'Actualizado hace 1 min',
  },
  {
    pair: 'USD/GBP',
    currency: 'GBP',
    name: 'Libra Esterlina',
    unitsPerUsd: 0.78,
    usdPerUnit: 1 / 0.78,
    validUntil: 'Actualizado hace 1 min',
  },
];

export const INITIAL_WALLET_BALANCE: WalletBalance = {
  currency: 'USD',
  available_balance_usd: 64450.0,
  reserved_balance_usd: 8420.0,
  invested_equity_usd: 27130.0,
};

export const INITIAL_LEDGER_TRANSACTIONS: LedgerTransaction[] = [
  {
    id: 'tx-5001',
    tx_type: 'DEPOSIT',
    concept: 'Apertura de Cuenta Simulación (COP → USD)',
    original_currency: 'COP',
    original_amount: 432000000,
    amount_usd: 100000.0,
    fee_usd: 0.0,
    balance_after_usd: 100000.0,
    external_ref: 'STRIPE-SIM-001',
    status: 'COMPLETADO',
    created_at: '11/11/2026 09:00',
  },
  {
    id: 'tx-5002',
    tx_type: 'TRADE_SETTLEMENT',
    concept: 'Compra 15 AAPL (Wall Street · NASDAQ)',
    original_currency: 'USD',
    original_amount: 3322.5,
    amount_usd: -3322.5,
    fee_usd: 66.45,
    balance_after_usd: 96677.5,
    external_ref: 'ORD-1001',
    status: 'LIQUIDADO',
    created_at: '11/11/2026 10:14',
  },
  {
    id: 'tx-5003',
    tx_type: 'ORDER_RESERVATION',
    concept: 'Reserva por Orden Límite NVDA (40 acc @ $135)',
    original_currency: 'USD',
    original_amount: 5400.0,
    amount_usd: -5400.0,
    fee_usd: 0.0,
    balance_after_usd: 91277.5,
    external_ref: 'ORD-1002',
    status: 'RESERVADO',
    created_at: '12/11/2026 11:30',
  },
  {
    id: 'tx-5004',
    tx_type: 'DEPOSIT',
    concept: 'Recarga Adicional en Euros (EUR → USD)',
    original_currency: 'EUR',
    original_amount: 2500.0,
    amount_usd: 2717.39,
    fee_usd: 12.5,
    balance_after_usd: 93982.39,
    external_ref: 'STRIPE-SIM-049',
    status: 'COMPLETADO',
    created_at: '13/11/2026 14:18',
  },
];

export function convertToUsd(amount: number, from: CurrencyCode): number {
  if (from === 'USD') return amount;
  const rate = FX_RATES.find((r) => r.currency === from);
  if (!rate) return amount;
  return amount * rate.usdPerUnit;
}

export function convertFromUsd(amountUsd: number, to: CurrencyCode): number {
  if (to === 'USD') return amountUsd;
  const rate = FX_RATES.find((r) => r.currency === to);
  if (!rate) return amountUsd;
  return amountUsd * rate.unitsPerUsd;
}
