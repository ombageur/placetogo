import type { Metadata } from 'next';
import { CreateActivityForm } from '@/components/create-activity/create-activity-form';

export const metadata: Metadata = { title: 'Buat Ajakan' };

export default function BuatPage() {
  return <CreateActivityForm />;
}

