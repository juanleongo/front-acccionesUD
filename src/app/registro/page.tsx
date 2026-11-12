import { RegistrationForm } from '@/features/registration';

export const metadata = { title: 'Registro de inversionista | Acciones UD' };

export default function Page() {
  return <RegistrationForm kind="investor" />;
}
