import { RequireAuth } from '@/components/auth/guards';

/** Halaman yang cukup mensyaratkan sudah masuk (email belum tentu terverifikasi). */
export default function GateLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth mode="signed-in">
      <main id="konten" className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-6 px-6 py-8">
        {children}
      </main>
    </RequireAuth>
  );
}
