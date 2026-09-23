import type { Metadata } from 'next';
import { CompleteProfile } from './complete-profile';

export const metadata: Metadata = { title: 'Lengkapi profil' };

export default function LengkapiProfilPage() {
  return <CompleteProfile />;
}
