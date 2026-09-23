import { RequireAuth } from '@/components/auth/guards';
import { AppHeader } from '@/components/navigation/app-header';
import { BottomNav } from '@/components/navigation/bottom-nav';
import { SideNav } from '@/components/navigation/side-nav';

/**
 * Shell aplikasi (privat): navigasi bawah pada mobile (< md), rail/sidebar pada tablet dan desktop.
 * mode="ready" mensyaratkan sesi terverifikasi DAN profil lengkap; selain itu dialihkan ke
 * /verifikasi-email atau /lengkapi-profil (lihat routeForStage).
 */
export default function AppShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth mode="ready">
      <div className="min-h-dvh md:flex">
        <a
          href="#konten"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-full focus:bg-primary focus:px-4 focus:py-3 focus:font-semibold focus:text-primary-foreground"
        >
          Lewati ke konten
        </a>
        <SideNav className="hidden md:flex" />
        <div className="min-w-0 flex-1">
          <AppHeader className="md:hidden" />
          <main
            id="konten"
            tabIndex={-1}
            className="mx-auto w-full max-w-2xl px-4 pb-28 pt-2 outline-none md:px-8 md:pb-10 md:pt-8 lg:max-w-4xl"
          >
            {children}
          </main>
        </div>
        <BottomNav className="md:hidden" />
      </div>
    </RequireAuth>
  );
}
