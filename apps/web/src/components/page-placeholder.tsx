import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/states';

/**
 * Halaman kerangka Fase 01. Sengaja tidak menampilkan data contoh yang tampak seperti
 * data produksi; hanya menyatakan bahwa fiturnya belum tersedia dan pada fase apa akan hadir.
 */
export function PagePlaceholder({
  title,
  description,
  phase,
  icon,
}: {
  title: string;
  description: string;
  phase: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1>{title}</h1>
        <Badge variant="info">{phase}</Badge>
      </div>
      <EmptyState icon={icon} title="Segera hadir" description={description} />
    </div>
  );
}
