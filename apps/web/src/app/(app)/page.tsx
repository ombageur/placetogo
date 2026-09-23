import type { Metadata } from 'next';
import { BerandaView } from './beranda-view';

export const metadata: Metadata = { title: 'Beranda' };

export default function BerandaPage() {
  return <BerandaView />;
}
