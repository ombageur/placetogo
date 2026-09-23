'use client';

import { ErrorState } from '@/components/ui/states';

export default function GlobalRouteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  // Pesan aman: detail galat tidak ditampilkan kepada pengguna.
  return (
    <main id="konten" className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 p-6">
      <h1 className="sr-only">Terjadi kesalahan</h1>
      <ErrorState onRetry={reset} />
    </main>
  );
}
