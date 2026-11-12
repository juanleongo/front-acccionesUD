import {
  ApiError,
  parseRetryAfter,
  problemSchema,
  validationDetailsSchema,
} from './errors';
import type {
  EmptyRequest,
  HttpPort,
  JsonRequest,
  RequestOptions,
} from './http-port';

interface TransportOptions {
  origin?: string;
  credentials: 'same-origin' | 'omit';
}

function requestPath(options: RequestOptions): string {
  const candles =
    /^\/api\/v1\/instruments\/[a-z0-9.-]+(?:\/[a-z0-9.-]+)*\/candles$/i.test(
      options.path,
    ) &&
    !options.path
      .split('/')
      .some((segment) => segment === '.' || segment === '..');
  if (!candles && !/^\/api\/(?:[A-Za-z0-9_-]+\/?)*$/.test(options.path)) {
    throw new ApiError(
      'contract',
      'La ruta debe pertenecer a /api/ y no contener una URL, query o fragmento.',
    );
  }
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(options.query ?? {})) {
    if (
      !(candles && key === 'page_token') &&
      /token|secret|password|authorization|cookie|api[_-]?key/i.test(key)
    ) {
      throw new ApiError('contract', 'No se permiten credenciales en URLs.');
    }
    query.set(key, value);
  }
  const suffix = query.toString();
  return options.path + (suffix ? `?${suffix}` : '');
}

function safeCorrelation(value: string | null | undefined): string | undefined {
  return value && /^[\w.:/-]{1,128}$/.test(value) ? value : undefined;
}

/** Internal implementation: adapters choose the origin and credential policy. No retries. */
export function createFetchTransport(config: TransportOptions): HttpPort {
  async function request<T>(options: JsonRequest<T>): Promise<T>;
  async function request(options: EmptyRequest): Promise<void>;
  async function request<T>(
    options: JsonRequest<T> | EmptyRequest,
  ): Promise<T | void> {
    const path = requestPath(options);
    const timeoutMs = options.timeoutMs ?? 10_000;
    if (
      !Number.isFinite(timeoutMs) ||
      timeoutMs <= 0 ||
      timeoutMs > 2_147_483_647
    ) {
      throw new ApiError(
        'contract',
        'timeoutMs debe ser un número positivo válido.',
      );
    }
    const controller = new AbortController();
    let timedOut = false;
    const cancel = () => controller.abort();
    options.signal?.addEventListener('abort', cancel, { once: true });
    if (options.signal?.aborted) cancel();
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeoutMs);
    try {
      const headers = new Headers({
        Accept: 'application/json, application/problem+json',
      });
      for (const [key, value] of Object.entries(options.headers ?? {})) {
        if (!['x-csrf-token', 'idempotency-key'].includes(key.toLowerCase())) {
          throw new ApiError('contract', 'Cabecera no permitida.');
        }
        headers.set(key, value);
      }
      const requestId = safeCorrelation(options.requestId);
      if (options.requestId && !requestId)
        throw new ApiError('contract', 'requestId inválido.');
      if (requestId) headers.set('X-Request-ID', requestId);
      const method = options.method ?? 'GET';
      if (
        options.body !== undefined &&
        (method === 'GET' || method === 'HEAD')
      ) {
        throw new ApiError('contract', 'GET y HEAD no admiten cuerpo.');
      }
      let body: string | undefined;
      if (options.body !== undefined) {
        try {
          body = JSON.stringify(options.body);
        } catch {
          throw new ApiError('contract', 'El cuerpo no es JSON serializable.');
        }
        if (body === undefined)
          throw new ApiError('contract', 'El cuerpo no es JSON serializable.');
        headers.set('Content-Type', 'application/json');
      }
      const response = await fetch(`${config.origin ?? ''}${path}`, {
        method,
        headers,
        ...(body !== undefined ? { body } : {}),
        signal: controller.signal,
        credentials: config.credentials,
        cache: 'no-store',
        redirect: 'error',
      });
      const correlation =
        safeCorrelation(response.headers.get('X-Request-ID')) ?? requestId;
      const metadata = correlation ? { requestId: correlation } : {};
      const contentType = response.headers
        .get('Content-Type')
        ?.split(';')[0]
        ?.trim()
        .toLowerCase();
      if (!response.ok) {
        let problem;
        let invalidFields: string[] | undefined;
        if (response.status === 422 && contentType === 'application/json') {
          const parsed = validationDetailsSchema.safeParse(
            await response.json().catch(() => null),
          );
          if (parsed.success)
            invalidFields = parsed.data.details.errors.map(
              (error) => error.field,
            );
        }
        if (contentType === 'application/problem+json') {
          try {
            const parsed = problemSchema.safeParse(await response.json());
            if (parsed.success) problem = parsed.data;
          } catch {
            /* Preserve HTTP classification for malformed error bodies. */
          }
        }
        const retryAfterMs = parseRetryAfter(
          response.headers.get('Retry-After'),
        );
        throw new ApiError('http', `Error HTTP ${response.status}.`, {
          ...metadata,
          status: response.status,
          ...(invalidFields ? { invalidFields } : {}),
          ...(problem ? { problem } : {}),
          ...(retryAfterMs !== undefined ? { retryAfterMs } : {}),
        });
      }
      if (options.response === 'empty') {
        await response.body?.cancel();
        return;
      }
      if (
        response.status === 204 ||
        response.status === 205 ||
        method === 'HEAD'
      ) {
        throw new ApiError(
          'contract',
          'Se esperaba JSON y la respuesta no contiene cuerpo.',
          metadata,
        );
      }
      if (
        contentType !== 'application/json' &&
        !contentType?.match(/^application\/[\w.+-]+\+json$/)
      ) {
        throw new ApiError(
          'contract',
          'Content-Type de respuesta incompatible con JSON.',
          metadata,
        );
      }
      const text = await response.text();
      try {
        return options.parse(JSON.parse(text) as unknown);
      } catch {
        throw new ApiError(
          'contract',
          'JSON o esquema de respuesta inválido.',
          metadata,
        );
      }
    } catch (error) {
      if (controller.signal.aborted) {
        throw timedOut
          ? new ApiError('transport', 'La solicitud superó el tiempo límite.', {
              timeout: true,
            })
          : new ApiError('cancelled', 'Solicitud cancelada.');
      }
      if (error instanceof ApiError) throw error;
      throw new ApiError('transport', 'No fue posible completar la solicitud.');
    } finally {
      clearTimeout(timer);
      options.signal?.removeEventListener('abort', cancel);
    }
  }
  return { request };
}
