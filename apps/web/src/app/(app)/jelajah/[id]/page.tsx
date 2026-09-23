import type { Metadata } from 'next';
import { ActivityDetail } from './activity-detail';

export const metadata: Metadata = { title: 'Detail Ajakan' };

export default async function ActivityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ActivityDetail id={id} />;
}
