import type { Metadata } from 'next';
import { ModerationView } from './moderation-view';

export const metadata: Metadata = {
  title: 'Moderasi Komunitas | placetogo.id',
  description: 'Panel moderasi dan laporan keamanan komunitas placetogo.id.',
};

export default function AdminModerasiPage() {
  return <ModerationView />;
}
