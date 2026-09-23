'use client';

import * as React from 'react';
import {
  ArrowUpRight,
  Banknote,
  Coins,
  CreditCard,
  Gift,
  History,
  Plus,
  ShieldCheck,
  Sparkles,
  Wallet,
} from 'lucide-react';
import type { WalletSummary, WalletLedgerEntry } from '@placetogo/shared';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ErrorState } from '@/components/ui/states';
import { SkeletonList } from '@/components/ui/skeleton';
import { getWallet, getReceivedGifts } from '@/lib/api';
import { TopupModal } from '@/components/wallet/topup-modal';
import { WithdrawalModal } from '@/components/wallet/withdrawal-modal';
import { cn } from '@/lib/utils';
import { useDeferredEffect } from '@/hooks/use-mount-effect';

type FilterType = 'all' | 'coins' | 'earnings';

export function WalletView() {
  const [data, setData] = React.useState<WalletSummary | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const [filter, setFilter] = React.useState<FilterType>('all');
  const [openTopupModal, setOpenTopupModal] = React.useState(false);
  const [openWithdrawModal, setOpenWithdrawModal] = React.useState(false);

  // Local state saldo penghasilan (singkron dengan hadiah diterima dikurangi penarikan)
  const [earningsBalance, setEarningsBalance] = React.useState<number>(0);

  const fetchWalletData = React.useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [summary, giftsRes] = await Promise.all([
        getWallet().catch(() => null),
        getReceivedGifts().catch(() => ({ items: [], totalCoins: 0 })),
      ]);

      if (summary) {
        setData(summary);
        const totalGiftEarnings = (giftsRes?.items ?? []).reduce((acc, item) => acc + (item.amount || 0), 0);
        const totalWithdrawn = (summary.ledger || [])
          .filter((e) => e.type === 'payout_withdraw')
          .reduce((acc, e) => acc + Math.abs(e.delta || 0), 0);
        const calculatedAvailable = Math.max(0, totalGiftEarnings - totalWithdrawn);
        const finalEarnings = summary.earningsIdr && summary.earningsIdr > 0
          ? summary.earningsIdr
          : calculatedAvailable;

        setEarningsBalance(finalEarnings);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useDeferredEffect(() => {
    void fetchWalletData();
  }, [fetchWalletData]);

  const coinBalance = data?.balance ?? 75000;

  // Filter transaksi
  const filteredLedger = React.useMemo(() => {
    if (!data?.ledger) return [];
    if (filter === 'all') return data.ledger;
    if (filter === 'coins') {
      return data.ledger.filter((e) => e.type !== 'payout_withdraw' && e.type !== 'gift_payout_receive');
    }
    if (filter === 'earnings') {
      return data.ledger.filter((e) => e.type === 'payout_withdraw' || e.type === 'gift_payout_receive' || e.type === 'appreciation_receive');
    }
    return data.ledger;
  }, [data, filter]);

  function formatTime(epoch: number) {
    const d = new Date(epoch);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function getEntryIcon(entry: WalletLedgerEntry) {
    if (entry.type === 'payout_withdraw') return <ArrowUpRight className="size-4 text-emerald-600" />;
    if (entry.type === 'gift_payout_receive') return <Banknote className="size-4 text-emerald-600" />;
    if (entry.type === 'topup') return <CreditCard className="size-4 text-primary" />;
    if (entry.type === 'reward_checkin') return <Sparkles className="size-4 text-warning-soft-foreground" />;
    if (entry.type === 'appreciation_receive') return <Gift className="size-4 text-warning-soft-foreground" />;
    if (entry.type === 'appreciation_send') return <Gift className="size-4 text-muted-foreground" />;
    return <Coins className="size-4 text-primary" />;
  }

  function getEntryTitle(entry: WalletLedgerEntry) {
    if (entry.type === 'payout_withdraw') return 'Tarik Dana ke Rekening';
    if (entry.type === 'gift_payout_receive') return 'Penerimaan Hadiah Pertemuan (Penghasilan)';
    if (entry.type === 'topup') return 'Top Up Saldo Coin';
    if (entry.type === 'reward_checkin') return 'Reward Kehadiran Venue';
    if (entry.type === 'appreciation_receive') return 'Menerima Hadiah (Penghasilan Masuk)';
    if (entry.type === 'appreciation_send') return 'Beli Hadiah (Coin Terpakai)';
    return 'Penyesuaian Saldo';
  }

  function handleWithdrawSuccess(withdrawnAmount: number) {
    setEarningsBalance((prev) => Math.max(0, prev - withdrawnAmount));
    void fetchWalletData();
  }

  return (
    <div className="flex flex-col gap-5 pb-24">
      {/* Header Halaman */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h1 className="font-black tracking-tight text-foreground">Dompet</h1>
          <p className="text-xs text-muted-foreground">Kelola saldo Coin dan Penghasilan kamu</p>
        </div>
      </div>

      {loading && <SkeletonList count={2} />}
      {error && (
        <ErrorState
          title="Tidak dapat memuat dompet"
          description="Terjadi kesalahan saat mengambil informasi saldo."
          onRetry={fetchWalletData}
        />
      )}

      {!loading && !error && (
        <>
          {/* 2 KARTU NILAI UTAMA: COIN SAYA & PENGHASILAN SAYA */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* 1. KARTU COIN SAYA */}
            <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-amber-500 via-amber-600 to-yellow-600 p-5 text-white shadow-md transition-all hover:shadow-lg">
              {/* Background Accent Rings */}
              <div className="absolute -right-8 -bottom-8 size-36 rounded-full bg-white/10 pointer-events-none" />
              <div className="absolute right-12 -top-6 size-24 rounded-full bg-yellow-300/20 pointer-events-none" />

              <div className="relative z-10 flex flex-col justify-between h-full gap-4">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-amber-100">
                    <Coins className="size-4 text-yellow-200" />
                    Coin Saya
                  </span>
                  <span className="rounded-full bg-black/20 border border-white/20 px-2.5 py-0.5 text-[10px] font-bold text-amber-100 backdrop-blur-xs">
                    Non-Withdrawable
                  </span>
                </div>

                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                      {coinBalance.toLocaleString('id-ID')}
                    </span>
                    <span className="text-base font-bold text-amber-100">Coin</span>
                  </div>
                  <p className="text-[11px] text-amber-100/90 mt-1 leading-snug">
                    Dipakai untuk Buat Ajakan, Hadiah, voucher, dan fitur berbayar.
                  </p>
                </div>

                <div className="pt-1">
                  <Button
                    size="md"
                    onClick={() => setOpenTopupModal(true)}
                    className="w-full bg-white text-amber-900 hover:bg-amber-50 font-black shadow-md border-0 rounded-2xl"
                  >
                    <Plus className="size-4 text-amber-900 stroke-[3]" />
                    Top Up
                  </Button>
                </div>
              </div>
            </div>

            {/* 2. KARTU PENGHASILAN SAYA */}
            <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-emerald-600 via-emerald-700 to-teal-800 p-5 text-white shadow-md transition-all hover:shadow-lg">
              {/* Background Accent Rings */}
              <div className="absolute -right-8 -bottom-8 size-36 rounded-full bg-white/10 pointer-events-none" />
              <div className="absolute right-12 -top-6 size-24 rounded-full bg-emerald-300/20 pointer-events-none" />

              <div className="relative z-10 flex flex-col justify-between h-full gap-4">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-emerald-100">
                    <Banknote className="size-4 text-emerald-200" />
                    Penghasilan Saya
                  </span>
                  <span className="rounded-full bg-black/20 border border-white/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-100 backdrop-blur-xs">
                    Dapat Ditarik
                  </span>
                </div>

                <div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                      Rp{earningsBalance.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-100/90 mt-1 leading-snug">
                    Uang hak kamu dari Hadiah/reward yang eligible. Dapat ditarik ke bank/e-wallet.
                  </p>
                </div>

                <div className="pt-1">
                  <Button
                    size="md"
                    onClick={() => setOpenWithdrawModal(true)}
                    className="w-full bg-emerald-400 text-emerald-950 hover:bg-emerald-300 font-black shadow-md border-0 rounded-2xl"
                  >
                    <ArrowUpRight className="size-4 text-emerald-950 stroke-[3]" />
                    Tarik Dana
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Edukasi / Perbedaan Coin vs Penghasilan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            <div className="flex items-start gap-2.5 rounded-2xl border border-amber-200/60 bg-amber-50/60 p-3 text-xs dark:bg-amber-950/20 dark:border-amber-900/30">
              <div className="flex size-7 items-center justify-center rounded-xl bg-amber-200/70 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200 shrink-0 mt-0.5">
                <Coins className="size-3.5" />
              </div>
              <div>
                <p className="font-bold text-foreground">Coin (Untuk Belanja)</p>
                <p className="text-muted-foreground text-[11px] mt-0.5">
                  Dibeli via Top Up. Dipakai untuk <strong>Beli Hadiah (21 Icon)</strong>, Buat Ajakan, dan bayar patungan (tidak bisa ditarik jadi rupiah).
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 rounded-2xl border border-emerald-200/60 bg-emerald-50/60 p-3 text-xs dark:bg-emerald-950/20 dark:border-emerald-900/30">
              <div className="flex size-7 items-center justify-center rounded-xl bg-emerald-200/70 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 shrink-0 mt-0.5">
                <Banknote className="size-3.5" />
              </div>
              <div>
                <p className="font-bold text-foreground">Penghasilan (Dapat Ditarik)</p>
                <p className="text-muted-foreground text-[11px] mt-0.5">
                  Didapat saat kamu <strong>menerima Hadiah</strong> dari teman atau reward acara. Uang hak kamu yang dapat ditarik ke bank / e-wallet.
                </p>
              </div>
            </div>
          </div>

          {/* Riwayat Transaksi */}
          <div className="flex flex-col gap-3 pt-2">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-foreground flex items-center gap-1.5">
                <History className="size-4 text-primary" />
                Riwayat Transaksi
              </h2>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {[
                { id: 'all', label: 'Semua Transaksi' },
                { id: 'coins', label: '🪙 Coin' },
                { id: 'earnings', label: '💵 Penghasilan' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id as FilterType)}
                  className={cn(
                    'rounded-full px-3.5 py-1 text-xs font-bold transition-all shrink-0',
                    filter === f.id
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'border border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Ledger List */}
            {filteredLedger.length === 0 ? (
              <Card className="flex flex-col items-center justify-center p-8 text-center bg-mint/20 border-border/80 rounded-3xl">
                <Wallet className="size-8 text-muted-foreground mb-2" />
                <p className="font-bold text-sm text-foreground">Belum ada transaksi</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Transaksi koin dan penghasilan kamu akan tercatat rapi di sini.
                </p>
              </Card>
            ) : (
              <div className="flex flex-col divide-y divide-border rounded-3xl border border-border/80 bg-background overflow-hidden shadow-2xs">
                {filteredLedger.map((entry) => {
                  const isPositive = entry.delta > 0;
                  const isIdr = entry.type === 'payout_withdraw' || entry.type === 'gift_payout_receive';
                  return (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between p-3.5 hover:bg-mint/15 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={cn(
                            'flex size-9 items-center justify-center rounded-xl shrink-0',
                            isIdr
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                              : isPositive
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
                              : 'bg-muted text-muted-foreground',
                          )}
                        >
                          {getEntryIcon(entry)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-foreground truncate">
                            {getEntryTitle(entry)}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {entry.note ?? formatTime(entry.createdAt)}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={cn(
                            'font-black text-sm block',
                            isIdr
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : isPositive
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-foreground',
                          )}
                        >
                          {isIdr
                            ? `${isPositive ? '+' : ''}Rp${Math.abs(entry.delta).toLocaleString('id-ID')}`
                            : `${isPositive ? '+' : ''}${entry.delta.toLocaleString('id-ID')} Coin`}
                        </span>
                        <p className="text-[10px] text-muted-foreground">
                          {formatTime(entry.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 rounded-2xl border border-primary/20 bg-mint/50 p-3.5 text-xs text-primary font-medium">
            <ShieldCheck className="size-4 shrink-0" />
            <span>
              Seluruh transaksi saldo Coin dan pencairan Penghasilan dijamin aman dan terenkripsi.
            </span>
          </div>
        </>
      )}

      {/* Modal Top Up Coin */}
      <TopupModal
        open={openTopupModal}
        onClose={() => setOpenTopupModal(false)}
        onSuccess={fetchWalletData}
      />

      {/* Modal Tarik Dana Penghasilan */}
      <WithdrawalModal
        open={openWithdrawModal}
        onClose={() => setOpenWithdrawModal(false)}
        availableEarningsIdr={earningsBalance}
        onSuccess={handleWithdrawSuccess}
      />
    </div>
  );
}
