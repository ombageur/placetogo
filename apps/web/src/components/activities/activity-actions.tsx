'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Ban,
  CheckCircle2,
  Coins,
  Heart,
  LogIn,
  LogOut,
  Minus,
  Play,
  Plus,
  Settings2,
  Sparkles,
  StopCircle,
  UserPlus,
} from 'lucide-react';
import type { ActivityDoc, CheckinResult, AppreciationDoc } from '@placetogo/shared';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import {
  cancelActivity,
  joinActivity,
  leaveActivity,
  startActivity,
  completeActivity,
  getCheckinStatus,
  updateActivityCapacity,
  ApiError,
} from '@/lib/api';
import { JoinSuccessModal } from '@/components/meeting/join-success-modal';
import { MeetingCheckinModal } from '@/components/meeting/meeting-checkin-modal';
import {
  AppreciationModal,
  type ParticipantUser,
} from '@/components/meeting/appreciation-modal';
import { MeetingSuccessModal } from '@/components/meeting/meeting-success-modal';

export interface ActivityActionsProps {
  activity: ActivityDoc;
  currentUserId: string | null;
  isParticipant: boolean;
  participants?: ParticipantUser[];
  onActivityUpdated: (updated: ActivityDoc) => void;
  onParticipantStatusChanged: (joined: boolean) => void;
}

