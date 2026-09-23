import type { Metadata } from 'next';
import { RegisterForm } from './register-form';

export const metadata: Metadata = { title: 'Daftar' };

export default function DaftarPage() {
  return <RegisterForm />;
}
