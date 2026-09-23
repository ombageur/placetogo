import type { Metadata } from 'next';
import { AvatarStepView } from './avatar-step-view';

export const metadata: Metadata = {
  title: 'Pilih Avatar | placetogo.id',
  description: 'Pilih avatar resmi placetogo untuk profil kamu.',
};

export default function AvatarStepPage() {
  return <AvatarStepView />;
}
