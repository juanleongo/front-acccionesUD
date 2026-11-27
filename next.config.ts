import type { NextConfig } from 'next';
import { serverConfigSchema } from './src/lib/config/schema';

const nextConfig: NextConfig = {
  serverExternalPackages: ['country-state-city'],
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'flagcdn.com',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
  async rewrites() {
    if (!process.env.API_INTERNAL_ORIGIN) return [];
    const { API_INTERNAL_ORIGIN } = serverConfigSchema.parse({
      API_INTERNAL_ORIGIN: process.env.API_INTERNAL_ORIGIN,
    });
    return [
      '/api/v1/auth/interest-options',
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
      '/api/v1/users/me/sessions/:path*',
      '/api/v1/users/me/telegram',
      '/api/v1/users/preferences/channels',
      '/api/v1/users/preferences/portfolio',
      '/api/v1/users/preferences/orders',
      '/api/v1/kyc/status',
      '/api/v1/kyc/account',
      '/api/v1/dashboard',
      '/api/v1/public/market-explorer',
      '/api/v1/public/instruments/:symbol+/logo',
      '/api/v1/markets',
      '/api/v1/markets/clock',
      '/api/v1/markets/calendar',
      '/api/v1/markets/:market/status',
      '/api/v1/instruments/search',
      '/api/v1/instruments/:symbol+/candles',
      '/api/v1/instruments/:path*',
      '/api/v1/admin/:path*',
      '/api/v1/broker/:path*',
      '/api/v1/portfolio/positions',
      '/api/v1/brokers',
      '/api/v1/brokers/:path*',
      '/api/v1/broker-links',
      '/api/v1/broker-links/:path*',
      '/api/v1/proposals',
      '/api/v1/proposals/:path*',
      '/api/v1/portfolio/:path*',
      '/api/v1/orders',
      '/api/v1/orders/:path*',
      '/api/v1/wallet/:path*',
      '/api/v1/subscriptions/:path*',
      '/api/v1/watchlists',
      '/api/v1/watchlists/:path*',
      '/api/v1/alerts',
      '/api/v1/alerts/:path*',
      '/api/v1/price-alerts',
      '/api/v1/price-alerts/:path*',
      '/api/v1/notifications',
    ].map((path) => ({
      source: path,
      destination: API_INTERNAL_ORIGIN + path,
    }));
  },
};

export default nextConfig;
