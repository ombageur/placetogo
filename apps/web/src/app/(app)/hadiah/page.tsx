import type { Metadata } from 'next';
import { GiftsView } from './gifts-view';

export const metadata: Metadata = { title: 'Hadiah' };

export default function HadiahPage() {
  return <GiftsView />;
}
