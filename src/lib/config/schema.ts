import { z } from 'zod';

export const serverConfigSchema = z.object({
  API_INTERNAL_ORIGIN: z
    .string()
    .url()
    .superRefine((value, ctx) => {
      const url = URL.parse(value);
      if (!url) {
        ctx.addIssue({ code: 'custom', message: 'Origen inválido.' });
        return;
      }
      if (
        !['http:', 'https:'].includes(url.protocol) ||
        url.username ||
        url.password ||
        url.pathname !== '/' ||
        url.search ||
        url.hash ||
        value.includes('?') ||
        value.includes('#')
      ) {
        ctx.addIssue({
          code: 'custom',
          message:
            'Debe ser un origen HTTP(S) fijo sin credenciales, ruta, query ni fragmento.',
        });
      }
    })
    .transform((value) => new URL(value).origin),
});

export type ServerConfig = z.infer<typeof serverConfigSchema>;
