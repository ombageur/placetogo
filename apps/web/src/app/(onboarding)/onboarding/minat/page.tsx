import type { Metadata } from 'next';
import { InterestsStepView } from './interests-step-view';

export const metadata: Metadata = {
  title: 'Pilih Minat | placetogo.id',
  description: 'Pilih aktivitas dan minat yang kamu sukai.',
};

export default function InterestsStepPage() {
  return <InterestsStepView />;
}
