import { z } from 'zod';
import { browserHttp } from '@/lib/api/client';

const schema = z.object({
  mfa_token: z.string().min(1),
  mfa_expires_at: z.iso.datetime({ offset: true }),
  totp_enrollment: z
    .object({ secret: z.string().min(1), otpauth_uri: z.string() })
    .nullable(),
});
export type Challenge = z.infer<typeof schema>;

export function startLogin(email: string, password: string) {
  return browserHttp.request({
    path: '/api/v1/auth/login',
    method: 'POST',
    response: 'json',
    body: { email: email.trim(), password },
    parse: schema.parse,
  });
}
