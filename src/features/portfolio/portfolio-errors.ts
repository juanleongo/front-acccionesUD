import { ApiError } from '@/lib/api';
export function portfolioErrorMessage(error: unknown): string {
  const prefix = 'No se pudo consultar el portafolio.';
  if (!(error instanceof ApiError)) return prefix + ' Reintenta la consulta.';
  if (error.kind === 'contract')
    return (
      prefix + ' La respuesta de la API no coincide con el formato esperado.'
    );
  if (error.metadata.timeout)
    return prefix + ' El servidor superó el tiempo de espera.';
  if (error.metadata.status === 401)
    return prefix + ' Tu sesión expiró. Inicia sesión de nuevo.';
  if (error.metadata.status === 403)
    return prefix + ' Tu usuario no tiene permiso para consultar este recurso.';
  const detail =
    error.metadata.code ??
    (error.metadata.status
      ? `HTTP ${error.metadata.status}`
      : 'Error de conexión');
  return `${prefix} ${detail}. Reintenta la consulta.`;
}
