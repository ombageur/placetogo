'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import {
  ChevronLeft,
  MapPin,
  Gift,
  HeartHandshake,
  Sparkles,
  ShieldCheck,
  MessageCircle,
  Share2,
} from 'lucide-react';
import {
  CITY_CATALOG,
  INTEREST_CATALOG,
  type InterestId,
  type MyProfile,
} from '@placetogo/shared';
import { Avatar, type AvatarId } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SupportModal } from '@/components/meeting/support-modal';
import { ALL_21_GIFTS, type GiftItem } from '@/components/hadiah/gift-catalog';
import { INTEREST_IMAGE_SRC } from '@/components/profile/interest-images';
import { useAuth } from '@/components/auth/auth-provider';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

const cityLabel = (id: string) => CITY_CATALOG.find((c) => c.id === id)?.label ?? id;
const interestLabel = (id: string) => INTEREST_CATALOG.find((i) => i.id === id)?.label ?? id;

const SAMPLE_USERS: Record<
  string,
  {
    displayName: string;
    avatarId: AvatarId;
    cityId: string;
    bio: string;
    level: string;
    attendanceRate: number;
    interests: InterestId[];
    stats: { meetings: number; activities: number; giftsReceived: number; earningsTotal: number };
    unlockedGifts: Record<string, number>;
  }
> = {
  usr_001: {
    displayName: 'Rahma Anindya',
    avatarId: 'cat',
    cityId: 'surabaya',
    bio: 'Pencinta kopi, tech enthusiast, dan penikmat diskusi santai sore hari.',
    level: 'Level 3 Super Host',
    attendanceRate: 98,
    interests: ['ngobrol', 'kuliner', 'film', 'buku'],
    stats: { meetings: 42, activities: 14, giftsReceived: 28, earningsTotal: 485000 },
    unlockedGifts: {
      kopi: 8,
      bunga: 4,
      love: 5,
      jempol: 7,
      kiss: 4,
    },
  },
  usr_002: {
    displayName: 'Dimas Wicaksono',
    avatarId: 'bear',
    cityId: 'surabaya',
    bio: 'Suka olahraga lari pagi, kulineran street food, dan cari teman sefrekuensi.',
    level: 'Level 2 Host',
    attendanceRate: 95,
    interests: ['olahraga', 'ngobrol', 'pertemanan'],
    stats: { meetings: 25, activities: 6, giftsReceived: 12, earningsTotal: 180000 },
    unlockedGifts: {
      '01_kopi': 4,
      '05_like': 5,
      '19_tetap_kuat': 2,
      '21_gas_terus': 1,
    },
  },
  usr_003: {
    displayName: 'Sarah Olivia',
    avatarId: 'rabbit',
    cityId: 'malang',
    bio: 'Desainer grafis & penikmat film indie. Sering ngadain meetup seru di Malang!',
    level: 'Level 3 Super Host',
    attendanceRate: 100,
    interests: ['seni', 'film', 'karier', 'buku'],
    stats: { meetings: 53, activities: 22, giftsReceived: 35, earningsTotal: 620000 },
    unlockedGifts: {
      '02_bunga': 6,
      '08_semangat': 3,
      '11_happy_birthday': 2,
      '15_kado': 4,
      '18_malaikat': 1,
    },
  },
};

