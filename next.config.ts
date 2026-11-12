import type { NextConfig } from 'next';
import { serverConfigSchema } from './src/lib/config/schema';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async rewrites() {
    if (!process.env.API_INTERNAL_ORIGIN) return [];
    const { API_INTERNAL_ORIGIN } = serverConfigSchema.parse({
      API_INTERNAL_ORIGIN: process.env.API_INTERNAL_ORIGIN,
    });
    return [
      '/api/v1/auth/register',
      '/api/v1/auth/register/broker',
      '/api/v1/auth/login',
      '/api/v1/auth/mfa/verify',
      '/api/v1/auth/refresh',
      '/api/v1/auth/logout',
      '/api/v1/users/me',
      '/api/v1/users/me/interests',
      '/api/v1/users/me/mfa/recovery-codes',
      '/api/v1/users/me/sessions',
      '/api/v1/users/me/telegram',
      '/api/v1/users/preferences/channels',
      '/api/v1/users/preferences/portfolio',
      '/api/v1/users/preferences/orders',
      '/api/v1/kyc/status',
      '/api/v1/kyc/account',
      '/api/v1/dashboard',
      '/api/v1/markets',
      '/api/v1/markets/clock',
      '/api/v1/markets/calendar',
      '/api/v1/markets/:market/status',
      '/api/v1/instruments/:symbol+/candles',
      '/api/v1/instruments/search',
    ].map((path) => ({
      source: path,
      destination: API_INTERNAL_ORIGIN + path,
    }));
  },
};

export default nextConfig;
