'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import {
  Bookmark,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flag,
  Gift,
  Heart,
  MapPin,
  MessageSquare,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
} from 'lucide-react';
import {
  haversineDistanceKm,
  publicUserSchema,
  type ActivityDoc,
  type PublicUser,
} from '@placetogo/shared';
import { FaIcon } from '@/components/ui/font-awesome-icon';
import {
  ACTIVITY_COVER_SIZE,
  getActivityCoverImage,
  getCategoryOrInterestImage,
} from '@/components/activities/category-icons';
import { ActivityCardSkeletonList } from '@/components/activities/activity-card-skeleton';
import { ActivityActions } from '@/components/activities/activity-actions';
import { useAuth } from '@/components/auth/auth-provider';
import { useViewerPosition } from '@/hooks/use-viewer-position';
import { ReportModal } from '@/components/reports/report-modal';
import { ReportSuccessModal } from '@/components/reports/report-success-modal';
import { SupportModal } from '@/components/meeting/support-modal';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { useToast } from '@/components/ui/toast';
import { fetchActivityById } from '@/lib/activities/read';
import {
  activityTraitLabel,
  categoryLabel,
  cityLabel,
  formatDistanceKm,
  getPaymentTypeInfo,
} from '@/lib/activities/format';
import { getFirebase } from '@/lib/firebase';
import { cn } from '@/lib/utils';
import { joinActivity, ApiError } from '@/lib/api';

type LoadState =
  | { kind: 'loading' }
  | { kind: 'not-found' }
  | { kind: 'error' }
  | { kind: 'ready'; activity: ActivityDoc; creator: PublicUser | null; isParticipant: boolean };

async function checkIsParticipant(activityId: string, uid: string | null): Promise<boolean> {
  if (!uid) return false;
  try {
    const { db } = getFirebase();
    const snap = await getDoc(doc(db, 'activities', activityId, 'participants', uid));
    return snap.exists();
  } catch {
    return false;
  }
}

async function loadDetail(id: string, currentUid: string | null): Promise<LoadState> {
  try {
    const activity = await fetchActivityById(id);
    if (!activity) return { kind: 'not-found' };
    const [creator, isParticipant] = await Promise.all([
      fetchCreatorProfile(activity.creatorId),
      checkIsParticipant(id, currentUid),
    ]);
    return { kind: 'ready', activity, creator, isParticipant };
  } catch {
    return { kind: 'error' };
  }
}

