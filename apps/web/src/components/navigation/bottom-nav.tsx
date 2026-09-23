'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { FaIcon } from '@/components/ui/font-awesome-icon';
import { isActive, NAV_ITEMS } from './nav-items';

/** Navigasi bawah untuk layar mobile < md. Item minimal 44px; halaman aktif memakai aria-current. */
export function BottomNav({ className }: { className?: string }) {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Navigasi utama"
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)] shadow-nav',
        className,
      )}
    >
      <ul className="mx-auto flex max-w-md items-center justify-around px-2 py-1.5">
        {NAV_ITEMS.map(({ href, label, icon: Icon, faIcon, primary }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href} className="flex-1 flex justify-center">
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-all min-h-12 min-w-12',
                  active ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {primary ? (
                  <span className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm hover:scale-105 active:scale-95 transition-transform -mt-2.5">
                    {faIcon ? <FaIcon icon={faIcon} className="text-base" /> : <Icon className="size-5" aria-hidden="true" />}
                  </span>
                ) : (
                  <span className="flex h-6 items-center justify-center">
                    {faIcon ? (
                      <FaIcon icon={faIcon} className={cn('text-lg transition-transform', active && 'scale-110')} />
                    ) : (
                      <Icon className="size-5" aria-hidden="true" />
                    )}
                  </span>
                )}
                <span className={cn('tracking-tight', primary && 'mt-0.5')}>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
