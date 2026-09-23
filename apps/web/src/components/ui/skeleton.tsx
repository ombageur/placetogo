import { cn } from '@/lib/utils';

/** Blok pemuat dekoratif; disembunyikan dari pembaca layar. Animasi mengikuti prefers-reduced-motion. */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn('rounded-xl bg-mint-strong motion-safe:animate-pulse', className)} />;
}

/** Daftar kartu pemuat dengan pengumuman "Memuat" untuk teknologi bantu. */
export function SkeletonList({ count = 3, label = 'Memuat' }: { count?: number; label?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-3">
      <span className="sr-only">{label}…</span>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-card border border-border p-4">
          <Skeleton className="size-11 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
