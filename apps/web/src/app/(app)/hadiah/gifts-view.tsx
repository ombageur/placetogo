'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, Gift, Wallet, ArrowRight, Sparkles, Filter, Coins } from 'lucide-react';
import type { AppreciationDoc } from '@placetogo/shared';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { SkeletonList } from '@/components/ui/skeleton';
import { FaIcon } from '@/components/ui/font-awesome-icon';
import { WithdrawalModal } from '@/components/wallet/withdrawal-modal';
import { ALL_21_GIFTS, getGiftByCode, type GiftItem } from '@/components/hadiah/gift-catalog';
import { useDeferredEffect } from '@/hooks/use-mount-effect';
import { getReceivedGifts, getWallet } from '@/lib/api';
import { cn } from '@/lib/utils';

type LoadState =
  | { kind: 'loading' }
  | { kind: 'ready'; items: AppreciationDoc[]; totalCoins: number; totalEarningsIdr: number }
  | { kind: 'error' };

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

/**
 * Halaman Hadiah Saya (Milik Sendiri):
 * - Pengguna TIDAK BISA mengirim dukungan ke diri sendiri.
 * - Menampilkan total icon dan jumlah yang didapat secara nyata.
 * - Jika belum ada hadiah, saldo Penghasilan adalah Rp0 dan jumlah hadiah 0.
 * - Setiap icon bernilai Penghasilan (Rupiah) yang dapat ditarik ke rekening / e-wallet.
 */
