import 'server-only';
import { getServerConfig } from '@/lib/config/server';
import { createFetchTransport } from './fetch-transport';

/** Lazy validation; no backend/env required during the base build. No cookies forwarded. */
export function createServerHttp() {
  return createFetchTransport({
    origin: getServerConfig().API_INTERNAL_ORIGIN,
    credentials: 'omit',
  });
}
