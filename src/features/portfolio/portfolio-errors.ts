import { ApiError } from '@/lib/api';
import { tx, type Locale } from '@/lib/i18n/locale';
export function portfolioErrorMessage(
  error: unknown,
  locale: Locale = 'es',
): string {
  const prefix = tx(
    locale,
    'No se pudo consultar el portafolio.',
    'Could not load your portfolio.',
  );
  const message = (es: string, en: string) => `${prefix} ${tx(locale, es, en)}`;
  if (!(error instanceof ApiError))
    return message('Reintenta la consulta.', 'Please try again.');
  if (error.metadata.status === 401)
    return message(
      'Tu sesión expiró. Inicia sesión de nuevo.',
      'Your session expired. Sign in again.',
    );
  if (error.metadata.status === 403)
    return message(
      'Tu cuenta no tiene permiso para realizar esta consulta.',
      'Your account does not have permission for this request.',
    );
  if (error.metadata.timeout)
    return message(
      'La consulta tardó demasiado. Vuelve a intentarlo.',
      'The request took too long. Please try again.',
    );
  return message(
    'No pudimos obtener los datos en este momento. Vuelve a intentarlo.',
    'Data could not be retrieved right now. Please try again.',
  );
}
