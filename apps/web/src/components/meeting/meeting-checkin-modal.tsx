'use client';

import * as React from 'react';
import { CheckCircle2, Coins, Sparkles } from 'lucide-react';
import type { ActivityDoc, CheckinResult } from '@placetogo/shared';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { checkinActivity, ApiError } from '@/lib/api';

export interface MeetingCheckinModalProps {
  open: boolean;
  onClose: () => void;
  activity: ActivityDoc;
  onCheckinSuccess: (result: CheckinResult) => void;
}

export function MeetingCheckinModal({
  open,
  onClose,
  activity,
  onCheckinSuccess,
}: MeetingCheckinModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);

  async function handleClaim() {
    setLoading(true);
    try {
      // Dapatkan lokasi GPS jika diizinkan browser
      let location: { lat: number; lng: number } | undefined;
      if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 4000 });
          });
          location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        } catch {
          // GPS opsional
        }
      }

      const result = await checkinActivity(activity.id, location);
      onCheckinSuccess(result);
      toast({
        title: 'Check-in Berhasil!',
        description: `Selamat! Kamu berhasil mengklaim ${result.rewardAmount.toLocaleString('id-ID')} Coin reward pertemuan.`,
        variant: 'success',
      });
      onClose();
    } catch (err) {
      let message = 'Gagal melakukan check-in. Coba lagi.';
      if (err instanceof ApiError && err.message) message = err.message;
      toast({ title: 'Gagal check-in', description: message, variant: 'error' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Klaim Reward Venue">
      <div className="flex flex-col items-center text-center p-2 gap-4">
        {/* Coin Badge */}
        <div className="flex size-20 items-center justify-center rounded-full bg-warning-soft text-warning-soft-foreground border border-coin/30">
          <Coins className="size-10 animate-bounce" />
        </div>

        <div>
          <h2 className="text-xl font-bold text-foreground">Dapatkan 2.000 Coin</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Reward khusus kehadiran untuk pertemuan di <span className="font-semibold text-foreground">{activity.venueName}</span>.
          </p>
        </div>

        {/* Verification Checklist (Screen 21) */}
        <div className="w-full rounded-2xl border border-border bg-background p-4 text-left space-y-3">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="size-4.5 text-primary shrink-0 mt-0.5" />
            <span className="text-xs font-medium text-foreground">Kamu berada di lokasi pertemuan publik</span>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="size-4.5 text-primary shrink-0 mt-0.5" />
            <span className="text-xs font-medium text-foreground">Pertemuan sedang berlangsung atau telah selesai</span>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="size-4.5 text-primary shrink-0 mt-0.5" />
            <span className="text-xs font-medium text-foreground">Coin reward otomatis masuk ke saldo akun kamu</span>
          </div>
        </div>

        <div className="flex flex-col w-full gap-2 pt-2">
          <Button fullWidth size="lg" loading={loading} onClick={handleClaim} className="shadow-md">
            <Sparkles className="size-4" />
            Klaim 2.000 Coin
          </Button>
          <Button fullWidth size="md" variant="ghost" onClick={onClose}>
            Nanti Saja
          </Button>
        </div>
      </div>
    </Modal>
  );
}
