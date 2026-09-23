import type { Metadata } from 'next';
import { EditProfile } from './edit-profile';

export const metadata: Metadata = { title: 'Edit profil' };

export default function EditProfilPage() {
  return <EditProfile />;
}
