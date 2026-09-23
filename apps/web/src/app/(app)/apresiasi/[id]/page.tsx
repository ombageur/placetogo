'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function ApresiasiPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  React.useEffect(() => {
    if (id) {
      router.replace(`/jelajah/${id}`);
    }
  }, [id, router]);

  return (
    <div className="flex h-64 items-center justify-center">
      <div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );
}
