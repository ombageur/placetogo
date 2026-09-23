import { PublicOnly } from '@/components/auth/guards';

/** Halaman publik (pengenalan, daftar, masuk, reset). Pengguna yang sudah masuk dialihkan. */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <PublicOnly>
      <main id="konten" className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-6 px-6 py-8">
        {children}
      </main>
    </PublicOnly>
  );
}
