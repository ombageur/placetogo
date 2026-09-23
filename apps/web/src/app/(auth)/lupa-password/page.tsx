import type { Metadata } from 'next';
import { ResetForm } from './reset-form';

export const metadata: Metadata = { title: 'Lupa kata sandi' };

export default function LupaPasswordPage() {
  return <ResetForm />;
}
