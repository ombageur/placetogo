import type { Metadata } from 'next';
import { VerifyEmail } from './verify-email';

export const metadata: Metadata = { title: 'Verifikasi email' };

export default function VerifikasiEmailPage() {
  return <VerifyEmail />;
}
