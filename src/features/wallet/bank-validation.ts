import { ApiError } from '@/lib/api';

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

export function formatBankLinkError(error: unknown): string {
  if (!(error instanceof ApiError))
    return 'No pudimos vincular la cuenta. Inténtalo de nuevo.';
  const { code, status, invalidFields } = error.metadata;
  if (code === 'WALLET_ACCOUNT_REQUIRED')
    return 'Primero completa la apertura de tu cuenta de inversión.';
  if (code === 'WALLET_ACCOUNT_NOT_ACTIVE')
    return 'Tu cuenta de inversión todavía no está activa. Consulta el estado de tu trámite KYC.';
  if (code === 'ALPACA_REJECTED')
    return 'El proveedor de pruebas rechazó los datos bancarios. Usa una cuenta de prueba ACH de Estados Unidos; los datos de una cuenta colombiana no sirven para este vínculo. No se informó qué campo causó el rechazo.';
  if (invalidFields?.includes('bank_routing_number'))
    return 'Revisa el código bancario ACH de Estados Unidos: debe ser un routing number ABA válido de 9 dígitos.';
  if (invalidFields?.includes('bank_account_number'))
    return 'Revisa el número de cuenta: debe tener entre 4 y 17 dígitos.';
  if (invalidFields?.includes('account_owner_name'))
    return 'Revisa el nombre completo del titular de la cuenta bancaria.';
  if (status === 401)
    return 'Tu sesión venció. Inicia sesión de nuevo para vincular la cuenta.';
  if (status === 403)
    return 'Tu cuenta no tiene permiso para vincular cuentas bancarias. Revisa tu verificación de identidad.';
  if (status === 409)
    return 'No se pudo crear el vínculo con el estado actual de tu cuenta. Actualiza las cuentas y revisa tu trámite KYC.';
  if (status === 422)
    return 'Los datos bancarios fueron rechazados. Comprueba que pertenecen a una cuenta de prueba ACH de Estados Unidos. Tener 9 dígitos no basta para que el código bancario sea válido.';
  return 'No pudimos contactar al servicio bancario. Revisa tu conexión e inténtalo de nuevo.';
}
