'use client';

import { formatPersonName } from '@/lib/format-person-name';
import { z } from 'zod';
import { browserHttp } from '@/lib/api/client';
import type {
  CurrencyCode,
  LedgerTransaction,
  WalletBalance,
} from './wallet-mock';

const balanceOutSchema = z.object({
  status: z.string(),
  currency: z.string(),
  cash: z.string().nullable(),
  cash_withdrawable: z.string().nullable(),
  buying_power: z.string().nullable(),
  equity: z.string().nullable(),
  portfolio_value: z.string().nullable(),
  long_market_value: z.string().nullable(),
  retrieved_at: z.string(),
  unavailable: z.boolean(),
});

const bankOutSchema = z.object({
  id: z.string(),
  alpaca_relationship_id: z.string(),
  owner_name: z.string(),
  account_type: z.string(),
  account_last4: z.string(),
  status: z.string(),
  created_at: z.string(),
});

const transferOutSchema = z.object({
  id: z.string(),
  alpaca_transfer_id: z.string(),
  bank_relationship_id: z.string(),
  direction: z.enum(['INCOMING', 'OUTGOING']),
  amount: z.string(),
  currency: z.string(),
  status: z.string(),
  reason: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  created_at: z.string(),
});

const transferPageSchema = z.object({
  items: z.array(transferOutSchema),
  next_cursor: z.string().nullable().optional(),
});

export async function fetchWalletBalance(
  signal?: AbortSignal,
): Promise<WalletBalance | null> {
  const data = await browserHttp.request({
    path: '/api/v1/wallet/balances',
    method: 'GET',
    response: 'json',
    parse: balanceOutSchema.parse,
    ...(signal ? { signal } : {}),
  });
  if (data.unavailable) return null;
  const totalCash = Number(data.cash ?? 0);
  const withdrawable = Number(data.cash_withdrawable ?? 0);
  const reserved = Math.max(0, Number((totalCash - withdrawable).toFixed(2)));
  const invested = Number(data.long_market_value ?? 0);

  return {
    currency: 'USD',
    available_balance_usd: withdrawable,
    reserved_balance_usd: reserved,
    invested_equity_usd: invested,
  };
}

export async function fetchWalletTransfers(
  signal?: AbortSignal,
): Promise<LedgerTransaction[]> {
  const page = await browserHttp.request({
    path: '/api/v1/wallet/transfers',
    method: 'GET',
    response: 'json',
    parse: transferPageSchema.parse,
    ...(signal ? { signal } : {}),
  });
  return page.items.map((item) => {
    const rawAmount = Number(item.amount) || 0;
    const isIncoming = item.direction === 'INCOMING';
    const signedUsd = isIncoming ? rawAmount : -rawAmount;
    return {
      id: item.id,
      tx_type: isIncoming ? 'DEPOSIT' : 'WITHDRAWAL',
      concept:
        item.description ||
        (isIncoming ? 'Depósito de fondos (ACH)' : 'Retiro de fondos (ACH)'),
      original_currency: (item.currency as CurrencyCode) || 'USD',
      original_amount: rawAmount,
      amount_usd: signedUsd,
      fee_usd: null,
      balance_after_usd: null,
      external_ref: item.alpaca_transfer_id || item.id.slice(0, 10),
      status: item.status,
      created_at: new Date(item.created_at).toLocaleString('es-CO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
  });
}

export type BankRelationship = z.infer<typeof bankOutSchema>;
export async function fetchBanks() {
  return browserHttp.request({
    path: '/api/v1/wallet/bank-relationships',
    method: 'GET',
    response: 'json',
    parse: z.array(bankOutSchema).parse,
  });
}
export async function createBank(body: {
  account_owner_name: string;
  bank_account_type: 'CHECKING' | 'SAVINGS';
  bank_account_number: string;
  bank_routing_number: string;
}) {
  return browserHttp.request({
    path: '/api/v1/wallet/bank-relationships',
    method: 'POST',
    body: {
      ...body,
      account_owner_name: formatPersonName(body.account_owner_name),
    },
    response: 'json',
    parse: bankOutSchema.parse,
  });
}
export async function requestTransfer(
  direction: 'deposit' | 'withdrawal',
  bankId: string,
  amount: string,
  key: string,
) {
  return browserHttp.request({
    path:
      direction === 'deposit'
        ? '/api/v1/wallet/deposits'
        : '/api/v1/wallet/withdrawals',
    method: 'POST',
    headers: { 'Idempotency-Key': key },
    body: { bank_relationship_id: bankId, amount, currency: 'USD' },
    response: 'json',
    parse: transferOutSchema.parse,
  });
}
