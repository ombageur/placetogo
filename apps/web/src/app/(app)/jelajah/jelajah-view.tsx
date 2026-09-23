'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  List,
  LocateFixed,
  Map as MapIcon,
  MapPinOff,
  SlidersHorizontal,
} from 'lucide-react';
import {
  ACTIVITY_CATEGORY_CATALOG,
  ACTIVITY_CATEGORY_IDS,
  type ActivityCategoryId,
  type CityId,
  type LatLng,
} from '@placetogo/shared';
import {
  CITY_CHANGE_EVENT,
  parseCityId,
  readStoredCity,
  type CityChangeDetail,
} from '@/lib/city-preference';
import { DateScrollStrip } from '@/components/activities/date-scroll-strip';
import { ActivityRow, groupActivitiesByHour } from '@/components/activities/activity-row';
import { ActivityCardSkeletonList } from '@/components/activities/activity-card-skeleton';
import { CurrentTimeBadge } from '@/components/activities/current-time-badge';
import { SearchBox } from '@/components/activities/search-box';
import { MapView } from '@/components/maps/map-view';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { FaIcon } from '@/components/ui/font-awesome-icon';
import { useDiscoveryFeed } from '@/hooks/use-discovery-feed';
import { useViewerPosition } from '@/hooks/use-viewer-position';
import { GeolocationDeniedError, useGeolocation } from '@/hooks/use-geolocation';
import type { DiscoveryQuery } from '@/lib/activities/query';
import { getPaymentTypeInfo } from '@/lib/activities/format';
import { cn } from '@/lib/utils';

function buildQuery(
  categoryId: ActivityCategoryId | undefined,
  cityId: CityId | undefined,
  searchText: string,
): DiscoveryQuery {
  const trimmed = searchText.trim();
  if (trimmed) return { kind: 'search', text: trimmed };
  return { kind: 'browse', categoryId, cityId };
}

function categoryFromParam(value: string | null): ActivityCategoryId | undefined {
  return value && (ACTIVITY_CATEGORY_IDS as readonly string[]).includes(value)
    ? (value as ActivityCategoryId)
    : undefined;
}

type NearbyStatus = 'idle' | 'requesting' | 'denied' | 'unavailable';

const DEFAULT_RADIUS_KM = 20;
type DisplayMode = 'list' | 'map';

