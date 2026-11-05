export type HttpMethod = 'GET' | 'HEAD' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RequestOptions {
  method?: HttpMethod;
  /** Absolute path within /api/, never an origin or a URL from user input. */
  path: string;
  query?: Readonly<Record<string, string>>;
  body?: unknown;
  signal?: AbortSignal;
  timeoutMs?: number;
  requestId?: string;
  /** Credentials cannot be supplied through this port. */
  headers?: Readonly<
    Partial<Record<'X-CSRF-Token' | 'Idempotency-Key', string>>
  >;
}

export interface JsonRequest<T> extends RequestOptions {
  response: 'json';
  parse: (value: unknown) => T;
}

export interface EmptyRequest extends RequestOptions {
  response: 'empty';
}

export interface HttpPort {
  request<T>(options: JsonRequest<T>): Promise<T>;
  request(options: EmptyRequest): Promise<void>;
}
