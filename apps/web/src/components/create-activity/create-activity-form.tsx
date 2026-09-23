'use client';

import * as React from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Coins,
  Sparkles,
  Check,
  AlertCircle,
  Plus,
  Wallet,
  CalendarDays,
  Clock,
  MapPin,
  Users,
  Gift,
} from 'lucide-react';
import {
  ACTIVITY_CATEGORY_CATALOG,
  ACTIVITY_TRAIT_CATALOG,
  MAX_ACTIVITY_TRAITS,
  type ActivityTraitId,
  CITY_CATALOG,
  type PAYMENT_TYPES,
  type ActivityCategoryId,
  type CityId,
  type CreateActivityInput,
  type PlaceDetails,
} from '@placetogo/shared';
import { Button } from '@/components/ui/button';
import { FaIcon } from '@/components/ui/font-awesome-icon';
import { getCategoryOrInterestImage } from '@/components/activities/category-icons';
import { useToast } from '@/components/ui/toast';
import { createActivity, publishActivity, getWallet, ApiError } from '@/lib/api';
import { categoryLabel, cityLabel, paymentTypeLabel } from '@/lib/activities/format';
import { cn } from '@/lib/utils';
import { getPublicEnv } from '@/lib/env';
import { PlacePicker } from '@/components/maps/place-picker';
import { ALL_21_GIFTS, type GiftItem } from '@/components/hadiah/gift-catalog';
import { TopupModal } from '@/components/wallet/topup-modal';
import { useDeferredEffect } from '@/hooks/use-mount-effect';

/**
 * Fase 4: Multi-Step Buat Ajakan & Ekonomi Koin Hadiah (Screens 16–18)
 * - Step 1 (Screen 16): Detail Ajakan (Judul, Deskripsi, Tempat/Google Places, Tanggal, Jam)
 * - Step 2 (Screen 17): Pilih Metode Pembayaran (Patungan, Ditraktir, Hadiah 21 Icon Koin)
 * - Step 3 (Screen 18): Konfirmasi Ajakan & Rincian Biaya Koin sebelum Publikasi
 */

