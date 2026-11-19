import { expect, it } from 'vitest';
import { ApiError } from '@/lib/api';
import {
  formatBankLinkError,
  isValidAchRoutingNumber,
} from './bank-validation';

it.each(['145789456', '000000000', '123', '12345678a', '141000025'])(
  'rechaza routing inválido: %s',
  (value) => {
    expect(isValidAchRoutingNumber(value)).toBe(false);
  },
);
it('acepta formato ABA con cero inicial sin asumir aprobación del proveedor', () => {
  expect(isValidAchRoutingNumber('021000021')).toBe(true);
});
it('distingue rechazo bancario de cuenta de inversión inactiva', () => {
  expect(
    formatBankLinkError(
      new ApiError('http', 'Rejected', {
        status: 422,
        code: 'ALPACA_REJECTED',
      }),
    ),
  ).toContain('No se informó qué campo');
  expect(
    formatBankLinkError(
      new ApiError('http', 'Inactive', {
        status: 409,
        code: 'WALLET_ACCOUNT_NOT_ACTIVE',
      }),
    ),
  ).toContain('todavía no está activa');
});