export function ActivityActions({
  activity,
  currentUserId,
  isParticipant,
  participants = [],
  onActivityUpdated,
  onParticipantStatusChanged,
}: ActivityActionsProps) {
  const { toast } = useToast();

  const isCreator = currentUserId != null && currentUserId === activity.creatorId;
  const isCancelled = activity.status === 'cancelled';
  const isInProgress = activity.status === 'in_progress';
  const isCompleted = activity.status === 'completed';
  const isFull = activity.status === 'full' || activity.participantCount >= activity.capacity;

  // State dialog & modals
  const [openCancelModal, setOpenCancelModal] = React.useState(false);
  const [openCapacityModal, setOpenCapacityModal] = React.useState(false);
  const [openLeaveModal, setOpenLeaveModal] = React.useState(false);
  const [openJoinSuccessModal, setOpenJoinSuccessModal] = React.useState(false);
  const [openCheckinModal, setOpenCheckinModal] = React.useState(false);
  const [openAppreciationModal, setOpenAppreciationModal] = React.useState(false);
  const [openSuccessModal, setOpenSuccessModal] = React.useState(false);

  /*
   * Draf kapasitas hanya ada selama pengguna mengubahnya. Nilai yang ditampilkan
   * diturunkan dari properti, sehingga tidak perlu menyalin properti ke state lewat efek.
   */
  const [capacityDraft, setCapacityDraft] = React.useState<number | null>(null);
  const newCapacity = capacityDraft ?? activity.capacity;
  const setNewCapacity = (next: number | ((current: number) => number)) =>
    setCapacityDraft((current) =>
      typeof next === 'function' ? next(current ?? activity.capacity) : next,
    );
  const [loading, setLoading] = React.useState(false);
  const [checkinData, setCheckinData] = React.useState<CheckinResult | null>(null);

  // Cek status checkin pengguna
  React.useEffect(() => {
    if (!currentUserId || (!isCreator && !isParticipant)) return;
    let ignore = false;
    void getCheckinStatus(activity.id)
      .then((res) => {
        if (!ignore && res) setCheckinData(res);
      })
      .catch(() => {});
    return () => {
      ignore = true;
    };
  }, [activity.id, currentUserId, isCreator, isParticipant]);

  // Filter peserta selain diri sendiri untuk target apresiasi
  const appreciationTargets = React.useMemo(() => {
    return participants.filter((p) => p.uid !== currentUserId);
  }, [participants, currentUserId]);

  // Handler: Join
  async function handleJoin() {
    setLoading(true);
    try {
      const updated = await joinActivity(activity.id);
      onActivityUpdated(updated);
      onParticipantStatusChanged(true);
      setOpenJoinSuccessModal(true);
      toast({
        title: 'Berhasil bergabung!',
        description: 'Kamu telah terdaftar sebagai peserta di ajakan ini.',
        variant: 'success',
      });
    } catch (err) {
      let message = 'Tidak dapat bergabung saat ini. Coba lagi.';
      if (err instanceof ApiError) {
        if (err.message) message = err.message;
        if (err.code === 'activity_full') message = 'Ajakan ini baru saja penuh.';
        if (err.code === 'already_joined') {
          message = 'Kamu sudah bergabung sebelumnya.';
          onParticipantStatusChanged(true);
        }
      }
      toast({ title: 'Gagal bergabung', description: message, variant: 'error' });
    } finally {
      setLoading(false);
    }
  }

  // Handler: Leave
  async function handleLeave() {
    setLoading(true);
    try {
      const updated = await leaveActivity(activity.id);
      onActivityUpdated(updated);
      onParticipantStatusChanged(false);
      setOpenLeaveModal(false);
      toast({
        title: 'Kamu telah keluar dari ajakan',
        description: 'Slot peserta kamu telah dikembalikan ke publik.',
        variant: 'info',
      });
    } catch (err) {
      let message = 'Gagal memproses permintaan keluar. Coba lagi.';
      if (err instanceof ApiError && err.message) message = err.message;
      toast({ title: 'Gagal keluar', description: message, variant: 'error' });
    } finally {
      setLoading(false);
    }
  }

  // Handler: Cancel (Creator)
  async function handleCancel() {
    setLoading(true);
    try {
      const updated = await cancelActivity(activity.id);
      onActivityUpdated(updated);
      setOpenCancelModal(false);
      toast({
        title: 'Ajakan Dibatalkan',
        description: 'Ajakan ini telah berhasil dibatalkan.',
        variant: 'info',
      });
    } catch (err) {
      let message = 'Gagal membatalkan ajakan. Coba lagi.';
      if (err instanceof ApiError && err.message) message = err.message;
      toast({ title: 'Gagal membatalkan', description: message, variant: 'error' });
    } finally {
      setLoading(false);
    }
  }

  // Handler: Update Capacity (Creator)
  async function handleUpdateCapacity() {
    if (newCapacity < activity.participantCount) {
      toast({
        title: 'Kapasitas tidak valid',
        description: `Kapasitas tidak boleh kurang dari jumlah peserta saat ini (${activity.participantCount}).`,
        variant: 'error',
      });
      return;
    }
    setLoading(true);
    try {
      const updated = await updateActivityCapacity(activity.id, { capacity: newCapacity });
      onActivityUpdated(updated);
      setOpenCapacityModal(false);
      toast({
        title: 'Kapasitas Diperbarui',
        description: `Kapasitas berhasil diubah menjadi ${newCapacity} peserta.`,
        variant: 'success',
      });
    } catch (err) {
      let message = 'Gagal mengubah kapasitas. Coba lagi.';
      if (err instanceof ApiError && err.message) message = err.message;
      toast({ title: 'Gagal ubah kapasitas', description: message, variant: 'error' });
    } finally {
      setLoading(false);
    }
  }

  // Handler: Mulai Pertemuan (Creator)
  async function handleStartActivity() {
    setLoading(true);
    try {
      const updated = await startActivity(activity.id);
      onActivityUpdated(updated);
      toast({
        title: 'Pertemuan Dimulai!',
        description: 'Status ajakan telah berubah menjadi sedang berlangsung.',
        variant: 'success',
      });
    } catch (err) {
      let message = 'Gagal memulai pertemuan. Coba lagi.';
      if (err instanceof ApiError && err.message) message = err.message;
      toast({ title: 'Gagal mulai', description: message, variant: 'error' });
    } finally {
      setLoading(false);
    }
  }

  // Handler: Selesaikan Pertemuan (Creator)
  async function handleCompleteActivity() {
    setLoading(true);
    try {
      const updated = await completeActivity(activity.id);
      onActivityUpdated(updated);
      toast({
        title: 'Pertemuan Selesai!',
        description: 'Pertemuan telah ditandai selesai. Terima kasih atas kebersamaannya!',
        variant: 'success',
      });
    } catch (err) {
      let message = 'Gagal menyelesaikan pertemuan. Coba lagi.';
      if (err instanceof ApiError && err.message) message = err.message;
      toast({ title: 'Gagal selesai', description: message, variant: 'error' });
    } finally {
      setLoading(false);
    }
  }

  // Handler: Check-in Sukses
  function handleCheckinSuccess(result: CheckinResult) {
    setCheckinData(result);
  }

  // Handler: Apresiasi Sukses
  function handleAppreciationSent(_doc: AppreciationDoc) {
    toast({
      title: 'Apresiasi Terkirim!',
      description: 'Koin apresiasi berhasil dikirimkan ke teman avatar.',
      variant: 'success',
    });
    setOpenSuccessModal(true);
  }

  // 1. Belum Login
  if (!currentUserId) {
    return (
      <Card className="flex flex-col items-center gap-3 bg-mint text-center">
        <p className="text-sm font-medium text-foreground">
          Masuk dengan akun avatar kamu untuk bergabung ke ajakan ini.
        </p>
        <Link href="/masuk" className="w-full">
          <Button fullWidth size="md">
            <LogIn className="size-4" />
            Masuk untuk Bergabung
          </Button>
        </Link>
      </Card>
    );
  }

  // 2. Dibatalkan
  if (isCancelled) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-danger/30 bg-danger-soft p-4 text-danger-soft-foreground">
        <Ban className="size-5 shrink-0 text-danger" />
        <div>
          <p className="font-semibold text-sm">Ajakan Ini Telah Dibatalkan</p>
          <p className="text-xs">Pembuat telah membatalkan rencana aktivitas ini.</p>
        </div>
      </div>
    );
  }

  // 3. Status Selesai (Completed)
  if (isCompleted) {
    return (
      <div className="flex flex-col gap-3">
        <Card className="flex flex-col gap-3 border-primary/20 bg-mint/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-primary font-bold text-sm">
              <CheckCircle2 className="size-5" />
              Pertemuan Telah Selesai
            </div>
            {checkinData && (
              <span className="inline-flex items-center gap-1 rounded-full bg-warning-soft border border-coin/30 px-2.5 py-0.5 text-xs font-semibold text-warning-soft-foreground">
                <Coins className="size-3.5 text-warning-soft-foreground" />
                {checkinData.rewardAmount.toLocaleString('id-ID')} Coin Diklaim
              </span>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            Aktivitas ini sudah selesai dilaksanakan. Terima kasih atas partisipasinya!
          </p>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {!checkinData && (isCreator || isParticipant) && (
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setOpenCheckinModal(true)}
                className="bg-background border-coin/40 text-warning-soft-foreground hover:bg-warning-soft"
              >
                <Sparkles className="size-4 text-warning-soft-foreground" />
                Klaim Reward 2.000 Coin
              </Button>
            )}

            {(isCreator || isParticipant) && appreciationTargets.length > 0 && (
              <Button
                type="button"
                size="md"
                onClick={() => setOpenAppreciationModal(true)}
                className="shadow-sm"
              >
                <Heart className="size-4" />
                Beri Apresiasi Teman
              </Button>
            )}
          </div>
        </Card>

        {/* Modals untuk Post-Meeting */}
        <MeetingCheckinModal
          open={openCheckinModal}
          onClose={() => setOpenCheckinModal(false)}
          activity={activity}
          onCheckinSuccess={handleCheckinSuccess}
        />

        <AppreciationModal
          open={openAppreciationModal}
          onClose={() => setOpenAppreciationModal(false)}
          activityId={activity.id}
          participants={appreciationTargets}
          onAppreciationSent={handleAppreciationSent}
        />

        <MeetingSuccessModal
          open={openSuccessModal}
          onClose={() => setOpenSuccessModal(false)}
        />
      </div>
    );
  }

  // 4. Status Sedang Berlangsung (In Progress)
  if (isInProgress) {
    return (
      <div className="flex flex-col gap-3">
        <Card className="flex flex-col gap-3 border-primary/40 bg-mint">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
              <span className="flex size-2 rounded-full bg-primary animate-pulse" />
              Pertemuan Sedang Berlangsung
            </span>
            <span className="text-xs text-muted-foreground">
              {activity.participantCount}/{activity.capacity} Peserta
            </span>
          </div>

          <p className="text-xs text-foreground">
            Pertemuan sedang aktif! Silakan check-in di venue untuk klaim reward 2.000 Coin.
          </p>

          <div className="flex flex-col gap-2">
            {!checkinData ? (
              <Button
                type="button"
                size="md"
                onClick={() => setOpenCheckinModal(true)}
                className="shadow-sm"
              >
                <Sparkles className="size-4" />
                Check-in di Venue & Klaim 2.000 Coin
              </Button>
            ) : (
              <div className="flex items-center gap-2 rounded-xl bg-background/80 p-2.5 text-xs font-semibold text-primary border border-primary/20">
                <CheckCircle2 className="size-4" />
                Kamu sudah check-in (+{checkinData.rewardAmount.toLocaleString('id-ID')} Coin)
              </div>
            )}

            {isCreator && (
              <Button
                type="button"
                variant="outline"
                size="md"
                loading={loading}
                onClick={handleCompleteActivity}
                className="bg-background text-primary border-primary/30 hover:bg-mint-strong"
              >
                <StopCircle className="size-4" />
                Selesaikan Pertemuan
              </Button>
            )}

            {!isCreator && isParticipant && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setOpenLeaveModal(true)}
                className="text-danger hover:bg-danger-soft"
              >
                <LogOut className="size-3.5" />
                Keluar dari Ajakan
              </Button>
            )}
          </div>
        </Card>

        {/* Modal Checkin */}
        <MeetingCheckinModal
          open={openCheckinModal}
          onClose={() => setOpenCheckinModal(false)}
          activity={activity}
          onCheckinSuccess={handleCheckinSuccess}
        />

        {/* Modal Konfirmasi Keluar */}
        <Modal
          open={openLeaveModal}
          onClose={() => setOpenLeaveModal(false)}
          title="Keluar dari Ajakan?"
          description="Slot peserta kamu akan dibuka kembali untuk teman avatar lainnya."
          footer={
            <div className="flex flex-col gap-2 pt-2 sm:flex-row-reverse">
              <Button variant="destructive" loading={loading} onClick={handleLeave}>
                Ya, Keluar
              </Button>
              <Button variant="ghost" onClick={() => setOpenLeaveModal(false)}>
                Tetap Bergabung
              </Button>
            </div>
          }
        />
      </div>
    );
  }

  // 5. Status Published / Full — Creator
  if (isCreator) {
    return (
      <>
        <Card className="flex flex-col gap-3 border-primary/20 bg-mint/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              Kelola Ajakan Saya
            </span>
            <span className="text-xs text-muted-foreground">
              {activity.participantCount}/{activity.capacity} Peserta
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              type="button"
              size="md"
              loading={loading}
              onClick={handleStartActivity}
              className="shadow-sm"
            >
              <Play className="size-4" />
              Mulai Pertemuan Sekarang
            </Button>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setOpenCapacityModal(true)}
                className="bg-background"
              >
                <Settings2 className="size-4" />
                Ubah Kapasitas
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="md"
                onClick={() => setOpenCancelModal(true)}
              >
                <Ban className="size-4" />
                Batalkan Ajakan
              </Button>
            </div>
          </div>
        </Card>

        {/* Modal Ubah Kapasitas */}
        <Modal
          open={openCapacityModal}
          onClose={() => setOpenCapacityModal(false)}
          title="Ubah Kapasitas Peserta"
          description={`Sesuaikan jumlah maksimal peserta. Minimal ${activity.participantCount} (jumlah peserta saat ini).`}
          footer={
            <div className="flex flex-col gap-2 pt-2 sm:flex-row-reverse">
              <Button loading={loading} onClick={handleUpdateCapacity}>
                Simpan Perubahan
              </Button>
              <Button variant="ghost" onClick={() => setOpenCapacityModal(false)}>
                Batal
              </Button>
            </div>
          }
        >
          <div className="flex items-center justify-center gap-4 py-4">
            <button
              type="button"
              onClick={() =>
                setNewCapacity((c) => Math.max(Math.max(1, activity.participantCount), c - 1))
              }
              disabled={newCapacity <= Math.max(1, activity.participantCount)}
              className="flex size-12 items-center justify-center rounded-full border border-border bg-background text-foreground hover:bg-mint disabled:opacity-40"
            >
              <Minus className="size-5" />
            </button>
            <span className="min-w-12 text-center text-2xl font-bold text-foreground">
              {newCapacity}
            </span>
            <button
              type="button"
              onClick={() => setNewCapacity((c) => Math.min(50, c + 1))}
              disabled={newCapacity >= 50}
              className="flex size-12 items-center justify-center rounded-full border border-border bg-background text-foreground hover:bg-mint disabled:opacity-40"
            >
              <Plus className="size-5" />
            </button>
          </div>
        </Modal>

        {/* Modal Konfirmasi Batalkan */}
        <Modal
          open={openCancelModal}
          onClose={() => setOpenCancelModal(false)}
          title="Batalkan Ajakan Ini?"
          description="Aksi ini tidak dapat dibatalkan. Peserta yang telah bergabung akan melihat ajakan ini berstatus dibatalkan."
          footer={
            <div className="flex flex-col gap-2 pt-2 sm:flex-row-reverse">
              <Button variant="destructive" loading={loading} onClick={handleCancel}>
                Ya, Batalkan Ajakan
              </Button>
              <Button variant="ghost" onClick={() => setOpenCancelModal(false)}>
                Kembali
              </Button>
            </div>
          }
        />
      </>
    );
  }

  // 6. Status Published / Full — Peserta yang Sudah Join
  if (isParticipant) {
    return (
      <>
        <Card className="flex flex-col gap-3 border-primary/30 bg-mint">
          <div className="flex items-center gap-2 text-primary">
            <CheckCircle2 className="size-5 shrink-0" />
            <span className="text-sm font-semibold">Kamu sudah terdaftar di ajakan ini!</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Sampai jumpa di lokasi sesuai jadwal. Jika ada perubahan rencana, kamu bisa membatalkan
            keikutsertaanmu.
          </p>
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={() => setOpenLeaveModal(true)}
            className="bg-background text-danger border-danger/30 hover:bg-danger-soft"
          >
            <LogOut className="size-4" />
            Keluar dari Ajakan
          </Button>
        </Card>

        {/* Modal Konfirmasi Keluar */}
        <Modal
          open={openLeaveModal}
          onClose={() => setOpenLeaveModal(false)}
          title="Keluar dari Ajakan?"
          description="Slot peserta kamu akan dibuka kembali untuk teman avatar lainnya."
          footer={
            <div className="flex flex-col gap-2 pt-2 sm:flex-row-reverse">
              <Button variant="destructive" loading={loading} onClick={handleLeave}>
                Ya, Keluar
              </Button>
              <Button variant="ghost" onClick={() => setOpenLeaveModal(false)}>
                Tetap Bergabung
              </Button>
            </div>
          }
        />
      </>
    );
  }

  // 7. Status Full — Tamu / Pengguna Belum Join
  if (isFull) {
    return (
      <div className="flex flex-col gap-2 rounded-2xl border border-border bg-background p-4 text-center">
        <p className="text-sm font-semibold text-foreground">Ajakan Sudah Penuh</p>
        <p className="text-xs text-muted-foreground">
          Kapasitas {activity.capacity} peserta telah tercapai. Cek kembali nanti jika ada peserta
          yang keluar.
        </p>
        <Button disabled fullWidth size="md" className="mt-1">
          Kapasitas Penuh ({activity.participantCount}/{activity.capacity})
        </Button>
      </div>
    );
  }

  // 8. Status Published & Masih Ada Slot — Pengguna Belum Join
  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        size="lg"
        fullWidth
        loading={loading}
        onClick={handleJoin}
        className="shadow-md"
      >
        <UserPlus className="size-5" />
        Gabung Ajakan Ini ({activity.capacity - activity.participantCount} slot tersisa)
      </Button>

      {/* Modal Sukses Bergabung & Kalender */}
      <JoinSuccessModal
        open={openJoinSuccessModal}
        onClose={() => setOpenJoinSuccessModal(false)}
        activity={activity}
      />
    </div>
  );
}
