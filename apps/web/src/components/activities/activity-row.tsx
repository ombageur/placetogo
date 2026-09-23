import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight } from 'lucide-react';
import { haversineDistanceKm, type ActivityDoc, type LatLng } from '@placetogo/shared';
import { getCategoryOrInterestImage } from './category-icons';
import {
  categoryLabel,
  formatActivityTime,
  formatDistanceKm,
  formatRelativeDay,
  getPaymentTypeInfo,
} from '@/lib/activities/format';

type RowActivity = ActivityDoc & { distanceKm?: number };

/**
 * Kartu ajakan pada daftar (Beranda dan Jelajah).
 *
 * Susunannya: ubin ikon kategori di kiri, lalu judul dengan satu baris keterangan
 * "tempat · hari, jam · jarak" dan dua chip (metode pembayaran dan kategori), lalu
 * ketersediaan kursi di kanan.
 *
 * Ketersediaan ditulis sebagai angka yang langsung bisa ditindaklanjuti ("3 kursi tersisa")
 * alih-alih pecahan 1/4, karena yang ingin diketahui calon peserta adalah masih ada tempat
 * atau tidak. Jumlah lengkapnya tetap tampil kecil di bawahnya.
 */
export function ActivityRow({
  activity,
  viewerPosition,
}: {
  activity: RowActivity;
  /** Lokasi pengguna, bila diketahui; dipakai menghitung jarak untuk ajakan yang berkoordinat. */
  viewerPosition?: LatLng | null;
}) {
  const isFull = activity.participantCount >= activity.capacity;
  const seatsLeft = Math.max(0, activity.capacity - activity.participantCount);
  const paymentInfo = getPaymentTypeInfo(activity.paymentType);

  /*
   * Jarak sudah tersedia pada hasil pencarian terdekat. Pada penelusuran biasa, hasilnya
   * tidak membawa jarak, jadi dihitung di sini selama lokasi pengguna diketahui dan ajakannya
   * punya koordinat. Ajakan tanpa koordinat memang tidak menampilkan jarak.
   */
  const distanceKm =
    activity.distanceKm ??
    (viewerPosition && activity.lat !== undefined && activity.lng !== undefined
      ? haversineDistanceKm(viewerPosition, { lat: activity.lat, lng: activity.lng })
      : undefined);

  // Waktunya sudah tampil di kolom kiri, jadi baris ini cukup tempat dan jarak.
  const meta = [activity.venueName];
  if (distanceKm !== undefined) meta.push(formatDistanceKm(distanceKm));

  return (
    <Link
      href={`/jelajah/${activity.id}`}
      className="flex items-center gap-2.5 rounded-2xl border border-border bg-card p-3 shadow-2xs transition-all hover:border-primary/40 hover:bg-mint/15 sm:gap-4 sm:p-3.5"
    >
      <div className="flex w-10 shrink-0 flex-col items-center text-center sm:w-14">
        <span className="text-sm font-semibold text-foreground sm:text-base">
          {formatActivityTime(activity.startsAt)}
        </span>
        <span className="text-[11px] text-muted-foreground">
          {formatRelativeDay(activity.startsAt)}
        </span>
      </div>

      <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-mint-strong/30 bg-mint/50 p-1 shadow-2xs sm:size-14 sm:p-1.5">
        <Image
          src={getCategoryOrInterestImage(activity.categoryId)}
          alt=""
          width={48}
          height={48}
          className="size-full object-contain"
        />
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h3 className="line-clamp-2 text-sm font-semibold text-foreground sm:truncate sm:text-base">
          {activity.title}
        </h3>
        <p className="truncate text-xs text-muted-foreground">{meta.join(' · ')}</p>
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <span className="inline-flex shrink-0 items-center rounded-full bg-warning-soft px-2 py-0.5 text-[11px] font-medium text-warning-soft-foreground">
            {paymentInfo.shortLabel}
          </span>
          <span className="inline-flex shrink-0 items-center rounded-full bg-mint px-2 py-0.5 text-[11px] font-medium text-primary">
            {categoryLabel(activity.categoryId)}
          </span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <div className="flex flex-col items-end text-right">
          <span
            className={`text-xs font-semibold ${isFull ? 'text-danger-soft-foreground' : 'text-primary'}`}
          >
            {isFull ? 'Penuh' : <>{seatsLeft} kursi<span className="hidden sm:inline"> tersisa</span></>}
          </span>
          <span className="hidden text-[11px] text-muted-foreground xs:inline">
            {activity.participantCount} dari {activity.capacity} peserta
          </span>
        </div>
        <span className="flex size-7 items-center justify-center rounded-full bg-mint/60 text-primary">
          <ChevronRight className="size-4" aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}

/**
 * Mengelompokkan ajakan ke dalam rentang satu jam, urut menaik.
 *
 * Kuncinya tanggal sekaligus jam, bukan jamnya saja, supaya ajakan pada jam yang sama di
 * hari berbeda tidak tergabung menjadi satu kelompok.
 */
export function groupActivitiesByHour(
  items: RowActivity[],
): { key: string; label: string; items: RowActivity[] }[] {
  const groups = new Map<string, { startsAt: number; items: RowActivity[] }>();
  for (const item of items) {
    const at = new Date(item.startsAt);
    const key = `${at.getFullYear()}-${at.getMonth()}-${at.getDate()}-${at.getHours()}`;
    const bucket = groups.get(key);
    if (bucket) bucket.items.push(item);
    else groups.set(key, { startsAt: item.startsAt, items: [item] });
  }
  return [...groups.entries()]
    .sort((a, b) => a[1].startsAt - b[1].startsAt)
    .map(([key, group]) => {
      const hour = String(new Date(group.startsAt).getHours()).padStart(2, '0');
      return { key, label: `${hour}.00 – ${hour}.59`, items: group.items };
    });
}