export function UserProfileView({ userId }: { userId: string }) {
  const router = useRouter();
  const { user, account } = useAuth();
  const { toast } = useToast();
  const [supportModalOpen, setSupportModalOpen] = React.useState(false);

  const currentUid = account.kind === 'ready' ? account.account.uid : null;
  const isOwnProfile = currentUid === userId;

  const profileData = SAMPLE_USERS[userId] ?? {
    displayName: 'Sahabat PlaceToGo',
    avatarId: 'cat' as AvatarId,
    cityId: 'surabaya',
    bio: 'Aktif mengikuti dan membuat ajakan di komunitas.',
    level: 'Level 2 Host',
    attendanceRate: 96,
    interests: ['ngobrol', 'kuliner'],
    stats: { meetings: 18, activities: 5, giftsReceived: 8, earningsTotal: 120000 },
    unlockedGifts: { '01_kopi': 3, '05_like': 3, '07_bintang': 2 },
  };

  function handleGiftSent(gift: GiftItem) {
    toast({
      title: `Hadiah ${gift.name} Terkirim! 🎉`,
      description: `Dukungan bernilai Rp${gift.earningsIdr.toLocaleString('id-ID')} berhasil dikirim ke ${profileData.displayName}.`,
      variant: 'success',
    });
  }

  return (
    <div className="flex flex-col gap-5 pb-24">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex size-11 items-center justify-center rounded-full bg-background border border-border/80 text-foreground hover:bg-mint transition-colors"
        >
          <ChevronLeft className="size-5" />
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              toast({ title: 'Tautan disalin', description: 'Tautan profil berhasil disalin.' });
            }}
            className="flex size-11 items-center justify-center rounded-full bg-background border border-border/80 text-foreground hover:bg-mint transition-colors"
          >
            <Share2 className="size-4.5" />
          </button>
        </div>
      </div>

      {/* Main Profile Card */}
      <Card className="flex flex-col gap-4 bg-background border border-border/80 shadow-xs">
        <div className="flex items-center gap-4">
          <Avatar name={profileData.displayName} avatarId={profileData.avatarId} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-lg md:text-xl font-extrabold text-foreground truncate">
                {profileData.displayName}
              </h1>
              <Badge variant="success" className="text-[10px] px-1.5 py-0">
                ✓ Verified
              </Badge>
            </div>
            <p className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <MapPin className="size-3.5 text-primary" />
              {cityLabel(profileData.cityId)} • <span className="font-semibold text-primary">{profileData.level}</span>
            </p>
          </div>
        </div>

        {/* 3 Stats Bar */}
        <div className="grid grid-cols-3 divide-x divide-border rounded-2xl border border-border bg-mint/50 text-center">
          <div className="flex flex-col items-center justify-center py-3">
            <span className="text-lg font-extrabold text-foreground">{profileData.stats.meetings}</span>
            <span className="text-[11px] font-semibold text-muted-foreground">Pertemuan</span>
          </div>

          <div className="flex flex-col items-center justify-center py-3">
            <span className="text-lg font-extrabold text-foreground">{profileData.stats.activities}</span>
            <span className="text-[11px] font-semibold text-muted-foreground">Ajakan</span>
          </div>

          <div className="flex flex-col items-center justify-center py-3">
            <span className="text-lg font-extrabold text-amber-700">
              {profileData.stats.giftsReceived}
            </span>
            <span className="text-[11px] font-semibold text-muted-foreground">Hadiah Diterima</span>
          </div>
        </div>

        {profileData.bio && (
          <p className="text-xs text-foreground bg-muted/30 p-3 rounded-xl leading-relaxed">
            "{profileData.bio}"
          </p>
        )}

        {/* Minat */}
        {profileData.interests.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {profileData.interests.map((id) => (
              <div
                key={id}
                className="inline-flex items-center gap-1.5 rounded-full bg-mint px-3 py-1 text-xs font-semibold text-foreground border border-mint-strong/40"
              >
                {INTEREST_IMAGE_SRC[id as InterestId] && (
                  <Image
                    src={INTEREST_IMAGE_SRC[id as InterestId]}
                    alt=""
                    width={20}
                    height={20}
                    className="size-4 rounded-full object-contain"
                  />
                )}
                <span>{interestLabel(id)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Action Button: Beri Hadiah (Only for other users) */}
        {!isOwnProfile ? (
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
            <Button
              variant="primary"
              size="md"
              onClick={() => setSupportModalOpen(true)}
              className="gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-extrabold shadow-sm"
            >
              <Gift className="size-4" />
              Beri Hadiah
            </Button>

            <Link href={`/chat?to=${userId}`} className="w-full">
              <Button variant="secondary" size="md" className="w-full gap-2">
                <MessageCircle className="size-4 text-primary" />
                Kirim Pesan
              </Button>
            </Link>
          </div>
        ) : (
          <div className="pt-2 border-t border-border">
            <Link href="/profil/edit">
              <Button variant="outline" size="md" className="w-full">
                Edit Profil Saya
              </Button>
            </Link>
          </div>
        )}
      </Card>

      {/* Koleksi 21 Hadiah yang Telah Dikumpulkan User Ini */}
      <Card className="p-4 flex flex-col gap-3.5 bg-background">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
              <Sparkles className="size-4 text-amber-500" />
              Koleksi Hadiah Dukungan ({profileData.stats.giftsReceived} Diterima)
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Apresiasi dari teman-teman yang pernah mengikuti ajakan {profileData.displayName}.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2">
          {ALL_21_GIFTS.map((gift) => {
            const count = profileData.unlockedGifts[gift.id] ?? 0;
            const isUnlocked = count > 0;
            return (
              <div
                key={gift.id}
                className={cn(
                  'relative p-2 rounded-2xl border text-center flex flex-col items-center justify-between gap-1 transition-all',
                  isUnlocked
                    ? 'border-primary/40 bg-mint/40 shadow-2xs'
                    : 'border-border/60 bg-muted/20 opacity-40 grayscale',
                )}
              >
                <span
                  className={cn(
                    'absolute -top-1.5 -right-1 px-1.5 py-0.2 text-[8px] font-extrabold rounded-full shadow-2xs',
                    isUnlocked ? 'bg-primary text-white' : 'bg-muted-foreground/50 text-white',
                  )}
                >
                  {count}x
                </span>

                <div className="size-10 flex items-center justify-center">
                  <Image
                    src={gift.imageSrc}
                    alt={gift.name}
                    width={40}
                    height={40}
                    className="size-9 object-contain drop-shadow-xs"
                  />
                </div>

                <p className="text-[10px] font-extrabold text-foreground truncate w-full">{gift.name}</p>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Support / Gift Modal */}
      <SupportModal
        open={supportModalOpen}
        onClose={() => setSupportModalOpen(false)}
        targetUser={{
          uid: userId,
          displayName: profileData.displayName,
          avatarId: profileData.avatarId,
        }}
        onSent={handleGiftSent}
      />
    </div>
  );
}
