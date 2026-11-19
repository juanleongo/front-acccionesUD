import { z } from 'zod';
import { browserHttp } from '@/lib/api/client';

const locationsSchema = z.object({
  states: z.array(z.object({ code: z.string(), name: z.string() })),
  cities: z.array(z.string()),
});

export function getLocations(
  country: string,
  signal: AbortSignal,
  state?: string,
) {
  return browserHttp.request({
    path: '/api/catalog/locations',
    query: { country, ...(state ? { state } : {}) },
    signal,
    response: 'json',
    parse: locationsSchema.parse,
  });
}
