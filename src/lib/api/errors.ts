import { z } from 'zod';

/** Tolerant RFC 9457 subset. Backend extensions are not approved contracts. */
export const problemSchema = z.object({
  type: z.string().optional(),
  title: z.string().optional(),
  status: z.number().int().optional(),
  detail: z.string().optional(),
  instance: z.string().optional(),
});

export type ProblemDetails = z.infer<typeof problemSchema>;
export const validationDetailsSchema = z.object({
  details: z.object({ errors: z.array(z.object({ field: z.string() })) }),
});
export const backendErrorBodySchema = z.object({
  code: z.string().optional(),
  message: z.string().optional(),
});
export type ApiErrorKind = 'http' | 'transport' | 'cancelled' | 'contract';

export class ApiError extends Error {
  constructor(
    public readonly kind: ApiErrorKind,
    message: string,
    public readonly metadata: {
      status?: number;
      code?: string;
      invalidFields?: string[];
      requestId?: string;
      problem?: ProblemDetails;
      retryAfterMs?: number;
      timeout?: boolean;
    } = {},
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function parseRetryAfter(
  value: string | null,
  now = Date.now(),
): number | undefined {
  if (value === null) return undefined;
  if (/^\d+$/.test(value.trim())) return Number(value) * 1000;
  const date = Date.parse(value);
  return Number.isNaN(date) ? undefined : Math.max(0, date - now);
}

export function getApiErrorStatus(error: unknown): number | undefined {
  return error instanceof ApiError ? error.metadata.status : undefined;
}

export function isApiHttpStatus(error: unknown, status: number): boolean {
  return getApiErrorStatus(error) === status;
}

export function isUnauthorizedApiError(error: unknown): boolean {
  return isApiHttpStatus(error, 401);
}
