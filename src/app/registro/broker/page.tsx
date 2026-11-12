import { RegistrationForm } from '@/features/registration';

export const metadata = { title: 'Registro de comisionista | Acciones UD' };

export default function Page() {
  return <RegistrationForm kind="broker" />;
}
