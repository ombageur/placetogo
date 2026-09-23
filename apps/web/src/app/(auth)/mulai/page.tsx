import type { Metadata } from 'next';
import { Onboarding } from './onboarding';

export const metadata: Metadata = { title: 'Selamat datang' };

export default function MulaiPage() {
  return <Onboarding />;
}
