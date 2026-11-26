import type { OrderInput } from './trading-api';

/** Exact multiplication of API decimal strings; no floating-point money arithmetic. */
export function multiplyOrderValues(
  left: string,
  right: string,
): string | null {
  if (!/^\d+(?:\.\d+)?$/.test(left) || !/^\d+(?:\.\d+)?$/.test(right))
    return null;
  const scale =
    (left.split('.')[1]?.length ?? 0) + (right.split('.')[1]?.length ?? 0);
  const value = BigInt(left.replace('.', '')) * BigInt(right.replace('.', ''));
  const digits = value.toString().padStart(scale + 1, '0');
  return scale ? `${digits.slice(0, -scale)}.${digits.slice(-scale)}` : digits;
}

export function orderBasePrice(draft: OrderInput, reference: string) {
  if (draft.type === 'limit' || draft.type === 'stop_limit')
    return draft.limit_price ?? '';
  if (draft.type === 'stop') return draft.stop_price ?? '';
  return reference;
}

export function estimateInput(draft: OrderInput) {
  const { confirmed, high_amount_acknowledged, totp_code, ...input } = draft;
  void [confirmed, high_amount_acknowledged, totp_code];
  return input;
}