export function GiftsView() {
  const [state, setState] = React.useState<LoadState>({ kind: 'loading' });
  const [filterType, setFilterType] = React.useState<'all' | 'unlocked'>('all');
  const [withdrawModalOpen, setWithdrawModalOpen] = React.useState(false);

  const load = React.useCallback(() => {
    void Promise.all([
      getReceivedGifts().catch(() => ({ items: [], totalCoins: 0 })),
      getWallet().catch(() => null),
    ])
      .then(([res, wallet]) => {
        const receivedItems = res?.items ?? [];
        const totalGiftEarnings = receivedItems.reduce((acc, item) => acc + (item.amount || 0), 0);
        const totalWithdrawn = (wallet?.ledger ?? [])
          .filter((e) => e.type === 'payout_withdraw')
          .reduce((acc, e) => acc + Math.abs(e.delta || 0), 0);
        
        // Saldo Penghasilan yang bisa ditarik = Total Hadiah Masuk - Total Penarikan
        const calculatedAvailable = Math.max(0, totalGiftEarnings - totalWithdrawn);
        const finalEarnings = wallet?.earningsIdr !== undefined && wallet.earningsIdr > 0
          ? wallet.earningsIdr
          : calculatedAvailable;

        setState({
          kind: 'ready',
          items: receivedItems,
          totalCoins: wallet?.balance ?? res.totalCoins ?? 0,
          totalEarningsIdr: finalEarnings,
        });
      })
      .catch(() => {
        setState({
          kind: 'ready',
          items: [],
          totalCoins: 0,
          totalEarningsIdr: 0,
        });
      });
  }, []);

  useDeferredEffect(() => load(), [load]);

  // Hitung jumlah koleksi icon yang didapat dari data nyata
  const giftCounts = React.useMemo(() => {
    const map: Record<string, { count: number; totalEarningsIdr: number }> = {};
    ALL_21_GIFTS.forEach((g) => {
      map[g.id] = { count: 0, totalEarningsIdr: 0 };
    });

    if (state.kind === 'ready') {
      state.items.forEach((item) => {
        const matchedGift = getGiftByCode(item.note) ?? ALL_21_GIFTS.find((g) => g.coinPrice === item.amount);
        const key = matchedGift ? matchedGift.id : ALL_21_GIFTS[0]?.id;
        if (key && map[key]) {
          map[key]!.count += 1;
          map[key]!.totalEarningsIdr += item.amount;
        }
      });
    }

    return map;
  }, [state]);

  return (
    <div className="flex flex-col gap-5 pb-20">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link
            href="/profil"
            aria-label="Kembali ke profil"
            className="flex size-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-mint hover:text-primary border border-border/60 bg-background"
          >
            <ChevronLeft className="size-5" />
          </Link>
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-foreground">Hadiah Saya</h1>
            <p className="text-xs text-muted-foreground">Icon apresiasi & dukungan yang kamu peroleh.</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setWithdrawModalOpen(true)}
          disabled={state.kind === 'ready' && state.totalEarningsIdr <= 0}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold hover:bg-emerald-100 transition-colors shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <Wallet className="size-3.5 text-emerald-600" />
          <span>Tarik Dana</span>
        </button>
      </div>

      {state.kind === 'loading' && <SkeletonList count={3} />}

      {state.kind === 'error' && (
        <ErrorState
          title="Tidak dapat memuat hadiah"
          description="Periksa koneksi internet kamu lalu coba lagi."
          onRetry={() => {
            setState({ kind: 'loading' });
            load();
          }}
        />
      )}

      {state.kind === 'ready' && (
        <>
          {/* Banner Ringkasan Penghasilan Hadiah (Hanya Terlihat Oleh Pemilik Akun) */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary-strong to-emerald-950 p-6 text-white shadow-xl">
            <div className="relative z-10 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-bold backdrop-blur-md">
                  <Sparkles className="size-3.5 text-amber-300" />
                  Koleksi Hadiah & Dukungan Masuk
                </span>
                <span className="text-xs text-white/80 font-medium">
                  {state.items.length} Hadiah Diterima
                </span>
              </div>

              <div>
                <span className="text-xs uppercase tracking-wider font-semibold text-white/70 block">
                  TOTAL NILAI PENGHASILAN (BISA DITARIK)
                </span>
                <p className="text-3xl md:text-4xl font-extrabold text-white mt-0.5">
                  Rp{state.totalEarningsIdr.toLocaleString('id-ID')}
                </p>
                <p className="text-xs text-white/80 mt-1">
                  {state.totalEarningsIdr > 0
                    ? 'Didapat dari apresiasi teman komunitas. Saldo ini menjadi hak kamu dan dapat dicairkan langsung di menu Dompet.'
                    : 'Belum ada hadiah masuk. Saat teman mengirim hadiah icon di ajakan atau profilmu, nilai penghasilan akan tertera di sini.'}
                </p>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setWithdrawModalOpen(true)}
                  disabled={state.totalEarningsIdr <= 0}
                  className="inline-flex items-center gap-1.5 rounded-2xl bg-secondary px-4 py-2.5 text-xs font-extrabold text-white shadow-md hover:bg-secondary/90 transition-transform active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Wallet className="size-3.5" />
                  Tarik Dana ke Rekening / E-Wallet
                  <ArrowRight className="size-3" />
                </button>
              </div>
            </div>

            {/* Decorative Background Icon */}
            <div className="absolute -bottom-6 -right-6 text-white/10 pointer-events-none select-none">
              <Gift className="size-48" />
            </div>
          </div>

          {/* Koleksi 21 Icon Dukungan yang Telah Didapat */}
          <Card className="p-4 md:p-5 flex flex-col gap-4 bg-background">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-sm md:text-base text-foreground flex items-center gap-1.5">
                  <Gift className="size-4 text-primary" />
                  Koleksi 21 Icon Dukungan & Nilai Penghasilan
                </h3>
                <p className="text-xs text-muted-foreground">
                  Setiap icon hadiah bernilai rupiah penghasilan yang telah masuk ke saldo Dompet kamu.
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setFilterType('all')}
                  className={cn(
                    'px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer',
                    filterType === 'all'
                      ? 'bg-primary text-white shadow-2xs'
                      : 'bg-muted text-muted-foreground hover:text-foreground',
                  )}
                >
                  Semua ({ALL_21_GIFTS.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('unlocked')}
                  className={cn(
                    'px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer',
                    filterType === 'unlocked'
                      ? 'bg-primary text-white shadow-2xs'
                      : 'bg-muted text-muted-foreground hover:text-foreground',
                  )}
                >
                  Diterima ({Object.values(giftCounts).filter((g) => g.count > 0).length})
                </button>
              </div>
            </div>

            {/* Grid 21 Icons Collection */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2.5 pt-1">
              {ALL_21_GIFTS.filter((gift) => {
                if (filterType === 'unlocked') {
                  return (giftCounts[gift.id]?.count ?? 0) > 0;
                }
                return true;
              }).map((gift) => {
                const count = giftCounts[gift.id]?.count ?? 0;
                const isUnlocked = count > 0;
                const totalEarnings = giftCounts[gift.id]?.totalEarningsIdr ?? 0;

                return (
                  <div
                    key={gift.id}
                    className={cn(
                      'relative p-2.5 rounded-2xl border text-center flex flex-col items-center justify-between gap-1.5 transition-all',
                      isUnlocked
                        ? 'border-primary/40 bg-mint/40 shadow-2xs ring-1 ring-primary/20'
                        : 'border-border/60 bg-muted/30 opacity-45 grayscale hover:grayscale-0 hover:opacity-80',
                    )}
                  >
                    {/* Count Badge */}
                    <span
                      className={cn(
                        'absolute -top-2 -right-1 px-1.5 py-0.2 text-[9px] font-extrabold rounded-full shadow-2xs',
                        isUnlocked
                          ? 'bg-primary text-white'
                          : 'bg-muted-foreground/50 text-white',
                      )}
                    >
                      {count}x
                    </span>

                    <div className="size-12 flex items-center justify-center">
                      <Image
                        src={gift.imageSrc}
                        alt={gift.name}
                        width={48}
                        height={48}
                        className="size-11 object-contain drop-shadow-xs"
                      />
                    </div>

                    <div className="w-full">
                      <p className="text-[11px] font-extrabold text-foreground truncate">{gift.name}</p>
                      <p className="text-[10px] font-bold text-emerald-700">
                        {isUnlocked ? `Rp${totalEarnings.toLocaleString('id-ID')}` : `Rp${gift.earningsIdr.toLocaleString('id-ID')}`}
                      </p>
                      <span className="text-[9px] text-muted-foreground block">
                        {isUnlocked ? 'Total Didapat' : 'Per Hadiah'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Riwayat Penerimaan Hadiah Terbaru */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground">Riwayat Hadiah & Apresiasi Masuk</h3>
              <span className="text-xs text-muted-foreground font-medium">
                {state.items.length} Transaksi
              </span>
            </div>

            {state.items.length === 0 ? (
              <EmptyState
                icon={<Gift className="size-10 text-muted-foreground/60" />}
                title="Belum Ada Hadiah Masuk"
                description="Saat teman atau peserta ajakan mengirimkan hadiah dukungan padamu, riwayat dan nilai penghasilan akan tercatat otomatis di sini."
              />
            ) : (
              <div className="flex flex-col gap-2.5">
                {state.items.map((gift) => {
                  const giftMeta = getGiftByCode(gift.note) ?? ALL_21_GIFTS.find((g) => g.coinPrice === gift.amount);
                  return (
                    <Card key={gift.id} className="p-3.5 flex items-start justify-between gap-3 bg-card border border-border/80 shadow-2xs">
                      <div className="flex items-start gap-3">
                        <div className="relative shrink-0">
                          <Avatar
                            name={gift.fromUid}
                            avatarId="cat"
                            size="md"
                          />
                          {giftMeta && (
                            <div className="absolute -bottom-1 -right-1 size-5 rounded-full bg-white border border-border flex items-center justify-center shadow-xs">
                              <Image
                                src={giftMeta.imageSrc}
                                alt={giftMeta.name}
                                width={16}
                                height={16}
                                className="size-3.5 object-contain"
                              />
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <strong className="text-xs md:text-sm font-bold text-foreground">
                              {gift.fromUid}
                            </strong>
                            <span className="text-xs text-muted-foreground">
                              mengirim <strong className="text-primary">{giftMeta?.name ?? 'Hadiah'}</strong>
                            </span>
                          </div>

                          {gift.note && (
                            <p className="text-xs text-foreground bg-muted/30 p-2 rounded-xl mt-1 leading-relaxed">
                              "{gift.note}"
                            </p>
                          )}

                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-1">
                            <span>{dateFormatter.format(new Date(gift.createdAt))}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-extrabold">
                          +Rp{gift.amount.toLocaleString('id-ID')}
                        </span>
                        <span className="block text-[10px] text-muted-foreground mt-0.5">Penghasilan</span>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Withdrawal Modal terintegrasi langsung dengan Saldo Penghasilan */}
          <WithdrawalModal
            open={withdrawModalOpen}
            onClose={() => setWithdrawModalOpen(false)}
            availableEarningsIdr={state.totalEarningsIdr}
            onSuccess={() => {
              load();
            }}
          />
        </>
      )}
    </div>
  );
}
