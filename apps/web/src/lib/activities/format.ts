import {
  ACTIVITY_CATEGORY_CATALOG,
  ACTIVITY_TRAIT_CATALOG,
  CITY_CATALOG,
  INTEREST_CATALOG,
  normalizeActivityCategoryId,
  type PAYMENT_TYPES,
} from '@placetogo/shared';

export const categoryLabel = (id?: string | null) => {
  if (!id) return '';
  const normalizedId = normalizeActivityCategoryId(id);
  return (
    ACTIVITY_CATEGORY_CATALOG.find((c) => c.id === normalizedId)?.label ??
    INTEREST_CATALOG.find((i) => i.id === normalizedId)?.label ??
    id
  );
};
export const cityLabel = (id: string) => CITY_CATALOG.find((c) => c.id === id)?.label ?? id;

const PAYMENT_LABELS: Record<(typeof PAYMENT_TYPES)[number], string> = {
  split: 'Patungan',
  treat: 'Ditraktir',
  gift: 'Hadiah',
};
export const paymentTypeLabel = (type: (typeof PAYMENT_TYPES)[number]) => PAYMENT_LABELS[type];

export interface PaymentTypeBadgeInfo {
  label: string;
  shortLabel: string;
  icon: string;
  className: string;
  badgeVariant: 'warning' | 'neutral';
}

export function getPaymentTypeInfo(type?: (typeof PAYMENT_TYPES)[number] | string): PaymentTypeBadgeInfo {
  switch (type) {
    case 'treat':
      return {
        label: 'Ditraktir',
        shortLabel: 'Ditraktir',
        icon: 'fa-cake-candles',
        className: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800',
        badgeVariant: 'neutral',
      };
    case 'gift':
      return {
        label: 'Hadiah (5.000 Coin)',
        shortLabel: 'Hadiah',
        icon: 'fa-gift',
        className: 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800 font-bold',
        badgeVariant: 'warning',
      };
    case 'split':
    default:
      return {
        label: 'Patungan',
        shortLabel: 'Patungan',
        icon: 'fa-handshake',
        className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800',
        badgeVariant: 'neutral',
      };
  }
}

const dateFormatter = new Intl.DateTimeFormat('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });
const timeFormatter = new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit' });

/** "Sab, 16 Nov · 16.00" — locale Indonesia, waktu lokal perangkat. */
export function formatActivityDateTime(startsAtMs: number): string {
  const date = new Date(startsAtMs);
  return `${dateFormatter.format(date)} · ${timeFormatter.format(date).replace(':', '.')}`;
}

/** "850 m" di bawah 1 km, "3,2 km" di atasnya — locale Indonesia (koma desimal). */
export function formatDistanceKm(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toLocaleString('id-ID', { maximumFractionDigits: 1 })} km`;
}

const dayOnlyFormatter = new Intl.DateTimeFormat('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });

/** "Hari ini" / "Besok" / "Sab, 16 Nov" — sesuai subjudul baris ajakan pada mockup layar 12. */
export function formatRelativeDay(startsAtMs: number, now: number = Date.now()): string {
  const start = new Date(startsAtMs);
  const today = new Date(now);
  const midnight = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round((midnight(start) - midnight(today)) / 86_400_000);
  if (diffDays === 0) return 'Hari ini';
  if (diffDays === 1) return 'Besok';
  return dayOnlyFormatter.format(start);
}

/** "18.00" — jam mulai saja, dipakai sebagai judul grup jam pada mockup layar 13. */
export function formatActivityTime(startsAtMs: number): string {
  return timeFormatter.format(new Date(startsAtMs)).replace(':', '.');
}

/** Label sifat ajakan; mengembalikan idnya apa adanya bila tidak dikenali. */
export const activityTraitLabel = (id: string) =>
  ACTIVITY_TRAIT_CATALOG.find((trait) => trait.id === id)?.label ?? id;
