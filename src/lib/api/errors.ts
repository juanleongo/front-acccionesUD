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
export type ApiErrorKind = 'http' | 'transport' | 'cancelled' | 'contract';

export class ApiError extends Error {
  constructor(
    public readonly kind: ApiErrorKind,
    message: string,
    public readonly metadata: {
      status?: number;
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
