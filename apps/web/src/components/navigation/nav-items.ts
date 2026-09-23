import { Bell, Compass, House, MessageCircle, Plus, ShieldAlert, Store, User, Wallet, type LucideIcon } from 'lucide-react';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  faIcon?: string;
  /** Aksi utama (Buat) diberi penekanan visual. */
  primary?: boolean;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { href: '/', label: 'Beranda', icon: House, faIcon: 'fa-solid fa-house' },
  { href: '/jelajah', label: 'Jelajah', icon: Compass, faIcon: 'fa-solid fa-compass' },
  { href: '/buat', label: 'Buat', icon: Plus, faIcon: 'fa-solid fa-plus', primary: true },
  { href: '/chat', label: 'Chat', icon: MessageCircle, faIcon: 'fa-solid fa-comment-dots' },
  { href: '/profil', label: 'Profil', icon: User, faIcon: 'fa-solid fa-user' },
];

export const SIDE_NAV_EXTRA_ITEMS: readonly NavItem[] = [
  { href: '/notifikasi', label: 'Notifikasi', icon: Bell, faIcon: 'fa-solid fa-bell' },
  { href: '/dompet', label: 'Dompet', icon: Wallet, faIcon: 'fa-solid fa-wallet' },
  { href: '/mitra', label: 'Mitra Bisnis', icon: Store, faIcon: 'fa-solid fa-store' },
  { href: '/admin', label: 'Admin Panel', icon: ShieldAlert, faIcon: 'fa-solid fa-shield-halved' },
];

/** Beranda hanya aktif pada "/" persis; rute lain aktif untuk turunannya. */
export function isActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}
