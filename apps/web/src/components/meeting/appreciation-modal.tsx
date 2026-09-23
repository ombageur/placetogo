'use client';

import * as React from 'react';
import { Heart, Coins, Plus } from 'lucide-react';
import {
  type AppreciationDoc,
  type PublicUser,
  type WalletSummary,
} from '@placetogo/shared';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { sendAppreciation, getWallet, ApiError } from '@/lib/api';
import { TopupModal } from '@/components/wallet/topup-modal';
import { cn } from '@/lib/utils';

export type ParticipantUser = PublicUser & { uid: string };

export interface AppreciationModalProps {
  open: boolean;
  onClose: () => void;
  activityId: string;
  participants: ParticipantUser[];
  onAppreciationSent: (doc: AppreciationDoc) => void;
}

export function AppreciationModal({
  open,
  onClose,
  activityId,
  participants,
  onAppreciationSent,
}: AppreciationModalProps) {
  const { toast } = useToast();

  const [selectedTarget, setSelectedTarget] = React.useState<ParticipantUser | null>(
    participants[0] ?? null,
  );
  const [selectedAmount, setSelectedAmount] = React.useState<number>(5000);
  const [customAmount, setCustomAmount] = React.useState('');
  const [isCustom, setIsCustom] = React.useState(false);
  const [note, setNote] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [wallet, setWallet] = React.useState<WalletSummary | null>(null);
  const [openTopup, setOpenTopup] = React.useState(false);

  const fetchWallet = React.useCallback(() => {
    void getWallet().then(setWallet).catch(() => {});
  }, []);

  React.useEffect(() => {
    if (open) {
      fetchWallet();
    }
  }, [open, fetchWallet]);

  // Target default adalah peserta pertama; diturunkan saat render agar tidak perlu
  // menyalin properti ke state lewat efek.
  const activeTarget = selectedTarget ?? participants[0] ?? null;

  const finalAmount = isCustom ? parseInt(customAmount || '0', 10) : selectedAmount;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!activeTarget) {
      toast({ title: 'Pilih teman avatar', description: 'Pilih peserta yang ingin diberi apresiasi.', variant: 'error' });
      return;
    }

    if (isNaN(finalAmount) || finalAmount < 5000) {
      toast({ title: 'Nominal tidak valid', description: 'Minimal hadiah/apresiasi adalah 5.000 Coin.', variant: 'error' });
      return;
    }

    setLoading(true);
    try {
      const doc = await sendAppreciation({
        activityId,
        toUid: activeTarget.uid,
        amount: finalAmount,
        note: note.trim() || undefined,
      });

      onAppreciationSent(doc);
      onClose();
    } catch (err) {
      let message = 'Gagal mengirim apresiasi. Coba lagi.';
      if (err instanceof ApiError && err.message) message = err.message;
      toast({ title: 'Gagal kirim apresiasi', description: message, variant: 'error' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Beri Apresiasi Teman">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Pilih Teman Avatar */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-foreground">Kirim Apresiasi Kepada</label>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {participants.map((p, idx) => {
              const isSelected = activeTarget?.displayName === p.displayName;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedTarget(p)}
                  className={cn(
                    'flex items-center gap-2 rounded-2xl border p-2 text-left transition-all shrink-0',
                    isSelected
                      ? 'border-primary bg-mint shadow-sm'
                      : 'border-border bg-background hover:bg-mint/40',
                  )}
                >
                  <Avatar name={p.displayName} avatarId={p.avatarId} size="sm" />
                  <span className="text-xs font-bold text-foreground pr-1">{p.displayName}</span>
                </button>
              );
            })}
          </div>
        </div>

        {activeTarget && (
          <div className="flex flex-col items-center text-center p-3 rounded-2xl bg-mint/40 border border-primary/20">
            <Avatar name={activeTarget.displayName} avatarId={activeTarget.avatarId} size="lg" />
            <p className="font-bold text-base text-foreground mt-2">{activeTarget.displayName}</p>
            <p className="text-xs text-muted-foreground">Berikan apresiasi untuk waktu dan kebersamaan.</p>
          </div>
        )}

        {/* Pilihan Nominal Coin (Screen 24-25 Traktiran Kopi) */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-foreground uppercase tracking-wider">
            Pilih Bentuk Apresiasi (Coin)
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { amount: 5000, label: '☕ Kopi', fa: 'fa-mug-hot' },
              { amount: 10000, label: '🧋 Boba', fa: 'fa-glass-water' },
              { amount: 20000, label: '🍰 Traktir', fa: 'fa-cake-candles' },
              { amount: 50000, label: '🍱 Makan', fa: 'fa-utensils' },
              { amount: 100000, label: '🎁 Spesial', fa: 'fa-gift' },
            ].map(({ amount, label }) => {
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
                    'flex flex-col items-center justify-center p-2.5 rounded-2xl border text-center transition-all',
                    isSelected
                      ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                      : 'border-border bg-background text-foreground hover:bg-mint',
                  )}
                >
                  <span className="text-sm">{label}</span>
                  <span className="text-[11px] font-bold mt-0.5 opacity-90">
                    {amount.toLocaleString('id-ID')}
                  </span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setIsCustom(true)}
              className={cn(
                'flex flex-col items-center justify-center p-2.5 rounded-2xl border text-center transition-all',
                isCustom
                  ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                  : 'border-border bg-background text-foreground hover:bg-mint',
              )}
            >
              <span className="text-sm">✨ Bebas</span>
              <span className="text-[11px] font-bold mt-0.5 opacity-90">Custom</span>
            </button>
          </div>

          {isCustom && (
            <input
              type="number"
              min={1000}
              step={1000}
              placeholder="Masukkan jumlah koin (mis. 25000)"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              className="min-h-11 w-full rounded-xl border border-border-strong bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          )}
        </div>

        {/* Pesan Opsional */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="appreciation-note" className="text-xs font-semibold text-foreground">
            Pesan Hangat <span className="font-normal text-muted-foreground">(opsional)</span>
          </label>
          <textarea
            id="appreciation-note"
            rows={2}
            placeholder="Terima kasih untuk obrolan santainya hari ini!…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full rounded-xl border border-border-strong bg-background p-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Info Saldo Koin Pengirim */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-mint/50 border border-primary/20">
          <div className="flex items-center gap-2">
            <Coins className="size-4 text-warning-soft-foreground" />
            <span className="text-xs text-muted-foreground">Saldo Coin Kamu:</span>
            <span className="text-xs font-bold text-foreground">
              {wallet ? `${wallet.balance.toLocaleString('id-ID')} Coin` : 'Memuat…'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setOpenTopup(true)}
            className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
          >
            <Plus className="size-3" />
            Top Up
          </button>
        </div>

        {/* Tombol Kirim */}
        <div className="flex flex-col gap-2 pt-1">
          <Button
            type="submit"
            size="lg"
            loading={loading}
            disabled={wallet !== null && wallet.balance < finalAmount}
            fullWidth
            className="shadow-md"
          >
            <Heart className="size-4" />
            {wallet !== null && wallet.balance < finalAmount
              ? `Saldo Koin Kurang (${wallet.balance.toLocaleString('id-ID')} Coin)`
              : `Kirim Apresiasi (${finalAmount > 0 ? `${finalAmount.toLocaleString('id-ID')} Coin` : ''})`}
          </Button>
          <Button type="button" variant="ghost" onClick={onClose} fullWidth size="md">
            Tutup
          </Button>
        </div>
      </form>

      {/* Modal Top Up jika saldo kurang */}
      <TopupModal
        open={openTopup}
        onClose={() => setOpenTopup(false)}
        onSuccess={fetchWallet}
      />
    </Modal>
  );
}
