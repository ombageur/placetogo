import type { Metadata } from 'next';
import { NotificationsView } from './notifications-view';

export const metadata: Metadata = {
  title: 'Notifikasi',
  description: 'Pusat notifikasi aktivitas, pesan obrolan, dan reward koin placetogo.',
};

export default function NotifikasiPage() {
  return <NotificationsView />;
}
