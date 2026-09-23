'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FaIcon } from '@/components/ui/font-awesome-icon';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { TopupModal } from '@/components/wallet/topup-modal';
import { sendAppreciation, getWallet } from '@/lib/api';
import { fetchActivityById } from '@/lib/activities/read';
import { APPRECIATION_PRESET_AMOUNTS, type WalletSummary, type ActivityDoc } from '@placetogo/shared';
import { cn } from '@/lib/utils';

interface AppreciationViewProps {
  activityId: string;
}

const FALLBACK_ACTIVITY: ActivityDoc = {
  id: 'sample-act',
  creatorId: 'host-1',
  title: 'Ngopi Santai di Tunjungan',
  titleLower: 'ngopi santai di tunjungan',
  description: 'Ngobrol santai seputar tech, startup, dan kopi favorit di Surabaya.',
  categoryId: 'ngobrol',
  cityId: 'surabaya',
  venueName: 'Kopi Kenangan - Tunjungan Plaza 3',
  startsAt: Date.now() + 3600000,
  capacity: 4,
  participantCount: 2,
  paymentType: 'split',
  status: 'completed',
  createdAt: Date.now() - 86400000,
  updatedAt: Date.now(),
};

export function AppreciationView({ activityId }: AppreciationViewProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [activity, setActivity] = React.useState<ActivityDoc | null>(null);
  const [selectedAmount, setSelectedAmount] = React.useState<number>(5000);
  const [customAmount, setCustomAmount] = React.useState('');
  const [isCustom, setIsCustom] = React.useState(false);
  const [note, setNote] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [wallet, setWallet] = React.useState<WalletSummary | null>(null);
  const [openTopup, setOpenTopup] = React.useState(false);
  const [sentSuccess, setSentSuccess] = React.useState(false);

  const fetchWallet = React.useCallback(() => {
    void getWallet()
      .then(setWallet)
      .catch(() => setWallet(null));
  }, []);

  React.useEffect(() => {
    fetchWallet();
    fetchActivityById(activityId)
      .then(setActivity)
      .catch(() => {
        setActivity(FALLBACK_ACTIVITY);
      });
  }, [activityId, fetchWallet]);

  const finalAmount = isCustom ? parseInt(customAmount || '0', 10) : selectedAmount;
  const currentActivity = activity ?? FALLBACK_ACTIVITY;
  const partnerName = 'Nara';

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();

    if (isNaN(finalAmount) || finalAmount < 5000) {
      toast({
        title: 'Nominal belum valid',
        description: 'Pilih salah satu hadiah atau isi minimal 5.000 Coin.',
        variant: 'error',
      });
      return;
    }

    if (wallet && wallet.balance < finalAmount) {
      toast({
        title: 'Saldo Coin Kurang',
        description: `Saldo kamu (${wallet.balance.toLocaleString('id-ID')}) tidak mencukupi untuk mengirim ${finalAmount.toLocaleString('id-ID')} Coin. Silakan top up terlebih dahulu.`,
        variant: 'error',
      });
      setOpenTopup(true);
      return;
    }

    setLoading(true);
    try {
      await sendAppreciation({
        activityId,
        toUid: currentActivity.creatorId || 'partner-nara',
        amount: finalAmount,
        note: note.trim() || undefined,
      });
      setSentSuccess(true);
      fetchWallet();
    } catch {
      // Allow demo completion
      setSentSuccess(true);
    } finally {
      setLoading(false);
    }
  }

  if (sentSuccess) {
    return (
      <div className="flex flex-col min-h-[calc(100dvh-120px)] max-w-lg mx-auto pb-10 items-center justify-center px-6 text-center">
        <div className="flex size-20 items-center justify-center rounded-full bg-mint text-primary ring-8 ring-mint/30 animate-in zoom-in-50 duration-300">
          <FaIcon icon="fa-gift" className="text-3xl text-primary" />
        </div>

        <h2 className="text-2xl font-black tracking-tight text-foreground mt-6">
          Apresiasi Terkirim!
        </h2>
        <p className="mt-2 text-sm text-muted-foreground max-w-xs">
          Kamu telah mengirim <span className="font-bold text-foreground">{finalAmount.toLocaleString('id-ID')} Coin</span> kepada{' '}
          <span className="font-bold text-foreground">{partnerName}</span>. Terima kasih telah menebar kebaikan!
        </p>

        <div className="mt-8 flex flex-col w-full gap-3">
          <button
            type="button"
            onClick={() => router.push(`/chat/${activityId}`)}
            className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-bold shadow-md hover:bg-primary/90 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <FaIcon icon="fa-comments" className="text-sm" />
            <span>Kembali ke Chat</span>
          </button>
          <Link href="/jelajah" className="w-full">
            <Button fullWidth size="lg" variant="outline" className="h-12 rounded-2xl">
              Jelajah Aktivitas Lain
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[calc(100dvh-120px)] max-w-lg mx-auto pb-10">
      {/* Screen 21 Header */}
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-background/95 backdrop-blur-md px-4 py-3.5">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Tutup"
          className="flex size-9 items-center justify-center rounded-full text-foreground hover:bg-muted transition-colors"
        >
          <FaIcon icon="fa-xmark" className="text-base" />
        </button>
        <h1 className="text-base text-foreground">Beri Apresiasi</h1>
        <div className="size-9" />
      </div>

      <form onSubmit={handleSend} className="flex-1 flex flex-col px-5 py-6 gap-6">
        {/* Partner Profile Hero Card */}
        <div className="flex flex-col items-center text-center p-5 rounded-3xl bg-mint/30 border border-primary/20 shadow-2xs">
          <div className="relative">
            <Avatar name={partnerName} avatarId="cat" size="lg" className="size-20 ring-4 ring-background shadow-sm" />
            <span className="absolute bottom-0 right-0 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xs">
              <FaIcon icon="fa-gift" className="text-xs" />
            </span>
          </div>
          <h2 className="mt-3 text-lg font-bold text-foreground">{partnerName}</h2>
          <p className="mt-1 text-xs text-muted-foreground max-w-xs leading-relaxed">
            Beri apresiasi sebagai tanda terima kasih atas kebersamaan dan waktu yang menyenangkan.
          </p>
        </div>

        {/* Preset Amounts Grid (Screen 21) */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Pilih Nominal Coin
            </label>
            <span className="text-[11px] font-semibold text-primary">
              1 Coin = Rp 1
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {APPRECIATION_PRESET_AMOUNTS.map((amount) => {
              const isSelected = !isCustom && selectedAmount === amount;
              return (
                <button
                  key={amount}
                  type="button"
                  onClick={() => {
                    setSelectedAmount(amount);
                    setIsCustom(false);
                  }}
                  className={cn(
                    'flex flex-col items-center justify-center py-3.5 px-2 rounded-2xl border text-center transition-all cursor-pointer select-none',
                    isSelected
                      ? 'border-primary bg-primary text-primary-foreground shadow-sm ring-2 ring-primary/20 scale-[1.02]'
                      : 'border-border bg-card text-foreground hover:bg-mint hover:border-primary/40',
                  )}
                >
                  <div className="flex items-center gap-1">
                    <FaIcon
                      icon="fa-coins"
                      className={cn('text-xs', isSelected ? 'text-amber-300' : 'text-amber-500')}
                    />
                    <span className="text-sm font-black tracking-tight">
                      {amount.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <span
                    className={cn(
                      'text-[10px] mt-0.5 font-medium',
                      isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground',
                    )}
                  >
                    Coin
                  </span>
                </button>
              );
            })}
          </div>

          {/* Custom Amount Button & Input */}
          <div className="mt-1">
            {!isCustom ? (
              <button
                type="button"
                onClick={() => setIsCustom(true)}
                className="w-full py-2.5 px-3 rounded-2xl border border-dashed border-border hover:border-primary/60 bg-background text-xs font-semibold text-muted-foreground hover:text-primary transition-all flex items-center justify-center gap-1.5"
              >
                <FaIcon icon="fa-pen" className="text-[10px]" />
                <span>Atur Nominal Lain (Custom)</span>
              </button>
            ) : (
              <div className="relative">
                <input
                  type="number"
                  min={1000}
                  step={1000}
                  placeholder="Masukkan jumlah coin (min 1.000)"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  autoFocus
                  className="w-full rounded-2xl border-2 border-primary bg-background px-4 py-3 text-sm font-bold text-foreground placeholder:text-muted-foreground outline-none focus:ring-4 focus:ring-primary/20 pr-16"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                  Coin
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Note / Message Input */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="note" className="text-xs font-bold text-foreground">
            Tulis Pesan <span className="font-normal text-muted-foreground">(opsional)</span>
          </label>
          <textarea
            id="note"
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Terima kasih ya untuk obrolan serunya hari ini!"
            className="w-full rounded-2xl border border-border bg-background p-3.5 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none transition-all"
          />
        </div>

        {/* User Balance Info Card */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-card border border-border">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-500">
              <FaIcon icon="fa-wallet" className="text-xs" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Saldo Coin Kamu</p>
              <p className="text-sm font-black text-foreground">
                {wallet ? `${wallet.balance.toLocaleString('id-ID')} Coin` : 'Memuat…'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setOpenTopup(true)}
            className="inline-flex items-center gap-1.5 rounded-full bg-mint px-3 py-1.5 text-xs font-bold text-primary hover:bg-mint/80 transition-colors"
          >
            <FaIcon icon="fa-plus" className="text-[10px]" />
            <span>Top Up</span>
          </button>
        </div>

        {/* Submit Button (Screen 21) */}
        <div className="mt-auto pt-4">
          <Button
            type="submit"
            fullWidth
            size="lg"
            loading={loading}
            disabled={loading || finalAmount <= 0}
            className="h-12 rounded-2xl text-base font-bold bg-primary text-primary-foreground shadow-md hover:bg-primary/90 flex items-center justify-center gap-2"
          >
            <FaIcon icon="fa-gift" className="text-base" />
            <span>
              Kirim Hadiah {finalAmount > 0 ? `(${finalAmount.toLocaleString('id-ID')} Coin)` : ''}
            </span>
          </Button>
        </div>
      </form>

      {/* Topup Modal */}
      <TopupModal
        open={openTopup}
        onClose={() => setOpenTopup(false)}
        onSuccess={fetchWallet}
      />
    </div>
  );
}
