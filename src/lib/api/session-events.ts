type SessionExpiredListener = (path: string) => void;

const listeners = new Set<SessionExpiredListener>();

/** Suscribe componentes de zonas autenticadas a respuestas HTTP 401 reales. */
export function subscribeSessionExpired(
  listener: SessionExpiredListener,
): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Notifica que una petición autenticada recibió 401 (sesión cerrada o expirada). */
export function notifySessionExpired(path: string): void {
  for (const listener of listeners) {
    try {
      listener(path);
    } catch {
      /* Un listener nunca debe alterar el error HTTP 401 original. */
    }
  }
}
