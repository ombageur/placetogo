import type { Metadata } from 'next';
import { MyActivitiesView } from './my-activities-view';

export const metadata: Metadata = { title: 'Ajakan Saya' };

export default function AjakanSayaPage() {
  return <MyActivitiesView />;
}
