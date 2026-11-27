import { multiplyOrderValues, orderBasePrice } from './order-estimate';
import type { OrderInput, Preview } from './trading-api';

export type BudgetMode = 'total' | 'shares';
export type OrderBudget = { amount: string; mode: BudgetMode };

/** Protective price derived from the server reference, rounded up to allowed ticks. */
export function automaticBudgetPrice(reference: string): string | null {
  if (
    !/^\d+(?:\.\d+)?$/.test(reference) ||
    !Number.isFinite(Number(reference)) ||
    Number(reference) <= 0
  )
    return null;
  const [whole = '0', fraction = ''] = reference.split('.');
  const digits = Number(reference) >= 1 ? 2 : 4;
  const units =
    BigInt(whole + fraction.padEnd(digits, '0').slice(0, digits)) +
    (/[1-9]/.test(fraction.slice(digits)) ? 1n : 0n);
  const value = units.toString().padStart(digits + 1, '0');
  const price = `${value.slice(0, -digits)}.${value.slice(-digits)}`;
  return Number(price) >= 1 && digits === 4
    ? `${BigInt(price.split('.')[0] ?? '0')}.00`
    : price;
}

/** Nine decimal places match the order API. Integer division always rounds down. */
export function budgetQuantity(
  budget: string,
  unitTotal: string,
  fractionable: boolean,
  quotedQuantity = '1',
): string | null {
  const fixed = (value: string) => {
    if (!/^\d+(?:\.\d{1,9})?$/.test(value)) return null;
    const [whole = '0', part = ''] = value.split('.');
    return BigInt(whole + part.padEnd(9, '0'));
  };
  const amount = fixed(budget),
    cost = fixed(unitTotal),
    quoted = fixed(quotedQuantity);
  if (
    amount === null ||
    cost === null ||
    quoted === null ||
    amount <= 0n ||
    cost <= 0n ||
    quoted <= 0n
  )
    return null;
  const scale = 1_000_000_000n;
  const rawQuantity = (amount * quoted) / cost;
  const quantity = fractionable ? rawQuantity : (rawQuantity / scale) * scale;
  if (quantity === 0n) return null;
  return `${quantity / scale}.${(quantity % scale).toString().padStart(9, '0')}`.replace(
    /\.?0+$/,
    '',
  );
}
export function withinBudget(total: string, budget: string): boolean {
  if (
    !/^\d+(?:\.\d{1,18})?$/.test(total) ||
    !/^\d+(?:\.\d{1,18})?$/.test(budget)
  )
    return false;
  const fixed = (value: string) => {
    const [whole, part = ''] = value.split('.');
    return BigInt(`${whole}${part.padEnd(18, '0')}`);
  };
  return fixed(total) <= fixed(budget);
}
export function isOrderWithinBudget(
  draft: OrderInput,
  preview: Preview,
  budget: OrderBudget,
): boolean {
  const basis =
    budget.mode === 'total'
      ? preview.estimated_amount
      : multiplyOrderValues(
          draft.qty,
          orderBasePrice(draft, preview.reference_price),
        );
  return basis !== null && withinBudget(basis, budget.amount);
}
