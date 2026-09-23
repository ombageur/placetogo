import { RequireAuth } from '@/components/auth/guards';

/** Pengisian profil: sudah masuk dan email terverifikasi, profil boleh belum lengkap. */
export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth mode="verified">
      <main id="konten" className="mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-6 px-6 py-8">
        {children}
      </main>
    </RequireAuth>
  );
}
