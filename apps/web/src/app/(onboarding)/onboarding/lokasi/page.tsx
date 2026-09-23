import type { Metadata } from 'next';
import { LocationStepView } from './location-step-view';

export const metadata: Metadata = {
  title: 'Izin Lokasi | placetogo.id',
  description: 'Aktifkan izin lokasi untuk menemukan ajakan aktivitas terdekat.',
};

export default function LocationStepPage() {
  return <LocationStepView />;
}
