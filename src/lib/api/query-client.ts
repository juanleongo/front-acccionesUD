import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './errors';

export function retryQuery(failureCount: number, error: Error): boolean {
  if (failureCount >= 2 || !(error instanceof ApiError)) return false;
  if (error.kind === 'transport') return true;
  if (error.kind !== 'http') return false;
  if (error.metadata.status === 429) {
    const delay = error.metadata.retryAfterMs;
    return delay !== undefined && Number.isFinite(delay) && delay <= 30_000;
  }
  return [408, 500, 502, 503, 504].includes(error.metadata.status ?? 0);
}

export function queryRetryDelay(attempt: number, error: Error): number {
  if (error instanceof ApiError && error.metadata.status === 429) {
    return Math.min(error.metadata.retryAfterMs ?? 30_000, 30_000);
  }
  return Math.min(1000 * 2 ** attempt, 30_000) * (0.5 + Math.random() * 0.5);
}

/** A factory, never a module-level cache. Call once per provider / SSR request. */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        gcTime: 120_000,
        staleTime: 0,
        retry: retryQuery,
        retryDelay: queryRetryDelay,
      },
      mutations: { retry: false, networkMode: 'always' },
    },
  });
}
