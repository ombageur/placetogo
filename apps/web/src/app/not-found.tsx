import Link from 'next/link';
import { Compass } from 'lucide-react';
import { EmptyState } from '@/components/ui/states';
import { buttonVariants } from '@/components/ui/button';

export default function NotFound() {
  return (
    <main id="konten" className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 p-6">
      <h1 className="sr-only">Halaman tidak ditemukan</h1>
      <EmptyState
        icon={<Compass className="size-7" />}
        title="Halaman tidak ditemukan"
        description="Alamat yang kamu tuju tidak ada atau sudah dipindahkan."
        action={
          <Link href="/" className={buttonVariants()}>
            Kembali ke Beranda
          </Link>
        }
      />
    </main>
  );
}
