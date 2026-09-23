import type { Metadata } from 'next';
import { JelajahView } from './jelajah-view';

export const metadata: Metadata = { title: 'Jelajah' };

export default function JelajahPage() {
  return <JelajahView />;
}
