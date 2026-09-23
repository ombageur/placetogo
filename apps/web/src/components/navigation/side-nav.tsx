'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Logo, LogoMark } from '@/components/brand/logo';
import { useIsAdmin } from '@/lib/admin-auth';
import { NAV_ITEMS, SIDE_NAV_EXTRA_ITEMS, isActive } from './nav-items';

/** Navigasi samping untuk md ke atas: rail ikon+label pada tablet, penuh pada desktop. */
export function SideNav({ className }: { className?: string }) {
  const pathname = usePathname();
  const isAdmin = useIsAdmin();

  const extraItems = SIDE_NAV_EXTRA_ITEMS.filter((item) => {
    if (item.href === '/admin') return isAdmin;
    return true;
  });

  return (
    <nav
      aria-label="Navigasi utama"
      className={cn(
        'sticky top-0 h-dvh w-24 shrink-0 flex-col gap-2 border-r border-border bg-background px-3 py-5 lg:w-64 lg:px-4 flex justify-between',
        className,
      )}
    >
      <div className="flex flex-col gap-2">
        <Link
          href="/"
          aria-label="placetogo.id, ke Beranda"
          className="mb-4 flex min-h-11 items-center justify-center rounded-xl lg:justify-start"
        >
          <Logo className="hidden h-7 lg:block" alt="" />
          <LogoMark className="h-8 lg:hidden" />
        </Link>
        <ul className="flex flex-col gap-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon, primary }) => {
            const active = isActive(pathname, href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-2xl text-xs font-semibold lg:flex-row lg:justify-start lg:gap-3 lg:px-4 lg:text-base',
                    primary
                      ? 'bg-primary text-primary-foreground hover:bg-secondary'
                      : active
                        ? 'bg-mint text-primary'
                        : 'text-muted-foreground hover:bg-mint hover:text-primary',
                  )}
                >
                  <Icon className="size-5" aria-hidden="true" />
                  <span>{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Extra Nav Items (Notifikasi, Dompet, Mitra, Admin Panel) */}
      <div className="flex flex-col gap-1 border-t border-border pt-3">
        <ul className="flex flex-col gap-1">
          {extraItems.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-xl text-xs font-semibold lg:flex-row lg:justify-start lg:gap-3 lg:px-3 lg:text-sm',
                    active
                      ? 'bg-mint text-primary font-bold'
                      : 'text-muted-foreground hover:bg-mint hover:text-primary',
                  )}
                >
                  <Icon className="size-4" aria-hidden="true" />
                  <span>{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
