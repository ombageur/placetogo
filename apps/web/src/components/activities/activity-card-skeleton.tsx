import { Skeleton } from '@/components/ui/skeleton';

export function ActivityCardSkeletonList({ count = 4 }: { count?: number }) {
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-3">
      <span className="sr-only">Memuat ajakan…</span>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex flex-col gap-2 rounded-card border border-border p-4">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="flex items-center justify-between pt-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-10" />
          </div>
        </div>
      ))}
    </div>
  );
}