export function CreateActivityForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  // Multi-step state: 1, 2, atau 3
  const [step, setStep] = React.useState<1 | 2 | 3>(() => {
    const s = Number(searchParams.get('step'));
    return s === 2 || s === 3 ? s : 1;
  });

  // Step 1: Detail Ajakan
  const [title, setTitle] = React.useState('Ngobrol santai');
  const [description, setDescription] = React.useState('Ceritakan sedikit tentang ajakan ini');
  const [categoryId, setCategoryId] = React.useState<ActivityCategoryId>('ngobrol');
  const [cityId, setCityId] = React.useState<CityId>('surabaya');
  const [selectedPlace, setSelectedPlace] = React.useState<PlaceDetails | null>(null);
  const [manualVenue, setManualVenue] = React.useState('Tuku Menteng');
  const [useManualVenue, setUseManualVenue] = React.useState(true);

  // Waktu pertemuan (default hari ini / besok jam 19:00)
  const [dateStr, setDateStr] = React.useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0]!;
  });
  const [timeStr, setTimeStr] = React.useState('19:00');
  const [capacity, setCapacity] = React.useState(4);
  const [traits, setTraits] = React.useState<ActivityTraitId[]>([]);

  // Step 2: Metode Pembayaran & Pilihan Hadiah
  const [paymentType, setPaymentType] = React.useState<(typeof PAYMENT_TYPES)[number]>('treat');
  const [selectedGiftId, setSelectedGiftId] = React.useState<string>('kopi');
  const [myCoinBalance, setMyCoinBalance] = React.useState<number | null>(null);
  const [topupModalOpen, setTopupModalOpen] = React.useState(false);

  // Status & Error handling
  const [loading, setLoading] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const mapsReady = Boolean(getPublicEnv().NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_API_KEY);

  // Load Wallet Balance
  const fetchWallet = React.useCallback(() => {
    void getWallet()
      .then((w) => setMyCoinBalance(w.balance))
      .catch(() => setMyCoinBalance(75000));
  }, []);

  useDeferredEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  const selectedGift = ALL_21_GIFTS.find((g) => g.id === selectedGiftId) ?? ALL_21_GIFTS[0]!;
  const coinCost = paymentType === 'gift' ? selectedGift.coinPrice : 0;
  const hasEnoughCoins = myCoinBalance !== null ? myCoinBalance >= coinCost : true;

  function handlePlaceSelect(place: PlaceDetails) {
    setSelectedPlace(place);
    setManualVenue(place.name);
    setUseManualVenue(false);
  }

  function toggleTrait(id: ActivityTraitId) {
    setTraits((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : current.length >= MAX_ACTIVITY_TRAITS
          ? current
          : [...current, id],
    );
  }

  function handleNextStep1() {
    const newErrors: Record<string, string> = {};

    if (title.trim().length < 3) {
      newErrors.title = 'Judul minimal 3 karakter.';
    } else if (title.trim().length > 80) {
      newErrors.title = 'Judul maksimal 80 karakter.';
    }

    const venueName = useManualVenue ? manualVenue.trim() : (selectedPlace?.name || manualVenue.trim());
    if (!venueName) {
      newErrors.venue = 'Tempat/lokasi pertemuan wajib diisi.';
    }

    if (!dateStr || !timeStr) {
      newErrors.startsAt = 'Tanggal dan waktu wajib dipilih.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setStep(2);
  }

  function handleNextStep2() {
    if (paymentType === 'gift' && myCoinBalance !== null && myCoinBalance < coinCost) {
      toast({
        title: 'Saldo Coin Kurang',
        description: `Kamu membutuhkan ${coinCost.toLocaleString('id-ID')} Coin untuk membuat ajakan dengan hadiah ${selectedGift.name}. Silakan Top Up terlebih dahulu.`,
        variant: 'warning',
      });
      setTopupModalOpen(true);
      return;
    }
    setStep(3);
  }

  function handleBack() {
    if (step === 3) setStep(2);
    else if (step === 2) setStep(1);
    else router.back();
  }

  // Publikasi final di Step 3
  async function handlePublish() {
    if (paymentType === 'gift' && myCoinBalance !== null && myCoinBalance < coinCost) {
      toast({
        title: 'Saldo Coin Kurang',
        description: `Kamu membutuhkan ${coinCost.toLocaleString('id-ID')} Coin untuk membuat ajakan dengan hadiah ini. Silakan Top Up terlebih dahulu.`,
        variant: 'warning',
      });
      setTopupModalOpen(true);
      return;
    }

    setLoading(true);
    setErrors({});

    const venueName = useManualVenue ? manualVenue.trim() : (selectedPlace?.name || manualVenue.trim());
    const startsAtMs = new Date(`${dateStr}T${timeStr}:00`).getTime() || Date.now() + 3600000;

    const payload: CreateActivityInput = {
      title: title.trim(),
      description: description.trim() || undefined,
      categoryId,
      cityId,
      venueName,
      startsAt: startsAtMs,
      capacity,
      paymentType,
      ...(traits.length > 0 ? { traits } : {}),
      ...(selectedPlace && !useManualVenue
        ? {
            placeId: selectedPlace.placeId,
            lat: selectedPlace.lat,
            lng: selectedPlace.lng,
          }
        : {}),
    };

    try {
      // 1. Buat draft
      const draft = await createActivity(payload);
      // 2. Publikasikan
      const published = await publishActivity(draft.id);

      toast({
        title: 'Ajakan Berhasil Dibuat! 🎉',
        description: `Ajakan "${published.title}" kini aktif dan siap menerima peserta.`,
        variant: 'success',
      });

      router.push(`/jelajah/${published.id}`);
    } catch (err) {
      setLoading(false);
      let message = 'Terjadi kesalahan saat membuat ajakan. Coba lagi.';
      if (err instanceof ApiError) {
        if (err.message) message = err.message;
        if (err.code === 'validation_error') message = 'Data yang dikirim tidak valid.';
      }
      toast({ title: 'Gagal membuat ajakan', description: message, variant: 'error' });
    }
  }

  // Format tanggal ramah untuk ringkasan (misal: "Sel, 22 Apr 2025")
  const formattedDate = React.useMemo(() => {
    try {
      const d = new Date(`${dateStr}T00:00:00`);
      return new Intl.DateTimeFormat('id-ID', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(d);
    } catch {
      return dateStr;
    }
  }, [dateStr]);

  const venueDisplayName = useManualVenue ? manualVenue : (selectedPlace?.name || manualVenue || 'Tuku Menteng');

  return (
    <div className="flex flex-col gap-5 py-2 pb-24">
      {/* Header bar navigasi & 3-Step Indicator (Screens 16, 17, 18) */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handleBack}
          aria-label="Kembali ke langkah sebelumnya"
          className="flex size-11 items-center justify-center rounded-full border border-border bg-background text-foreground transition-all hover:bg-mint hover:border-primary/40 cursor-pointer shadow-2xs"
        >
          <FaIcon icon="fa-chevron-left" className="text-sm" />
        </button>

        {/* 3 Step Indicator dengan garis penghubung */}
        <div className="flex items-center gap-2">
          {/* Step 1 Indicator */}
          <div
            className={cn(
              'flex size-7 items-center justify-center rounded-full text-xs font-bold transition-all',
              step > 1
                ? 'bg-primary text-primary-foreground'
                : step === 1
                  ? 'bg-primary text-primary-foreground ring-4 ring-mint'
                  : 'bg-muted text-muted-foreground border border-border',
            )}
          >
            {step > 1 ? <FaIcon icon="fa-check" className="text-[10px]" /> : '1'}
          </div>

          <div
            className={cn(
              'h-0.5 w-6 transition-all',
              step >= 2 ? 'bg-primary' : 'bg-border',
            )}
          />

          {/* Step 2 Indicator */}
          <div
            className={cn(
              'flex size-7 items-center justify-center rounded-full text-xs font-bold transition-all',
              step > 2
                ? 'bg-primary text-primary-foreground'
                : step === 2
                  ? 'bg-primary text-primary-foreground ring-4 ring-mint'
                  : 'bg-muted text-muted-foreground border border-border',
            )}
          >
            {step > 2 ? <FaIcon icon="fa-check" className="text-[10px]" /> : '2'}
          </div>

          <div
            className={cn(
              'h-0.5 w-6 transition-all',
              step >= 3 ? 'bg-primary' : 'bg-border',
            )}
          />

          {/* Step 3 Indicator */}
          <div
            className={cn(
              'flex size-7 items-center justify-center rounded-full text-xs font-bold transition-all',
              step === 3
                ? 'bg-primary text-primary-foreground ring-4 ring-mint'
                : 'bg-muted text-muted-foreground border border-border',
            )}
          >
            3
          </div>
        </div>

        {/* Placeholder penyeimbang posisi header */}
        <div className="size-11" />
      </div>

      {/* ========================================================================= */}
      {/* SCREEN 16: STEP 1 - DETAIL AJAKAN */}
      {/* ========================================================================= */}
      {step === 1 && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="tracking-tight text-foreground">
              Buat Ajakan
            </h1>
            <p className="text-xs text-muted-foreground">
              Mulai dari obrolan santai, olahraga bareng, atau nonton film bersama teman baru.
            </p>
          </div>

          <div className="flex flex-col gap-4 pt-1">
            {/* Field 1: Kategori Minat (12 Minat Resmi) */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground">
                  Kategori Minat
                </label>
                <span className="text-[10px] text-muted-foreground">
                  Pilih 1 dari 12 minat
                </span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {ACTIVITY_CATEGORY_CATALOG.map(({ id, label }) => {
                  const selected = categoryId === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setCategoryId(id)}
                      className={cn(
                        'flex flex-col items-center justify-center gap-1.5 rounded-2xl border p-2.5 text-center transition-all cursor-pointer',
                        selected
                          ? 'border-primary bg-mint-strong text-primary ring-2 ring-primary/30 shadow-xs font-bold scale-[1.02]'
                          : 'border-border-strong bg-background text-foreground hover:bg-mint/40 hover:border-primary/40',
                      )}
                    >
                      <Image
                        src={getCategoryOrInterestImage(id)}
                        alt={label}
                        width={36}
                        height={36}
                        className="size-8 rounded-full object-contain shrink-0"
                      />
                      <span className="text-[11px] leading-tight truncate w-full">{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Field 2: Judul */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="title-input" className="text-xs font-semibold text-foreground">
                Judul Ajakan
              </label>
              <input
                id="title-input"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Ngobrol santai seputar desain & karier"
                className="w-full rounded-2xl border border-border-strong bg-background px-4 py-3 text-sm text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />
              {errors.title && (
                <p className="text-xs font-medium text-danger">{errors.title}</p>
              )}
            </div>

            {/* Field 3: Deskripsi */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="desc-input" className="text-xs font-semibold text-foreground">
                Deskripsi
              </label>
              <textarea
                id="desc-input"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ceritakan sedikit tentang suasana atau hal yang akan dibahas..."
                className="w-full rounded-2xl border border-border-strong bg-background p-3 text-sm text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
              />
            </div>

            {/* Field 4: Sifat / Suasana Ajakan */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">
                  Suasana Pertemuan
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Maksimal {MAX_ACTIVITY_TRAITS}
                </span>
              </div>
              <div role="group" aria-label="Sifat ajakan" className="flex flex-wrap gap-2 pt-0.5">
                {ACTIVITY_TRAIT_CATALOG.map(({ id, label }) => {
                  const selected = traits.includes(id);
                  const atLimit = !selected && traits.length >= MAX_ACTIVITY_TRAITS;
                  return (
                    <button
                      key={id}
                      type="button"
                      role="checkbox"
                      aria-checked={selected}
                      disabled={atLimit}
                      onClick={() => toggleTrait(id)}
                      className={cn(
                        'inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-all cursor-pointer',
                        selected
                          ? 'border-primary bg-primary text-primary-foreground shadow-2xs'
                          : atLimit
                            ? 'border-border bg-background text-muted-foreground opacity-50'
                            : 'border-border bg-background text-foreground hover:bg-mint',
                      )}
                    >
                      {selected && <FaIcon icon="fa-check" className="text-[10px]" />}
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Field 5: Tempat / Lokasi */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-foreground">
                Tempat / Venue
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-primary">
                  <MapPin className="size-4" />
                </div>
                <input
                  type="text"
                  value={manualVenue}
                  onChange={(e) => {
                    setManualVenue(e.target.value);
                    setUseManualVenue(true);
                  }}
                  placeholder="Nama cafe, spot coworking, atau lokasi"
                  className="w-full rounded-2xl border border-border-strong bg-background py-3 pl-11 pr-4 text-sm text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>
              {errors.venue && (
                <p className="text-xs font-medium text-danger">{errors.venue}</p>
              )}

              {mapsReady && (
                <div className="pt-1">
                  <PlacePicker
                    label="Atau cari tempat di peta"
                    onSelect={handlePlaceSelect}
                    onClear={() => {
                      setSelectedPlace(null);
                      setUseManualVenue(true);
                    }}
                  />
                </div>
              )}
            </div>

            {/* Field 6: Tanggal & Jam */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="date-input" className="text-xs font-semibold text-foreground">
                  Tanggal
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-primary">
                    <CalendarDays className="size-4" />
                  </div>
                  <input
                    id="date-input"
                    type="date"
                    value={dateStr}
                    onChange={(e) => setDateStr(e.target.value)}
                    className="min-h-11 w-full rounded-2xl border border-border-strong bg-background py-3 pl-10 pr-3 text-xs text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="time-input" className="text-xs font-semibold text-foreground">
                  Jam Mulai
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-primary">
                    <Clock className="size-4" />
                  </div>
                  <input
                    id="time-input"
                    type="time"
                    value={timeStr}
                    onChange={(e) => setTimeStr(e.target.value)}
                    className="min-h-11 w-full rounded-2xl border border-border-strong bg-background py-3 pl-10 pr-3 text-xs text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Field 7: Kota & Kapasitas Peserta */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="city-select" className="text-xs font-semibold text-foreground">
                  Kota
                </label>
                <select
                  id="city-select"
                  value={cityId}
                  onChange={(e) => setCityId(e.target.value as CityId)}
                  className="w-full rounded-2xl border border-border-strong bg-background px-3 py-3 text-xs text-foreground focus:border-primary outline-none transition-all"
                >
                  {CITY_CATALOG.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="capacity-input" className="text-xs font-semibold text-foreground">
                  Maksimal Peserta
                </label>
                <input
                  id="capacity-input"
                  type="number"
                  min={2}
                  max={20}
                  value={capacity}
                  onChange={(e) => setCapacity(Number(e.target.value))}
                  className="min-h-11 w-full rounded-2xl border border-border-strong bg-background px-3.5 py-3 text-xs text-foreground focus:border-primary outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Tombol Lanjut Step 1 */}
          <div className="pt-3">
            <Button
              type="button"
              fullWidth
              size="lg"
              onClick={handleNextStep1}
              className="gap-2 text-base font-semibold shadow-sm"
            >
              <span>Lanjut</span>
              <FaIcon icon="fa-arrow-right" className="text-sm" />
            </Button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SCREEN 17: STEP 2 - METODE PEMBAYARAN & PILIH 21 ICON HADIAH */}
      {/* ========================================================================= */}
      {step === 2 && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="tracking-tight text-foreground">
              Pilih Metode Pembayaran
            </h1>
            <p className="text-xs text-muted-foreground">
              Tentukan bagaimana biaya saat beraktivitas akan diselesaikan.
            </p>
          </div>

          {/* 3 Opsi Metode Pembayaran (Radio Cards) */}
          <div role="radiogroup" aria-label="Metode Pembayaran" className="flex flex-col gap-3 pt-1">
            {/* 1. Patungan */}
            <button
              type="button"
              role="radio"
              aria-checked={paymentType === 'split'}
              onClick={() => setPaymentType('split')}
              className={cn(
                'flex items-center gap-3.5 rounded-2xl border p-4 text-left transition-all cursor-pointer',
                paymentType === 'split'
                  ? 'border-primary bg-mint/40 ring-2 ring-primary/20 shadow-xs'
                  : 'border-border bg-background hover:bg-mint/15',
              )}
            >
              <div
                className={cn(
                  'flex size-6 shrink-0 items-center justify-center rounded-full border transition-all',
                  paymentType === 'split'
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border-strong bg-background',
                )}
              >
                {paymentType === 'split' && <FaIcon icon="fa-check" className="text-xs" />}
              </div>

              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-bold text-foreground">Patungan</span>
                <span className="text-xs text-muted-foreground leading-relaxed">
                  Biaya nongkrong dibagi bersama.
                </span>
              </div>
            </button>

            {/* 2. Ditraktir */}
            <button
              type="button"
              role="radio"
              aria-checked={paymentType === 'treat'}
              onClick={() => setPaymentType('treat')}
              className={cn(
                'flex items-center gap-3.5 rounded-2xl border p-4 text-left transition-all cursor-pointer',
                paymentType === 'treat'
                  ? 'border-primary bg-mint/40 ring-2 ring-primary/20 shadow-xs'
                  : 'border-border bg-background hover:bg-mint/15',
              )}
            >
              <div
                className={cn(
                  'flex size-6 shrink-0 items-center justify-center rounded-full border transition-all',
                  paymentType === 'treat'
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border-strong bg-background',
                )}
              >
                {paymentType === 'treat' && <FaIcon icon="fa-check" className="text-xs" />}
              </div>

              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-bold text-foreground">Ditraktir</span>
                <span className="text-xs text-muted-foreground leading-relaxed">
                  Seluruh biaya ditanggung oleh pengundang.
                </span>
              </div>
            </button>

            {/* 3. Hadiah (Pilih 21 Icon Dukungan Sebelum Bayar Koin) */}
            <div
              className={cn(
                'flex flex-col rounded-2xl border transition-all overflow-hidden',
                paymentType === 'gift'
                  ? 'border-primary bg-mint/30 ring-2 ring-primary/20 shadow-xs'
                  : 'border-border bg-background hover:bg-mint/10',
              )}
            >
              <button
                type="button"
                role="radio"
                aria-checked={paymentType === 'gift'}
                onClick={() => setPaymentType('gift')}
                className="flex items-center gap-3.5 p-4 text-left cursor-pointer w-full"
              >
                <div
                  className={cn(
                    'flex size-6 shrink-0 items-center justify-center rounded-full border transition-all',
                    paymentType === 'gift'
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border-strong bg-background',
                  )}
                >
                  {paymentType === 'gift' && <FaIcon icon="fa-check" className="text-xs" />}
                </div>

                <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground">Hadiah</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-warning-soft px-2 py-0.5 text-[10px] font-bold text-warning-soft-foreground">
                      <Coins className="size-3 text-coin" />
                      {coinCost > 0 ? `${coinCost.toLocaleString('id-ID')} Coin` : 'Pilih Hadiah'}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground leading-relaxed">
                    Pengundang memberikan hadiah sebagai apresiasi waktu teman.
                  </span>
                </div>
              </button>

              {/* Expanded 5 Icons Gift Picker when Hadiah is selected */}
              {paymentType === 'gift' && (
                <div className="flex flex-col gap-3 p-4 pt-1 border-t border-border/70 bg-background/80">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-foreground block">
                        Pilih 1 dari 21 Icon Hadiah Dukungan
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        Penerima akan menerima nilai ini dalam bentuk <strong>Penghasilan (Rp)</strong> yang dapat ditarik.
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                      <Coins className="size-3 text-coin" />
                      <span>Saldo: {myCoinBalance !== null ? `${myCoinBalance.toLocaleString('id-ID')}` : '...'}</span>
                    </div>
                  </div>

                  {/* 21 Icons Grid */}
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2 max-h-64 overflow-y-auto pr-1 no-scrollbar">
                    {ALL_21_GIFTS.map((gift) => {
                      const isSelected = gift.id === selectedGiftId;
                      return (
                        <button
                          key={gift.id}
                          type="button"
                          onClick={() => setSelectedGiftId(gift.id)}
                          className={cn(
                            'relative p-2 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-between gap-1 group',
                            isSelected
                              ? 'border-primary bg-mint/50 ring-2 ring-primary/30 shadow-2xs'
                              : 'border-border bg-background hover:bg-muted/40',
                          )}
                        >
                          <div className="relative size-10 flex items-center justify-center">
                            <Image
                              src={gift.imageSrc}
                              alt={gift.name}
                              width={40}
                              height={40}
                              className="size-9 object-contain drop-shadow-xs group-hover:scale-105 transition-transform"
                            />
                            {isSelected && (
                              <span className="absolute -bottom-1 -right-1 flex size-4 items-center justify-center rounded-full bg-primary text-white shadow-xs">
                                <Check className="size-2.5" />
                              </span>
                            )}
                          </div>

                          <div className="w-full">
                            <p className="text-[10px] font-bold text-foreground truncate">{gift.name}</p>
                            <p className="text-[9px] font-extrabold text-amber-800">
                              {gift.coinPrice.toLocaleString('id-ID')}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Selected Gift Summary Box */}
                  <div className="rounded-2xl bg-amber-50/90 border border-amber-200 p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="size-10 rounded-xl bg-white border border-amber-200 flex items-center justify-center overflow-hidden shrink-0">
                        <Image
                          src={selectedGift.imageSrc}
                          alt={selectedGift.name}
                          width={36}
                          height={36}
                          className="size-8 object-contain"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <strong className="text-xs font-bold text-foreground">{selectedGift.name}</strong>
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded-md">
                            {selectedGift.coinPrice.toLocaleString('id-ID')} Coin
                          </span>
                        </div>
                        <p className="text-[10px] text-emerald-800 font-semibold mt-0.5">
                          Penerima Mendapat: Rp{selectedGift.earningsIdr.toLocaleString('id-ID')} (Penghasilan Siap Ditarik)
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Saldo Check & Top Up Call to Action */}
                  {!hasEnoughCoins ? (
                    <div className="rounded-2xl bg-rose-50 border border-rose-200 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="size-4 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-rose-900">Saldo Coin Tidak Cukup</p>
                          <p className="text-[11px] text-rose-700">
                            Kamu memiliki <strong>{myCoinBalance?.toLocaleString('id-ID') ?? 0} Coin</strong>, dibutuhkan <strong>{selectedGift.coinPrice.toLocaleString('id-ID')} Coin</strong>.
                          </p>
                        </div>
                      </div>

                      <Button
                        type="button"
                        size="sm"
                        onClick={() => setTopupModalOpen(true)}
                        className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold gap-1 shrink-0 shadow-xs"
                      >
                        <Plus className="size-3.5" /> Top Up Coin
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                      <Check className="size-3.5 text-emerald-600" />
                      <span>Saldo Coin mencukupi ({myCoinBalance?.toLocaleString('id-ID')} Coin tersedia).</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Baris Rincian Biaya Bawah */}
          <div className="flex items-center justify-between border-t border-border/80 pt-4 text-xs">
            <span className="font-semibold text-muted-foreground">Biaya membuat ajakan</span>
            <span className="font-extrabold text-foreground text-sm">
              {coinCost > 0 ? `${coinCost.toLocaleString('id-ID')} Coin` : 'Gratis'}
            </span>
          </div>

          {/* Tombol Lanjut Step 2 */}
          <div className="pt-2">
            <Button
              type="button"
              fullWidth
              size="lg"
              onClick={handleNextStep2}
              className="gap-2 text-base font-semibold shadow-sm"
            >
              <span>Lanjut ke Konfirmasi</span>
              <FaIcon icon="fa-arrow-right" className="text-sm" />
            </Button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SCREEN 18: STEP 3 - KONFIRMASI AJAKAN */}
      {/* ========================================================================= */}
      {step === 3 && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="tracking-tight text-foreground">
              Konfirmasi Ajakan
            </h1>
            <p className="text-xs text-muted-foreground">
              Pastikan rincian ajakan sudah sesuai sebelum dipublikasikan.
            </p>
          </div>

          {/* Summary Card Kegiatan */}
          <div className="flex flex-col items-center text-center gap-2.5 rounded-3xl border border-border bg-card p-5 shadow-xs">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-mint/60 border border-mint-strong/40 p-2 shadow-xs">
              <Image
                src={getCategoryOrInterestImage(categoryId)}
                alt={categoryLabel(categoryId)}
                width={48}
                height={48}
                className="size-11 rounded-full object-contain drop-shadow-xs"
              />
            </div>

            <div>
              <span className="inline-block text-[11px] font-bold text-primary bg-mint px-2.5 py-0.5 rounded-full border border-primary/20 mb-1.5">
                {categoryLabel(categoryId)}
              </span>
              <h2 className="text-lg font-bold text-foreground">{title}</h2>
              <p className="text-xs text-muted-foreground mt-1">
                {formattedDate} • {timeStr}
              </p>
              <p className="text-xs font-semibold text-primary mt-0.5">
                {venueDisplayName} ({cityLabel(cityId)})
              </p>
            </div>
          </div>

          {/* Breakdown Rincian Biaya & Metode */}
          <div className="flex flex-col gap-2.5 rounded-2xl border border-border bg-background p-4 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Metode</span>
              <span className="font-bold text-foreground">
                {paymentType === 'gift' ? `Hadiah (${selectedGift.name})` : paymentTypeLabel(paymentType)}
              </span>
            </div>

            {paymentType === 'gift' && (
              <div className="flex items-center justify-between py-1 border-y border-border/60">
                <div className="flex items-center gap-2">
                  <Image
                    src={selectedGift.imageSrc}
                    alt={selectedGift.name}
                    width={24}
                    height={24}
                    className="size-6 object-contain"
                  />
                  <span className="text-muted-foreground">Icon Hadiah</span>
                </div>
                <span className="font-bold text-emerald-800">
                  Senilai Rp{selectedGift.earningsIdr.toLocaleString('id-ID')} (Penghasilan)
                </span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Biaya ajakan</span>
              <span className="font-semibold text-foreground">
                {paymentType === 'gift' ? `${selectedGift.coinPrice.toLocaleString('id-ID')} Coin` : '0 Coin'}
              </span>
            </div>

            <div className="my-1 border-t border-border" />

            <div className="flex items-center justify-between text-sm">
              <span className="font-bold text-foreground">Total Pembayaran</span>
              <span className="font-extrabold text-primary text-base">
                {paymentType === 'gift' ? `${selectedGift.coinPrice.toLocaleString('id-ID')} Coin` : 'Gratis'}
              </span>
            </div>
          </div>

          {/* Warning / Top Up Box if balance is insufficient */}
          {paymentType === 'gift' && !hasEnoughCoins && (
            <div className="rounded-2xl bg-rose-50 border border-rose-200 p-3.5 flex items-center justify-between gap-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="size-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-rose-900">Saldo Coin Kurang</p>
                  <p className="text-[11px] text-rose-700">
                    Dibutuhkan {selectedGift.coinPrice.toLocaleString('id-ID')} Coin (Saldo: {myCoinBalance?.toLocaleString('id-ID') ?? 0} Coin).
                  </p>
                </div>
              </div>

              <Button
                type="button"
                size="sm"
                onClick={() => setTopupModalOpen(true)}
                className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold gap-1 shrink-0"
              >
                <Plus className="size-3.5" /> Top Up
              </Button>
            </div>
          )}

          {/* Disclaimer Info Coin */}
          <div className="flex items-start gap-2.5 rounded-2xl bg-mint/40 p-3 text-xs text-primary leading-relaxed">
            <FaIcon icon="fa-circle-info" className="text-xs mt-0.5 shrink-0" />
            <span>
              {paymentType === 'gift'
                ? `Sebesar ${selectedGift.coinPrice.toLocaleString('id-ID')} Coin akan dipotong dari saldo Coin Saya dan disalurkan sebagai Penghasilan Rp${selectedGift.earningsIdr.toLocaleString('id-ID')} bagi teman yang hadir.`
                : 'Ajakan ini gratis dan tidak memotong saldo koin.'}
            </span>
          </div>

          {/* Tombol Publikasikan */}
          <div className="pt-2">
            <Button
              type="button"
              fullWidth
              size="lg"
              loading={loading}
              onClick={handlePublish}
              disabled={paymentType === 'gift' && !hasEnoughCoins}
              className="gap-2 text-base font-semibold shadow-sm bg-primary hover:bg-primary-strong"
            >
              <FaIcon icon="fa-paper-plane" className="text-sm" />
              <span>
                {paymentType === 'gift'
                  ? `Bayar ${selectedGift.coinPrice.toLocaleString('id-ID')} Coin & Publikasikan`
                  : 'Publikasikan Ajakan'}
              </span>
            </Button>
          </div>
        </div>
      )}

      {/* Top Up Modal directly integrated in creation flow */}
      <TopupModal
        open={topupModalOpen}
        onClose={() => setTopupModalOpen(false)}
        onSuccess={fetchWallet}
      />
    </div>
  );
}
