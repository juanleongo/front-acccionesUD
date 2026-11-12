import { z } from 'zod';

export type RegistrationKind = 'investor' | 'broker';

export function registrationPath(kind: RegistrationKind) {
  return kind === 'broker'
    ? '/api/v1/auth/register/broker'
    : '/api/v1/auth/register';
}

export const resultSchema = z.object({
  user_id: z.uuid(),
  account_status: z.enum(['active', 'pending_broker_activation']),
});

export function readRegistration(form: FormData, kind: RegistrationKind) {
  const value = (key: string) => String(form.get(key) ?? '');
  const interests = value('interests')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  return {
    first_names: value('first_names').trim(),
    last_names: value('last_names').trim(),
    email: value('email').trim(),
    phone: value('phone').trim(),
    country: value('country'),
    password: value('password'),
    terms_accepted: form.has('terms_accepted'),
    monthly_report: form.has('monthly_report'),
    interests,
    investor_level: value('investor_level') || null,
    broker_requested: form.has('broker_requested'),
    premium_requested: form.has('premium_requested'),
    ...(kind === 'broker'
      ? {
          firm_name: value('firm_name').trim(),
          license_number: value('license_number').trim(),
        }
      : {}),
  };
}