export function JelajahView() {
  const searchParams = useSearchParams();
  const [initialCategory] = React.useState(() => categoryFromParam(searchParams.get('kategori')));

  const [displayMode, setDisplayMode] = React.useState<DisplayMode>('list');
  const [categoryId, setCategoryId] = React.useState<ActivityCategoryId | undefined>(initialCategory);
  const [cityId, setCityId] = React.useState<CityId | undefined>();
  const [searchText, setSearchText] = React.useState('');
  const [nearbyStatus, setNearbyStatus] = React.useState<NearbyStatus>('idle');
  const [selectedDateStr, setSelectedDateStr] = React.useState<string | undefined>();

  // Filter Modal state (Screen 15)
  const [filterModalOpen, setFilterModalOpen] = React.useState(false);
  const [timeRange, setTimeRange] = React.useState<'now' | 'tonight' | 'custom'>('now');
  const [radiusKm, setRadiusKm] = React.useState(DEFAULT_RADIUS_KM);
  const [radiusTouched, setRadiusTouched] = React.useState(false);
  const [nearbyCenter, setNearbyCenter] = React.useState<LatLng | null>(null);

  const feed = useDiscoveryFeed(buildQuery(initialCategory, undefined, ''));
  const { requestPosition } = useGeolocation();
  const viewerPosition = useViewerPosition();

  /*
   * Kota diambil dari pemilih di header, bukan dari kontrol di halaman ini.
   * Header menyimpannya di localStorage lalu menyiarkan CITY_CHANGE_EVENT.
   *
   * Efek ini dipasang ulang setiap kali kategori atau kata pencarian berubah,
   * supaya penanganan event selalu melihat nilai terbaru tanpa menyimpannya di ref
   * (membaca ref saat render dilarang oleh react-hooks/refs). Pembacaan localStorage
   * ditunda satu microtask karena setState sinkron di badan efek juga dilarang, dan
   * dijaga oleh `applied` agar hanya berjalan sekali.
   */
  const [cityApplied, setCityApplied] = React.useState(false);

  React.useEffect(() => {
    function applyCity(next: CityId | undefined) {
      setCityId(next);
      if (!nearbyCenter) feed.run(buildQuery(categoryId, next, searchText));
    }

    if (!cityApplied) {
      void Promise.resolve().then(() => {
        setCityApplied(true);
        const initial = readStoredCity();
        if (initial) applyCity(initial);
      });
    }

    function onCityEvent(event: Event) {
      applyCity(parseCityId((event as CustomEvent<CityChangeDetail>).detail?.cityId));
    }
    window.addEventListener(CITY_CHANGE_EVENT, onCityEvent);
    return () => window.removeEventListener(CITY_CHANGE_EVENT, onCityEvent);
    // feed stabil sepanjang umur komponen, jadi sengaja tidak dimasukkan ke dependensi.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nearbyCenter, categoryId, searchText, cityApplied]);

  /**
   * Penyaringan radius pada modal Filter (mockup layar 15) memakai lokasi perangkat.
   * Pusatnya disimpan agar penggantian kategori tetap mempertahankan mode terdekat.
   */
  async function applyRadius(km: number) {
    setNearbyStatus('requesting');
    try {
      const center: LatLng = await requestPosition();
      setNearbyStatus('idle');
      setNearbyCenter(center);
      feed.run({ kind: 'nearby', center, radiusKm: km });
    } catch (err) {
      setNearbyCenter(null);
      setNearbyStatus(err instanceof GeolocationDeniedError ? 'denied' : 'unavailable');
    }
  }

  function onSearch(text: string) {
    setSearchText(text);
    feed.run(buildQuery(categoryId, cityId, text));
  }

  const searching = searchText.trim() !== '';
  const showNearbyPlaceholder = !searching && nearbyStatus !== 'idle';

  /*
   * Penyaringan tanggal dilakukan di klien terhadap hasil yang sudah dimuat.
   * Firestore hanya mengizinkan satu field rentang per query, dan field itu sudah dipakai
   * `startsAt > sekarang` pada query penelusuran (lihat docs/discovery/discovery.md),
   * sehingga rentang kedua untuk batas hari tidak bisa ditambahkan di sisi server.
   *
   * `selectedDateStr` kosong berarti "Semua": seluruh hasil ditampilkan.
   */
  const visibleItems = React.useMemo(() => {
    if (!selectedDateStr) return feed.items;
    return feed.items.filter((item) => {
      const at = new Date(item.startsAt);
      const local = `${at.getFullYear()}-${String(at.getMonth() + 1).padStart(2, '0')}-${String(at.getDate()).padStart(2, '0')}`;
      return local === selectedDateStr;
    });
  }, [feed.items, selectedDateStr]);

  const previewItem = feed.items[0];

  return (
    <div className="flex flex-col gap-4">
      {/* Top Header & Mode Toggle (Screen 13 & 14) */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-foreground">Jelajah</h1>

        <div className="flex items-center gap-2">
          {/* List vs Map Segmented Toggle (Screen 14) */}
          <div className="flex rounded-xl bg-mint/70 p-1 border border-border">
            <button
              type="button"
              onClick={() => setDisplayMode('list')}
              className={cn(
                'flex min-h-11 items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                displayMode === 'list'
                  ? 'bg-background text-primary shadow-xs'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <List className="size-3.5" />
              List
            </button>
            <button
              type="button"
              onClick={() => setDisplayMode('map')}
              className={cn(
                'flex min-h-11 items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                displayMode === 'map'
                  ? 'bg-background text-primary shadow-xs'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <MapIcon className="size-3.5" />
              Peta
            </button>
          </div>

          <button
            type="button"
            onClick={() => setFilterModalOpen(true)}
            className="flex size-11 items-center justify-center rounded-xl border border-border bg-background text-foreground hover:bg-mint transition-colors shadow-xs"
            aria-label="Buka filter lanjutan"
          >
            <SlidersHorizontal className="size-4 text-primary" />
          </button>
        </div>
      </div>

      <SearchBox onSearch={onSearch} />

      {/*
        Banner "cara kerja" di bawah pencarian. Disembunyikan saat pengguna sedang mencari,
        supaya hasil pencarian langsung terlihat tanpa harus melewati banner.
      */}
      {!searching && (
        <Image
          src="/images/banner-cara-kerja.webp"
          alt="Cara kerja placetogo: mulai jelajah, beli coin, ikut aktivitas, dapat hadiah, lalu tarik penghasilan."
          width={1600}
          height={569}
          sizes="(max-width: 768px) 100vw, 768px"
          className="h-auto w-full rounded-2xl border border-border shadow-2xs"
        />
      )}

      {/* Date Picker Strip (Screen 13) */}
      {displayMode === 'list' && (
        <DateScrollStrip
          selectedDate={selectedDateStr}
          onSelectDate={(date) => setSelectedDateStr(date)}
        />
      )}

      {/*
        Chip Jam/Minat/Radius dihapus: penyaringan tanggal kini dilakukan lewat bilah tanggal
        di atas, sedangkan minat dan radius tetap tersedia lewat tombol filter di kanan judul.
        Jam sekarang dipertahankan sebagai titik acuan saat membaca kelompok per jam.
      */}
      {displayMode === 'list' && (
        <div className="flex items-center justify-end pb-1">
          <CurrentTimeBadge className="whitespace-nowrap text-xs font-medium text-muted-foreground" />
        </div>
      )}

      {/* TAMPILAN PETA (Screen 14) */}
      {displayMode === 'map' && (
        <div className="flex flex-col gap-3 relative">
          <div className="overflow-hidden rounded-3xl border border-border shadow-md h-[440px] relative">
            <MapView
              lat={previewItem?.lat ?? -7.2575}
              lng={previewItem?.lng ?? 112.7521}
              label={previewItem?.venueName ?? 'Surabaya'}
            />

            {/* Floating Bottom Card Preview (Screen 14) */}
            <div className="absolute inset-x-3 bottom-14 z-10">
              <Link
                href={previewItem ? `/jelajah/${previewItem.id}` : '/jelajah'}
                className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-background/95 backdrop-blur-md border border-border shadow-xl hover:border-primary transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-mint text-primary">
                    <FaIcon icon="fa-mug-hot" className="text-base" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-bold text-foreground line-clamp-1 truncate">
                        {previewItem?.title ?? 'Ngopi santai di Tuku'}
                      </h3>
                      {(() => {
                        const pInfo = getPaymentTypeInfo(previewItem?.paymentType ?? 'split');
                        return (
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border shrink-0 ${pInfo.className}`}
                          >
                            <FaIcon icon={pInfo.icon} className="text-[9px]" />
                            <span>{pInfo.shortLabel}</span>
                          </span>
                        );
                      })()}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Hari ini • 18:00 • 2,4 km
                    </p>
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-mint px-2.5 py-1 text-xs font-bold text-primary">
                  {previewItem ? `${previewItem.participantCount}/${previewItem.capacity}` : '3/4'}
                </span>
              </Link>
            </div>

            {/* Screen 14: Sticky Floating Button "Lihat daftar di sekitar" */}
            <div className="absolute inset-x-3 bottom-3 z-10">
              <button
                type="button"
                onClick={() => setDisplayMode('list')}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-xs font-bold text-primary-foreground shadow-md transition-transform hover:scale-[1.01]"
              >
                <FaIcon icon="fa-list-ul" className="text-xs" />
                <span>Lihat daftar di sekitar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAMPILAN LIST (Screen 13: Jam Grouped Accordion) */}
      {displayMode === 'list' && (
        <div className="flex flex-col gap-4">
          {showNearbyPlaceholder ? (
            <NearbyPlaceholder status={nearbyStatus} onRetry={() => void applyRadius(radiusKm)} />
          ) : (
            <>
              {/* Screen 13: daftar ajakan dikelompokkan menurut jam mulai, dari data asli. */}
              {feed.status === 'loading' && <ActivityCardSkeletonList />}
              {feed.status === 'error' && (
                <ErrorState description="Tidak dapat memuat ajakan." onRetry={feed.retry} />
              )}
              {feed.status === 'ready' && visibleItems.length === 0 && (
                <EmptyState
                  icon={<FaIcon icon="fa-calendar-xmark" className="text-xl" />}
                  title="Belum ada ajakan"
                  description={
                    selectedDateStr
                      ? 'Tidak ada ajakan pada tanggal ini. Pilih tanggal lain atau "Semua".'
                      : 'Coba ubah filter atau kata kunci pencarian.'
                  }
                />
              )}
              {feed.status === 'ready' && visibleItems.length > 0 && (
                <div className="flex flex-col gap-3">
                  {groupActivitiesByHour(visibleItems).map((group) => (
                    <div key={group.key} className="flex flex-col gap-2">
                      <div className="flex items-center justify-between border-b border-border/60 pb-1.5 pt-1">
                        <span className="flex items-baseline gap-2 text-sm font-semibold text-foreground">
                          <span>{group.label}</span>
                          <span className="text-xs font-normal text-muted-foreground">
                            | {group.items.length} aktivitas
                          </span>
                        </span>
                      </div>
                      {group.items.map((activity) => (
                        <ActivityRow
                          key={activity.id}
                          activity={activity}
                          viewerPosition={nearbyCenter ?? viewerPosition}
                        />
                      ))}
                    </div>
                  ))}
                  {feed.hasMore && (
                    <Button variant="secondary" fullWidth loading={feed.loadingMore} onClick={feed.loadMore}>
                      Muat lebih banyak
                    </Button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* MODAL FILTER PENCARIAN (Screen 15) */}
      <Modal open={filterModalOpen} onClose={() => setFilterModalOpen(false)} title="Filter Pencarian">
        <div className="flex flex-col gap-4">
          {/* 1. Rentang Waktu */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-foreground uppercase tracking-wider">
              Rentang Waktu
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'now', label: 'Sekarang - 1 jam' },
                { id: 'tonight', label: 'Malam ini' },
                { id: 'custom', label: 'Pilih jam' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTimeRange(t.id as typeof timeRange)}
                  className={cn(
                    'flex items-center justify-center p-2 rounded-xl border text-[11px] font-bold text-center transition-all',
                    timeRange === t.id
                      ? 'border-primary bg-primary text-primary-foreground shadow-xs'
                      : 'border-border bg-background text-muted-foreground hover:bg-mint',
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Kategori Minat */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-foreground uppercase tracking-wider">
              Minat & Kategori
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {ACTIVITY_CATEGORY_CATALOG.map((cat) => {
                const isSelected = categoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryId(isSelected ? undefined : cat.id)}
                    className={cn(
                      'flex items-center gap-1.5 p-2 rounded-xl border text-xs font-semibold transition-all',
                      isSelected
                        ? 'border-primary bg-mint text-primary font-bold shadow-xs'
                        : 'border-border bg-background text-muted-foreground hover:bg-mint/40',
                    )}
                  >
                    <span className="truncate">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Radius Lokasi Slider */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                Radius Lokasi
              </label>
              <span className="text-xs font-extrabold text-primary">{radiusKm} km</span>
            </div>
            <input
              type="range"
              min={1}
              max={50}
              step={1}
              value={radiusKm}
              onChange={(e) => {
                setRadiusKm(Number(e.target.value));
                setRadiusTouched(true);
              }}
              className="w-full accent-primary"
            />
          </div>

          {/* Action Buttons (Screen 15) */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                setCategoryId(undefined);
                setTimeRange('now');
                setRadiusKm(DEFAULT_RADIUS_KM);
                setRadiusTouched(false);
                setNearbyCenter(null);
                setNearbyStatus('idle');
              }}
            >
              Reset
            </Button>
            <Button
              size="lg"
              onClick={() => {
                setFilterModalOpen(false);
                if (radiusTouched) void applyRadius(radiusKm);
                else feed.run(buildQuery(categoryId, cityId, searchText));
              }}
            >
              Terapkan
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function NearbyPlaceholder({
  status,
  onRetry,
}: {
  status: Exclude<NearbyStatus, 'idle'>;
  onRetry: () => void;
}) {
  if (status === 'requesting') {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex flex-col items-center gap-2 rounded-card bg-mint px-6 py-10 text-center"
      >
        <LocateFixed className="size-7 animate-pulse text-primary" aria-hidden="true" />
        <p className="text-sm font-medium text-primary">Meminta izin lokasi…</p>
      </div>
    );
  }
  return (
    <EmptyState
      icon={<MapPinOff className="size-7" />}
      title={status === 'denied' ? 'Izin lokasi ditolak' : 'Lokasi tidak tersedia'}
      description={
        status === 'denied'
          ? 'Aktifkan izin lokasi untuk peramban ini lewat pengaturan, lalu coba lagi.'
          : 'Tidak dapat mengambil lokasimu saat ini. Periksa GPS/koneksi lalu coba lagi.'
      }
      action={<Button onClick={onRetry}>Coba lagi</Button>}
    />
  );
}
