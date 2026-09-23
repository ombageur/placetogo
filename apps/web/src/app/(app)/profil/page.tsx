import type { Metadata } from 'next';
import { ProfileView } from './profile-view';

export const metadata: Metadata = { title: 'Profil' };

export default function ProfilPage() {
  return <ProfileView />;
}
