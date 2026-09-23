import type { Metadata } from 'next';
import { UserProfileView } from './user-profile-view';

export const metadata: Metadata = {
  title: 'Profil Teman | placetogo.id',
  description: 'Lihat profil inisiator, ajakan, dan kirim hadiah dukungan apresiasi.',
};

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <UserProfileView userId={id} />;
}
