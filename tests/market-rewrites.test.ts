import { afterEach, expect, it, vi } from 'vitest';
import nextConfig from '../next.config';
afterEach(() => vi.unstubAllEnvs());
it('forwards the public market table through Next with the same upstream path', async () => {
  vi.stubEnv('API_INTERNAL_ORIGIN', 'http://127.0.0.1:8765');
  const routes = await nextConfig.rewrites!();
  expect(routes).toEqual(
    expect.arrayContaining([
      {
        source: '/api/v1/public/market-explorer',
        destination: 'http://127.0.0.1:8765/api/v1/public/market-explorer',
      },
    ]),
  );
});
