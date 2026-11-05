import { expect, it } from 'vitest';
import { ApiError, parseRetryAfter } from './errors';
import { createQueryClient, queryRetryDelay, retryQuery } from './query-client';

it('creates isolated caches and disables mutation retries and offline resumption', () => {
  const first = createQueryClient();
  const second = createQueryClient();
  first.setQueryData(
    ['private', 'epoch-a', 'account-a', 'probe'],
    'private value',
  );
  expect(second.getQueryCache().getAll()).toHaveLength(0);
  expect(first.getDefaultOptions().queries?.gcTime).toBe(120_000);
  expect(first.getDefaultOptions().mutations).toMatchObject({
    retry: false,
    networkMode: 'always',
  });
  first.clear();
  second.clear();
});

it('retries transient reads twice but not permission, validation or cancellation failures', () => {
  expect(retryQuery(0, new ApiError('transport', 'offline'))).toBe(true);
  expect(retryQuery(2, new ApiError('transport', 'offline'))).toBe(false);
  for (const kind of ['contract', 'cancelled'] as const)
    expect(retryQuery(0, new ApiError(kind, 'error'))).toBe(false);
  for (const status of [400, 401, 403, 404, 409, 422])
    expect(retryQuery(0, new ApiError('http', 'error', { status }))).toBe(
      false,
    );
  expect(retryQuery(0, new ApiError('http', 'error', { status: 503 }))).toBe(
    true,
  );
});

it('respects a bounded Retry-After and defers long or missing waits to the caller', () => {
  const short = new ApiError('http', 'limit', {
    status: 429,
    retryAfterMs: 2000,
  });
  expect(retryQuery(0, short)).toBe(true);
  expect(queryRetryDelay(0, short)).toBe(2000);
  expect(
    retryQuery(
      0,
      new ApiError('http', 'limit', { status: 429, retryAfterMs: 60_000 }),
    ),
  ).toBe(false);
  expect(retryQuery(0, new ApiError('http', 'limit', { status: 429 }))).toBe(
    false,
  );
  expect(parseRetryAfter('2')).toBe(2000);
  expect(
    parseRetryAfter(
      'Wed, 01 Jan 2025 00:00:02 GMT',
      Date.parse('2025-01-01T00:00:00Z'),
    ),
  ).toBe(2000);
  expect(parseRetryAfter('invalid')).toBeUndefined();
});
