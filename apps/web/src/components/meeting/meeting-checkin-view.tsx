'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FaIcon } from '@/components/ui/font-awesome-icon';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { checkinActivity } from '@/lib/api';
import { fetchActivityById } from '@/lib/activities/read';
import { useToast } from '@/components/ui/toast';
import { SupportModal } from '@/components/meeting/support-modal';
import type { ActivityDoc } from '@placetogo/shared';

interface MeetingCheckinViewProps {
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

export function MeetingCheckinView({ activityId }: MeetingCheckinViewProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [activity, setActivity] = React.useState<ActivityDoc | null>(null);
  const [claiming, setClaiming] = React.useState(false);
  const [checkedIn, setCheckedIn] = React.useState(false);
  const [supportModalOpen, setSupportModalOpen] = React.useState(false);

  React.useEffect(() => {
    let ignore = false;
    fetchActivityById(activityId)
      .then((data) => {
        if (!ignore) {
          setActivity(data);
        }
      })
      .catch(() => {
        if (!ignore) {
          setActivity(FALLBACK_ACTIVITY);
        }
      });

    return () => {
      ignore = true;
    };
  }, [activityId]);

  async function handleClaimReward() {
    setClaiming(true);
    try {
      await checkinActivity(activityId);
      setCheckedIn(true);
      toast({
        title: 'Check-in berhasil',
        description: 'Kehadiranmu di pertemuan ini sudah terverifikasi.',
        variant: 'success',
      });
    } catch {
      toast({
        title: 'Check-in gagal',
        description: 'Tidak dapat memverifikasi kehadiranmu. Coba lagi sebentar.',
        variant: 'error',
      });
    } finally {
      setClaiming(false);
    }
  }

  const currentActivity = activity ?? FALLBACK_ACTIVITY;
  const hostName = 'Nara';
  const venueName = currentActivity.venueName || 'Kopi Kenangan - Tunjungan Plaza';
  const timeStr = '18:00 WIB';

  return (
    <div className="flex flex-col min-h-[calc(100dvh-120px)] max-w-lg mx-auto pb-10">
      {/* Screen 20 Header */}
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-background/95 backdrop-blur-md px-4 py-3.5">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Tutup"
          className="flex size-9 items-center justify-center rounded-full text-foreground hover:bg-muted transition-colors"
        >
          <FaIcon icon="fa-xmark" className="text-base" />
        </button>
        <h1 className="text-base text-foreground">Detail Pertemuan</h1>
        <div className="size-9" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 text-center">
        {/* Large Mint Circle with Checkmark (Screen 20) */}
        <div className="relative mb-6 flex size-24 items-center justify-center rounded-full bg-mint text-primary shadow-lg ring-8 ring-mint/40 animate-in zoom-in-50 duration-300">
          <FaIcon icon="fa-check" className="text-4xl text-primary font-black stroke-2" />
        </div>

        {/* Title & Subtitle */}
        <h2 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
          Kamu sudah bertemu!
        </h2>
        <p className="mt-2 text-sm text-muted-foreground max-w-xs leading-relaxed">
          Pertemuan dengan <span className="font-semibold text-foreground">{hostName}</span> di{' '}
          <span className="font-semibold text-foreground">{venueName}</span> telah terverifikasi.
        </p>

        {/* Meeting Information Card */}
        <div className="mt-8 w-full rounded-3xl border border-border bg-card p-5 text-left shadow-xs space-y-4">
          <div className="flex items-center gap-3.5 pb-3.5 border-b border-border">
            <Avatar name={hostName} avatarId="cat" size="lg" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-foreground truncate">{hostName}</p>
                <span className="rounded-full bg-mint px-2 py-0.5 text-[10px] font-bold text-primary">
                  Host
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{currentActivity.title}</p>
            </div>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center gap-3 text-muted-foreground">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-mint/60 text-primary">
                <FaIcon icon="fa-location-dot" className="text-xs" />
              </div>
              <span className="font-medium text-foreground truncate">{venueName}</span>
            </div>

            <div className="flex items-center gap-3 text-muted-foreground">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-mint/60 text-primary">
                <FaIcon icon="fa-clock" className="text-xs" />
              </div>
              <span className="font-medium text-foreground">{timeStr}</span>
            </div>

            <div className="flex items-center gap-3 text-muted-foreground">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-mint/60 text-primary">
                <FaIcon icon="fa-circle-check" className="text-xs" />
              </div>
              <span className="font-medium text-primary">Status: Hadir & Terverifikasi</span>
            </div>
          </div>

          {/* Reward Alert */}
          <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-3.5 flex items-center gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white shadow-xs">
              <FaIcon icon="fa-coins" className="text-xs" />
            </div>
            <div className="text-left flex-1">
              <p className="text-xs font-bold text-amber-900">
                {checkedIn ? 'Kehadiran terverifikasi' : 'Reward kehadiran 2.000 Coin'}
              </p>
              <p className="text-[11px] text-amber-700">
                {checkedIn
                  ? 'Check-in kamu sudah tercatat untuk pertemuan ini.'
                  : 'Tekan Klaim Coin untuk mencatat kehadiranmu di pertemuan ini.'}
              </p>
            </div>
          </div>

          {!checkedIn && (
            <Button
              fullWidth
              size="lg"
              loading={claiming}
              onClick={() => void handleClaimReward()}
              className="mt-4 h-12 rounded-2xl text-base font-bold"
            >
              <FaIcon icon="fa-coins" className="text-base" />
              <span>Klaim Coin</span>
            </Button>
          )}
        </div>

        {/* Action Buttons (Screen 20) */}
        <div className="mt-8 flex flex-col w-full gap-3">
          <Button
            fullWidth
            size="lg"
            onClick={() => setSupportModalOpen(true)}
            className="h-12 text-base font-bold bg-primary text-primary-foreground shadow-md hover:bg-primary/90 flex items-center justify-center gap-2 rounded-2xl cursor-pointer"
          >
            <FaIcon icon="fa-gift" className="text-base" />
            <span>Beri Hadiah & Apresiasi</span>
          </Button>

          <Link href={`/jelajah/${activityId}`} className="w-full">
            <Button
              fullWidth
              size="lg"
              variant="outline"
              className="h-12 text-base font-semibold border-border bg-background hover:bg-muted text-foreground rounded-2xl flex items-center justify-center gap-2"
            >
              <FaIcon icon="fa-circle-info" className="text-sm text-muted-foreground" />
              <span>Lihat Detail Ajakan</span>
            </Button>
          </Link>
        </div>

        {/* Support Modal (21 Icon Hadiah Dukungan Resmi) */}
        <SupportModal
          open={supportModalOpen}
          onClose={() => setSupportModalOpen(false)}
          targetUser={{
            uid: currentActivity.creatorId || 'host-1',
            displayName: hostName,
            avatarId: 'cat',
          }}
        />
      </div>
    </div>
  );
}