/** Profil publik pembuat ajakan; degradasi anggun bila belum ada/tidak terbaca. */
async function fetchCreatorProfile(uid: string): Promise<PublicUser | null> {
  try {
    const { db } = getFirebase();
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return null;
    const parsed = publicUserSchema.safeParse(snap.data());
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

const fullDateFormatter = new Intl.DateTimeFormat('id-ID', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});
const hourMinuteFormatter = new Intl.DateTimeFormat('id-ID', {
  hour: '2-digit',
  minute: '2-digit',
});

function formatEventDate(ms: number): string {
  return fullDateFormatter.format(new Date(ms));
}

function formatEventTimeRange(startsAtMs: number): string {
  const start = new Date(startsAtMs);
  const end = new Date(startsAtMs + 90 * 60 * 1000); // estimasi 90 menit durasi
  return `${hourMinuteFormatter.format(start).replace(':', '.')} - ${hourMinuteFormatter
    .format(end)
    .replace(':', '.')}`;
}

export function ActivityDetail({ id }: { id: string }) {
  const { account } = useAuth();
  const currentUid = account.kind === 'ready' ? account.account.uid : null;

  const [state, setState] = React.useState<LoadState>({ kind: 'loading' });

  React.useEffect(() => {
    let ignore = false;
    void loadDetail(id, currentUid).then((result) => {
      if (!ignore) setState(result);
    });
    return () => {
      ignore = true;
    };
  }, [id, currentUid]);

  function retry() {
    setState({ kind: 'loading' });
    void loadDetail(id, currentUid).then(setState);
  }

  if (state.kind === 'loading') {
    return (
      <div className="flex flex-col gap-4 py-2">
        <ActivityCardSkeletonList count={1} />
      </div>
    );
  }

  if (state.kind === 'not-found') {
    return (
      <div className="flex flex-col gap-4 py-4">
        <Link
          href="/jelajah"
          className="inline-flex min-h-11 items-center gap-1.5 self-start rounded-full pr-4 text-sm font-semibold text-primary hover:bg-mint"
        >
          <ChevronLeft className="size-5" aria-hidden="true" />
          Kembali ke Jelajah
        </Link>
        <EmptyState
          title="Ajakan tidak ditemukan"
          description="Ajakan ini mungkin sudah dihapus, ditutup, atau belum dipublikasikan."
        />
      </div>
    );
  }

  if (state.kind === 'error') {
    return (
      <div className="flex flex-col gap-4 py-4">
        <Link
          href="/jelajah"
          className="inline-flex min-h-11 items-center gap-1.5 self-start rounded-full pr-4 text-sm font-semibold text-primary hover:bg-mint"
        >
          <ChevronLeft className="size-5" aria-hidden="true" />
          Kembali ke Jelajah
        </Link>
        <ErrorState description="Tidak dapat memuat detail ajakan." onRetry={retry} />
      </div>
    );
  }

  return (
    <ActivityDetailNewView
      initialActivity={state.activity}
      creator={state.creator}
      initialIsParticipant={state.isParticipant}
      currentUserId={currentUid}
    />
  );
}

type ParticipantUser = PublicUser & { uid: string };

function ActivityDetailNewView({
  initialActivity,
  creator,
  initialIsParticipant,
  currentUserId,
}: {
  initialActivity: ActivityDoc;
  creator: PublicUser | null;
  initialIsParticipant: boolean;
  currentUserId: string | null;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const viewerPosition = useViewerPosition();

  const [activity, setActivity] = React.useState(initialActivity);
  const [isParticipant, setIsParticipant] = React.useState(initialIsParticipant);
  const [participants, setParticipants] = React.useState<ParticipantUser[]>([]);
  const [, setLoadingParticipants] = React.useState(false);
  const [isSaved, setIsSaved] = React.useState(false);
  const [isLiked, setIsLiked] = React.useState(false);

  const [reportModalOpen, setReportModalOpen] = React.useState(false);
  const [reportSuccessOpen, setReportSuccessOpen] = React.useState(false);
  const [promoModalOpen, setPromoModalOpen] = React.useState(false);
  const [manageModalOpen, setManageModalOpen] = React.useState(false);
  const [supportModalOpen, setSupportModalOpen] = React.useState(false);
  const [joining, setJoining] = React.useState(false);

  const isCreator = Boolean(
    currentUserId && activity.creatorId && currentUserId === activity.creatorId,
  );
  const isFull = activity.participantCount >= activity.capacity;

  // Jarak dari posisi pengguna
  const distanceKm =
    activity.lat !== undefined && activity.lng !== undefined && viewerPosition
      ? haversineDistanceKm(viewerPosition, { lat: activity.lat, lng: activity.lng })
      : undefined;

  // Load peserta aktivitas
  React.useEffect(() => {
    let ignore = false;
    async function load() {
      setLoadingParticipants(true);
      try {
        const { db } = getFirebase();
        const pSnap = await getDocs(collection(db, 'activities', activity.id, 'participants'));
        const uids = pSnap.docs.map((d) => d.id);
        const userProfiles = await Promise.all(
          uids.map(async (uid) => {
            const profile = await fetchCreatorProfile(uid);
            return profile ? { ...profile, uid } : null;
          }),
        );
        if (!ignore) {
          setParticipants(userProfiles.filter(Boolean) as ParticipantUser[]);
          setLoadingParticipants(false);
        }
      } catch {
        if (!ignore) setLoadingParticipants(false);
      }
    }

    void Promise.resolve().then(() => {
      if (!ignore) void load();
    });
    return () => {
      ignore = true;
    };
  }, [activity.id]);

  // Gabungan semua member (Creator + Peserta)
  const allMeetingMembers = React.useMemo<ParticipantUser[]>(() => {
    const list: ParticipantUser[] = [];
    if (creator) {
      list.push({ ...creator, uid: activity.creatorId });
    }
    for (const p of participants) {
      if (!list.some((m) => m.uid === p.uid)) {
        list.push(p);
      }
    }
    return list;
  }, [creator, activity.creatorId, participants]);

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${activity.venueName} ${cityLabel(activity.cityId)}`,
  )}`;

  const paymentInfo = getPaymentTypeInfo(activity.paymentType);

  async function handleJoinQuick() {
    if (!currentUserId) {
      toast({
        title: 'Masuk diperlukan',
        description: 'Silakan masuk terlebih dahulu untuk mengikuti ajakan.',
      });
      router.push('/masuk');
      return;
    }
    if (isParticipant) {
      // Jika sudah bergabung -> langsung bawa ke Chat
      router.push(`/chat?cid=${activity.id}`);
      return;
    }
    if (isFull) {
      toast({
        title: 'Ajakan sudah penuh',
        description: 'Kapasitas peserta untuk ajakan ini sudah tercapai.',
      });
      return;
    }

    setJoining(true);
    try {
      await joinActivity(activity.id);
      setIsParticipant(true);
      setActivity((prev) => ({
        ...prev,
        participantCount: prev.participantCount + 1,
        status: prev.participantCount + 1 >= prev.capacity ? 'full' : prev.status,
      }));
      toast({
        title: 'Berhasil bergabung! 🎉',
        description: 'Kamu sudah terdaftar di ajakan ini. Yuk mulai ngobrol di Chat!',
      });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Gagal bergabung ke ajakan.';
      toast({ title: 'Gagal', description: msg });
    } finally {
      setJoining(false);
    }
  }

  function handleShare() {
    if (navigator.share) {
      navigator
        .share({
          title: activity.title,
          text: `Yuk ikutan ajakan ${activity.title} di placetogo!`,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: 'Tautan disalin!',
        description: 'Tautan ajakan telah disalin ke clipboard.',
      });
    }
  }

  return (
    <div className="flex flex-col gap-5 pb-44 md:pb-32 -mt-2">
      {/* Top Header Navigation Bar */}
      <div className="flex items-center justify-between pt-1">
        <Link
          href="/jelajah"
          className="flex size-11 items-center justify-center rounded-full bg-background border border-border/80 text-foreground hover:bg-mint hover:border-primary/30 transition-all shadow-xs"
          aria-label="Kembali ke Jelajah"
        >
          <ChevronLeft className="size-5" />
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setIsLiked(!isLiked);
              toast({
                title: isLiked ? 'Dihapus dari favorit' : 'Disukai ❤️',
                description: isLiked ? 'Ajakan dihapus dari daftar suka' : 'Ajakan ditambahkan ke daftar suka',
              });
            }}
            className={cn(
              'flex size-11 items-center justify-center rounded-full border transition-all shadow-xs',
              isLiked
                ? 'bg-rose-50 border-rose-200 text-rose-500 dark:bg-rose-950/30'
                : 'bg-background border-border/80 text-foreground hover:bg-rose-50 hover:text-rose-500',
            )}
            aria-label="Sukai ajakan"
          >
            <Heart className={cn('size-5', isLiked && 'fill-rose-500 text-rose-500')} />
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="flex size-11 items-center justify-center rounded-full bg-background border border-border/80 text-foreground hover:bg-mint hover:border-primary/30 transition-all shadow-xs"
            aria-label="Bagikan ajakan"
          >
            <FaIcon icon="fa-arrow-up-from-bracket" className="text-sm" />
          </button>
        </div>
      </div>

      {/* Foto sampul (mockup layar 16): kapasitas ditempelkan di atasnya seperti di referensi. */}
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-3xl border border-border shadow-sm">
        <Image
          src={getActivityCoverImage(activity.categoryId)}
          alt={`Suasana ${activity.venueName}`}
          width={ACTIVITY_COVER_SIZE.width}
          height={ACTIVITY_COVER_SIZE.height}
          priority
          sizes="(max-width: 640px) 100vw, 640px"
          className="size-full object-cover"
        />
        <span
          className={cn(
            'absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold shadow-sm backdrop-blur-sm',
            isFull ? 'bg-danger-soft/95 text-danger-soft-foreground' : 'bg-background/95 text-primary',
          )}
        >
          <FaIcon icon="fa-users" className="text-[10px]" />
          {activity.participantCount}/{activity.capacity}
        </span>
      </div>

      {/* Category Pill Badge */}
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-2 rounded-full bg-mint px-3.5 py-1.5 text-xs font-bold text-primary border border-mint-strong/30 shadow-2xs">
          <Image
            src={getCategoryOrInterestImage(activity.categoryId)}
            alt=""
            width={20}
            height={20}
            className="size-4.5 rounded-full object-contain"
          />
          <span>{categoryLabel(activity.categoryId)}</span>
        </span>
      </div>

      {/* Main Title & Subtitle */}
      <div className="flex flex-col gap-1.5">
        <h1 className="tracking-tight text-foreground">
          {activity.title}
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {activity.description ||
            `Ngopi dan ngobrol santai bersama teman baru. Semua topik oke, tanpa tekanan. Yuk gabung!`}
        </p>
      </div>

      {/* 3 Grid Info Pills (Date, Time, Distance/Location) */}
      <div className="grid grid-cols-3 gap-2">
        {/* Date Box */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 rounded-2xl border border-border/80 bg-background p-3 text-center sm:text-left shadow-2xs">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-mint text-primary">
            <Calendar className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-foreground truncate">
              {formatEventDate(activity.startsAt)}
            </p>
          </div>
        </div>

        {/* Time Box */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 rounded-2xl border border-border/80 bg-background p-3 text-center sm:text-left shadow-2xs">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-mint text-primary">
            <Clock className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-foreground truncate">
              {formatEventTimeRange(activity.startsAt)}
            </p>
          </div>
        </div>

        {/* Distance / City Box */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 rounded-2xl border border-border/80 bg-background p-3 text-center sm:text-left shadow-2xs">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-mint text-primary">
            <MapPin className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-foreground truncate">
              {distanceKm !== undefined ? formatDistanceKm(distanceKm) : cityLabel(activity.cityId)}
            </p>
            <p className="text-[10px] text-muted-foreground hidden sm:block truncate">dari lokasi kamu</p>
          </div>
        </div>
      </div>

      {/* Venue Promo / Partner Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-amber-200/60 bg-gradient-to-r from-amber-50/90 via-orange-50/70 to-amber-100/60 p-4 shadow-sm dark:from-amber-950/20 dark:to-orange-950/20 dark:border-amber-900/40">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col gap-1 max-w-[65%]">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm sm:text-base text-foreground tracking-tight">
                {activity.venueName}
              </span>
            </div>
            <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
              Lebih dari sekadar tempat
            </p>
            <p className="text-[11px] text-muted-foreground">Ruang bertemu, cerita baru.</p>
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setPromoModalOpen(true)}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-primary px-3.5 py-1 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-xs"
            >
              <span>Lihat Promosi</span>
              <ChevronRight className="size-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Venue Location Row & Open Maps */}
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/80 bg-background p-3.5 shadow-2xs">
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-w-0 items-center gap-2.5 group"
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-mint/60 text-primary">
            <Store className="size-4.5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <h2 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate">
                {activity.venueName}
              </h2>
              <ChevronRight className="size-3 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {activity.cityId ? `Area ${cityLabel(activity.cityId)}` : 'Lokasi pertemuan'}
            </p>
          </div>
        </a>

        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-xl border border-border bg-background px-3 text-xs font-bold text-foreground hover:bg-mint hover:text-primary hover:border-primary/40 transition-all shadow-2xs"
        >
          <FaIcon icon="fa-map-location-dot" className="text-xs text-primary" />
          <span>Buka Maps</span>
        </a>
      </div>

      {/* Inisiator Section */}
      <div className="flex flex-col gap-2 pt-1">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Inisiator</h2>
          {!isCreator && creator && (
            <button
              type="button"
              onClick={() => setSupportModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold shadow-2xs transition-all cursor-pointer active:scale-95"
            >
              <Gift className="size-3.5" />
              <span>Beri Hadiah</span>
            </button>
          )}
        </div>
        {creator ? (
          <div className="flex items-center justify-between rounded-2xl border border-border/80 bg-background p-3.5 shadow-2xs">
            <Link
              href={isCreator ? '/profil' : `/profil/${activity.creatorId || 'usr_001'}`}
              className="flex items-center gap-3 min-w-0 group"
            >
              <Avatar name={creator.displayName} avatarId={creator.avatarId} size="md" />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-sm text-foreground group-hover:text-primary transition-colors truncate">
                    {creator.displayName}
                  </p>
                  <span className="inline-flex items-center rounded-full bg-mint px-2 py-0.5 text-[10px] font-bold text-primary border border-mint-strong/30">
                    Level 3
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">Inisiator Ajakan</p>
              </div>
            </Link>

            <div className="flex items-center gap-2">
              {!isCreator && (
                <button
                  type="button"
                  onClick={() => setSupportModalOpen(true)}
                  className="p-2 rounded-xl bg-amber-50 text-amber-800 border border-amber-200/80 hover:bg-amber-100 transition-colors"
                  title="Beri Hadiah Dukungan"
                >
                  <Gift className="size-4" />
                </button>
              )}
              <Link
                href={isCreator ? '/profil' : `/profil/${activity.creatorId || 'usr_001'}`}
                className="p-2 rounded-xl text-muted-foreground hover:bg-mint hover:text-primary transition-colors"
              >
                <ChevronRight className="size-4" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-background p-3.5">
            <Avatar name="Inisiator" size="md" />
            <div>
              <p className="font-bold text-sm text-foreground">Sahabat PlaceToGo</p>
              <p className="text-xs text-muted-foreground">Inisiator Ajakan</p>
            </div>
          </div>
        )}
      </div>

      {/* Peserta Section */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Peserta</h2>
          <span className="text-xs font-extrabold text-foreground">
            {activity.participantCount}/{activity.capacity}
          </span>
        </div>

        <div className="flex items-center gap-2.5 overflow-x-auto py-1 no-scrollbar">
          {/* Inisiator Avatar */}
          {creator && (
            <div className="relative group shrink-0">
              <Avatar name={creator.displayName} avatarId={creator.avatarId} size="lg" />
              <span className="absolute -bottom-1 -right-1 flex size-4.5 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white ring-2 ring-background">
                ★
              </span>
            </div>
          )}

          {/* Peserta Avatars */}
          {participants.map((p, idx) => (
            <div key={p.uid || idx} className="relative shrink-0">
              <Avatar name={p.displayName} avatarId={p.avatarId} size="lg" />
            </div>
          ))}

          {/* Placeholder Slots / Sisa Slot */}
          {activity.capacity > activity.participantCount && (
            <div className="flex size-12 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-border bg-muted/30 text-xs font-bold text-muted-foreground">
              +{activity.capacity - activity.participantCount}
            </div>
          )}
        </div>
      </div>

      <div className="h-px bg-border/60" />

      {/* Tentang Aktivitas Section */}
      <div className="flex flex-col gap-2.5">
        <h2 className="text-base font-bold text-foreground">Tentang Aktivitas</h2>
        {/*
          Deskripsi ditampilkan apa adanya. Sebelumnya ajakan tanpa deskripsi diisi kalimat
          karangan tentang "ngopi sore", yang keliru untuk ajakan seperti badminton.
        */}
        {activity.description ? (
          <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/90">
            {activity.description}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">Pembuat ajakan belum menambahkan deskripsi.</p>
        )}

        {/*
          Sifat ajakan yang dipilih pembuatnya. Sebelumnya tiga sifat ditampilkan tetap di
          setiap ajakan tanpa pernah dipilih siapa pun, sehingga tidak bisa dipercaya.
        */}
        {activity.traits && activity.traits.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {activity.traits.map((trait) => (
              <span
                key={trait}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/60 px-3 py-1 text-xs font-medium text-foreground"
              >
                <FaIcon icon="fa-check" className="text-[10px] text-primary" />
                {activityTraitLabel(trait)}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="h-px bg-border/60" />

      {/* Metode Pembayaran Section */}
      <div className="flex flex-col gap-2.5">
        <h2 className="text-base font-bold text-foreground">Metode Pembayaran</h2>
        <div className="flex items-start gap-3 rounded-2xl border border-border/80 bg-background p-3.5 shadow-2xs">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-mint text-primary">
            <FaIcon icon={paymentInfo.icon} className="text-base" />
          </div>
          <div>
            <p className="font-bold text-sm text-foreground">{paymentInfo.label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {activity.paymentType === 'treat'
                ? 'Seluruh biaya ditanggung oleh pengundang / inisiator ajakan.'
                : activity.paymentType === 'gift'
                ? 'Setiap peserta yang hadir dan check-in akan mendapatkan reward 5.000 Coin!'
                : 'Biaya konsumsi ditanggung secara patungan bersama.'}
            </p>
          </div>
        </div>
      </div>

      <div className="h-px bg-border/60" />

      {/* Aturan & Etika Section */}
      <div className="flex flex-col gap-3">
        <h2 className="text-base font-bold text-foreground">Aturan & Etika</h2>
        <div className="flex flex-col gap-3 text-xs text-muted-foreground">
          <div className="flex items-start gap-2.5">
            <ShoppingBag className="size-4 text-foreground shrink-0 mt-0.5" />
            <span className="text-foreground/90">Bertemu di tempat publik</span>
          </div>
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="size-4 text-foreground shrink-0 mt-0.5" />
            <span className="text-foreground/90">Saling menghargai dan menjaga kenyamanan</span>
          </div>
          <div className="flex items-start gap-2.5">
            <ShieldAlert className="size-4 text-foreground shrink-0 mt-0.5" />
            <span className="text-foreground/90">
              Tidak ada unsur SARA, politik, atau tindakan tidak pantas
            </span>
          </div>
          <div className="flex items-start gap-2.5">
            <Clock className="size-4 text-foreground shrink-0 mt-0.5" />
            <span className="text-foreground/90">Jika berhalangan, beri tahu lebih awal</span>
          </div>
        </div>
      </div>

      {/* Akses Chat Diskusi Langsung */}
      {(isParticipant || isCreator) && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-primary/30 bg-mint/40 p-4 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <MessageSquare className="size-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Diskusi & Chat Grup</p>
              <p className="text-xs text-muted-foreground">
                Koordinasikan waktu & obrolan bersama peserta lainnya di ruang chat.
              </p>
            </div>
          </div>
          <Link
            href={`/chat?cid=${activity.id}`}
            className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-xl bg-primary px-3.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-xs"
          >
            <span>Buka Chat</span>
            <ChevronRight className="size-3.5" />
          </Link>
        </div>
      )}

      {/* Tombol Lapor */}
      <div className="flex justify-center pt-2">
        <button
          type="button"
          onClick={() => setReportModalOpen(true)}
          className="inline-flex min-h-11 items-center gap-1.5 px-3 text-xs font-semibold text-muted-foreground hover:text-danger transition-colors"
        >
          <Flag className="size-3.5" />
          Laporkan ajakan ini
        </button>
      </div>

      {/* Fixed Sticky Bottom Action Bar (Merapat di atas bottom-nav mobile & bottom desktop) */}
      <div className="fixed inset-x-0 bottom-16 md:bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur-md p-3 sm:px-6 shadow-lg">
        <div className="mx-auto max-w-md flex flex-col gap-2">
          <div className="flex items-center gap-2">
            {/* Tombol Aksi Utama */}
            {isCreator ? (
              <button
                type="button"
                onClick={() => setManageModalOpen(true)}
                className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-primary px-4 text-sm font-bold text-primary-foreground shadow-md transition-all hover:bg-primary/90 active:scale-[0.99]"
              >
                <FaIcon icon="fa-sliders" className="text-sm" />
                <span>Kelola Ajakan Saya</span>
              </button>
            ) : isParticipant ? (
              <Link
                href={`/chat?cid=${activity.id}`}
                className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-primary px-4 text-sm font-bold text-primary-foreground shadow-md transition-all hover:bg-primary/90 active:scale-[0.99]"
              >
                <MessageSquare className="size-4" />
                <span>Masuk ke Chat Ajakan</span>
              </Link>
            ) : (
              <button
                type="button"
                disabled={joining || isFull}
                onClick={handleJoinQuick}
                className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-primary px-4 text-sm font-bold text-primary-foreground shadow-md transition-all hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
              >
                {joining ? (
                  <span>Memproses...</span>
                ) : isFull ? (
                  <span>Ajakan Sudah Penuh</span>
                ) : (
                  <span>Ikuti Ajakan</span>
                )}
              </button>
            )}

            {/* Bookmark / Save Button */}
            <button
              type="button"
              onClick={() => {
                setIsSaved(!isSaved);
                toast({
                  title: isSaved ? 'Dihapus dari simpanan' : 'Disimpan 🔖',
                  description: isSaved
                    ? 'Ajakan dihapus dari bookmark'
                    : 'Ajakan berhasil disimpan ke bookmark kamu',
                });
              }}
              className={cn(
                'flex size-12 shrink-0 items-center justify-center rounded-2xl border transition-all shadow-xs',
                isSaved
                  ? 'border-primary bg-mint text-primary'
                  : 'border-border bg-background text-foreground hover:bg-mint/40',
              )}
              aria-label="Simpan bookmark"
            >
              <Bookmark className={cn('size-5', isSaved && 'fill-primary text-primary')} />
            </button>
          </div>

          {/* Footer Disclaimer */}
          <p className="text-center text-[10px] text-muted-foreground">
            Dengan mengikuti, kamu setuju dengan{' '}
            <Link href="/panduan-komunitas" className="font-semibold underline hover:text-foreground">
              Panduan Komunitas placetogo.id
            </Link>
          </p>
        </div>
      </div>

      {/* Modal Kelola Ajakan (Creator Actions) */}
      <Modal
        open={manageModalOpen}
        onClose={() => setManageModalOpen(false)}
        title="Kelola Ajakan Saya"
      >
        <div className="flex flex-col gap-4 py-2">
          <ActivityActions
            activity={activity}
            currentUserId={currentUserId}
            isParticipant={isParticipant}
            participants={allMeetingMembers}
            onActivityUpdated={(upd) => {
              setActivity(upd);
            }}
            onParticipantStatusChanged={(joined) => {
              setIsParticipant(joined);
            }}
          />
        </div>
      </Modal>

      {/* Modal Promo Venue */}
      <Modal
        open={promoModalOpen}
        onClose={() => setPromoModalOpen(false)}
        title={`Promosi di ${activity.venueName}`}
      >
        <div className="flex flex-col gap-4 py-2">
          <div className="rounded-2xl border border-primary/20 bg-mint p-4 text-center">
            <Sparkles className="size-8 text-primary mx-auto mb-2" />
            <h3 className="text-base font-bold text-foreground">Diskon 10% Komunitas</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Tunjukkan halaman ajakan ini kepada staf di {activity.venueName} saat berkumpul untuk
              mendapatkan potongan harga khusus.
            </p>
          </div>

          <div className="rounded-2xl border border-coin/30 bg-warning-soft p-4">
            <div className="flex items-center gap-2 text-warning-soft-foreground font-bold text-sm mb-1">
              <FaIcon icon="fa-coins" />
              <span>Reward 2.000 Coin</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Dapatkan koin reward setelah pertemuan dan check-in terverifikasi di venue ini.
            </p>
          </div>

          <Button size="lg" onClick={() => setPromoModalOpen(false)}>
            Tutup
          </Button>
        </div>
      </Modal>

      {/* Report Modal */}
      <ReportModal
        open={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        targetId={activity.id}
        targetType="activity"
        targetTitle={activity.title}
        onReportSubmitted={() => setReportSuccessOpen(true)}
      />

      {/* Report Success Modal */}
      <ReportSuccessModal open={reportSuccessOpen} onClose={() => setReportSuccessOpen(false)} />

      {/* Support / Gift Modal to Host */}
      {creator && (
        <SupportModal
          open={supportModalOpen}
          onClose={() => setSupportModalOpen(false)}
          targetUser={{
            uid: activity.creatorId || 'usr_001',
            displayName: creator.displayName,
            avatarId: creator.avatarId,
          }}
        />
      )}
    </div>
  );
}
