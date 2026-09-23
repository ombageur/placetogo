'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { MeetingCheckinView } from '@/components/meeting/meeting-checkin-view';

export default function PertemuanPage() {
  const { id } = useParams() as { id: string };
  return <MeetingCheckinView activityId={id} />;
}
