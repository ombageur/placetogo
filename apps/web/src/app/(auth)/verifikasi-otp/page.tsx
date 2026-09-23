import type { Metadata } from 'next';
import { OtpView } from './otp-view';

export const metadata: Metadata = { title: 'Verifikasi OTP' };

export default function VerifikasiOtpPage() {
  return <OtpView />;
}
