import 'server-only';
import { serverConfigSchema } from './schema';

export function getServerConfig() {
  const result = serverConfigSchema.safeParse({
    API_INTERNAL_ORIGIN: process.env.API_INTERNAL_ORIGIN,
  });
  if (!result.success) {
    // Never include environment values in diagnostics.
    throw new Error(
      'API_INTERNAL_ORIGIN es requerida y debe ser un origen HTTP(S) válido.',
    );
  }
  return result.data;
}
