import { z } from 'zod';
import { ApiError, isUnauthorizedApiError } from './errors';
import type { EmptyRequest, HttpPort, JsonRequest } from './http-port';
import { notifySessionExpired } from './session-events';

const refreshSchema = z.object({
  access_expires_at: z.string().datetime({ offset: true }),
  refresh_expires_at: z.string().datetime({ offset: true }),
});

/** Browser-only policy; cookies remain HttpOnly and are rotated by the API. */
export function withSessionRefresh(transport: HttpPort): HttpPort {
  let generation = 0;
  let renewal: Promise<void> | undefined;
  let expired = false;

  function expire(path: string) {
    if (!expired) {
      expired = true;
      notifySessionExpired(path);
    }
  }

  function renew(): Promise<void> {
    if (!renewal) {
      renewal = transport
        .request({
          path: '/api/v1/auth/refresh',
          method: 'POST',
          response: 'json',
          parse: refreshSchema.parse,
        })
        .then(() => {
          generation += 1;
          expired = false;
        })
        .finally(() => {
          renewal = undefined;
        });
    }
    return renewal;
  }

  // Cancelling one consumer must not cancel the shared cookie rotation.
  function waitForRenewal(pending: Promise<void>, signal?: AbortSignal) {
    return new Promise<void>((resolve, reject) => {
      const cancel = () =>
        reject(new ApiError('cancelled', 'Solicitud cancelada.'));
      signal?.addEventListener('abort', cancel, { once: true });
      if (signal?.aborted) cancel();
      pending.then(resolve, reject).finally(() => {
        signal?.removeEventListener('abort', cancel);
      });
    });
  }

  async function request<T>(options: JsonRequest<T>): Promise<T>;
  async function request(options: EmptyRequest): Promise<void>;
  async function request<T>(
    options: JsonRequest<T> | EmptyRequest,
  ): Promise<T | void> {
    const send = () =>
      options.response === 'empty'
        ? transport.request(options)
        : transport.request(options);
    const startedGeneration = generation;
    const protectedPath =
      options.path.startsWith('/api/v1/') &&
      !options.path.startsWith('/api/v1/auth/') &&
      !options.path.startsWith('/api/v1/public/');
    try {
      const result = await send();
      if (protectedPath && startedGeneration === generation) expired = false;
      if (
        options.path === '/api/v1/auth/login' ||
        options.path === '/api/v1/auth/mfa/verify'
      ) {
        generation += 1;
        expired = false;
      }
      return result;
    } catch (error) {
      if (!protectedPath || !isUnauthorizedApiError(error)) throw error;
      if (options.signal?.aborted)
        throw new ApiError('cancelled', 'Solicitud cancelada.');
      if (expired) throw error;
      try {
        // A late 401 from the old cookie only needs replay, not a second rotation.
        if (startedGeneration === generation) {
          await waitForRenewal(renew(), options.signal);
        }
        if (options.signal?.aborted)
          throw new ApiError('cancelled', 'Solicitud cancelada.');
        return await send();
      } catch (renewalError) {
        if (isUnauthorizedApiError(renewalError)) expire(options.path);
        // Network/503 failures remain recoverable and do not close the session.
        throw renewalError;
      }
    }
  }
  return { request };
}
