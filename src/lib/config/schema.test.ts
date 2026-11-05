import { expect, it } from 'vitest';
import { serverConfigSchema } from './schema';

it('accepts an internal origin and normalizes its trailing slash', () => {
  expect(
    serverConfigSchema.parse({
      API_INTERNAL_ORIGIN: 'http://backend.internal:8000/',
    }).API_INTERNAL_ORIGIN,
  ).toBe('http://backend.internal:8000');
});

it.each([
  undefined,
  '',
  'not-url',
  'file:///secret',
  'https://user:pass@host',
  'http://host/api',
  'http://host?token=x',
  'http://host#fragment',
])('rejects invalid server origin %s', (value) => {
  expect(
    serverConfigSchema.safeParse({ API_INTERNAL_ORIGIN: value }).success,
  ).toBe(false);
});
