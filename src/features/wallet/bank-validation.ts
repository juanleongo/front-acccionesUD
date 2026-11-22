import { ApiError } from '@/lib/api';
import { tx, type Locale } from '@/lib/i18n/locale';

/** ABA format and check digit only; does not prove the bank/account exists.
 * https://www.fiscal.treasury.gov/data/FSv49/IAIv10/Library/AttributeDataDictionary.html
 * https://fraser.stlouisfed.org/files/docs/historical/ny%20circulars/nycirc_1977_08203.pdf
 */
export function isValidAchRoutingNumber(value: string): boolean {
  if (
    !/^(?:0[0-9]|1[0-2]|2[1-9]|3[0-2]|6[1-9]|7[0-2]|80|9[01])[0-9]{7}$/.test(
      value,
    )
  )
    return false;
  if (/^0+$/.test(value)) return false;
  const weights = [3, 7, 1] as const;
  return (
    [...value].reduce(
      (sum, digit, index) => sum + Number(digit) * weights[index % 3]!,
      0,
    ) %
      10 ===
    0
  );
}

export function formatBankLinkError(
  error: unknown,
  locale: Locale = 'es',
): string {
  if (!(error instanceof ApiError))
    return tx(
      locale,
      'No pudimos vincular la cuenta. Inténtalo de nuevo.',
      'Could not link the bank account. Please try again.',
    );
  const { code, status, invalidFields } = error.metadata;
  if (code === 'WALLET_ACCOUNT_REQUIRED')
    return tx(
      locale,
      'Primero completa la apertura de tu cuenta de inversión.',
      'Complete your investment account onboarding first.',
    );
  if (code === 'WALLET_ACCOUNT_NOT_ACTIVE')
    return tx(
      locale,
      'Tu cuenta de inversión todavía no está activa. Consulta el estado de tu trámite KYC.',
      'Your investment account is not active yet. Check your KYC status.',
    );
  if (code === 'ALPACA_REJECTED')
    return tx(
      locale,
      'El proveedor de pruebas rechazó los datos bancarios. Usa una cuenta de prueba ACH de Estados Unidos; los datos de una cuenta colombiana no sirven para este vínculo. No se informó qué campo causó el rechazo.',
      'The test provider rejected the bank details. Use a US ACH test bank account; Colombian bank accounts cannot be linked here. No specific field reason was provided.',
    );
  if (invalidFields?.includes('bank_routing_number'))
    return tx(
      locale,
      'Revisa el código bancario ACH de Estados Unidos: debe ser un routing number ABA válido de 9 dígitos.',
      'Check the US ACH routing number: it must be a valid 9-digit ABA routing number.',
    );
  if (invalidFields?.includes('bank_account_number'))
    return tx(
      locale,
      'Revisa el número de cuenta: debe tener entre 4 y 17 dígitos.',
      'Check the account number: it must have 4 to 17 digits.',
    );
  if (invalidFields?.includes('account_owner_name'))
    return tx(
      locale,
      'Revisa el nombre completo del titular de la cuenta bancaria.',
      'Check the full account holder name.',
    );
  if (status === 401)
    return tx(
      locale,
      'Tu sesión venció. Inicia sesión de nuevo para vincular la cuenta.',
      'Your session expired. Sign in again to link a bank account.',
    );
  if (status === 403)
    return tx(
      locale,
      'Tu cuenta no tiene permiso para vincular cuentas bancarias. Revisa tu verificación de identidad.',
      'Your account does not have permission to link bank accounts. Check your identity verification.',
    );
  if (status === 409)
    return tx(
      locale,
      'No se pudo crear el vínculo con el estado actual de tu cuenta. Actualiza las cuentas y revisa tu trámite KYC.',
      'Could not link the account in its current state. Refresh accounts and review your KYC status.',
    );
  if (status === 422)
    return tx(
      locale,
      'Los datos bancarios fueron rechazados. Comprueba que pertenecen a una cuenta de prueba ACH de Estados Unidos. Tener 9 dígitos no basta para que el código bancario sea válido.',
      'The bank details were rejected. Verify they belong to a US ACH test account. Having 9 digits alone does not make a valid ABA routing number.',
    );
  return tx(
    locale,
    'No pudimos contactar al servicio bancario. Revisa tu conexión e inténtalo de nuevo.',
    'Could not reach the banking service. Check your connection and try again.',
  );
}
