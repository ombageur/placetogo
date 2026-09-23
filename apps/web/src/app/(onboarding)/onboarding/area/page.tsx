import type { Metadata } from 'next';
import { AreaStepView } from './area-step-view';

export const metadata: Metadata = {
  title: 'Pilih Area | placetogo.id',
  description: 'Tentukan area atau kota tempat kamu ingin mencari aktivitas.',
};

export default function AreaStepPage() {
  return <AreaStepView />;
}
