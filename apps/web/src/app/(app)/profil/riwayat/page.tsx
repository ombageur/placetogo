'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar, CheckCircle2, Clock, MapPin, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { FaIcon } from '@/components/ui/font-awesome-icon';
import { cn } from '@/lib/utils';

import { getPaymentTypeInfo } from '@/lib/activities/format';

type RiwayatTab = 'ajakan' | 'bergabung';

interface HistoryActivityItem {
  id: string;
  title: string;
  category: string;
  paymentType: 'split' | 'treat' | 'gift';
  venue: string;
  dateStr: string;
  timeStr: string;
  status: 'upcoming' | 'completed';
  participants: string;
}

export default function RiwayatAktivitasPage() {
  const [activeTab, setActiveTab] = React.useState<RiwayatTab>('ajakan');

  const myCreatedActivities: HistoryActivityItem[] = [
    {
      id: 'a1',
      title: 'Ngopi santai di Tuku',
      category: 'Ngopi',
      paymentType: 'treat',
      venue: 'Tuku Menteng',
      dateStr: 'Sel, 22 Apr 2025',
      timeStr: '18:00',
      status: 'completed',
      participants: '3/4 peserta',
    },
    {
      id: 'a2',
      title: 'Mabar eFootball Community',
      category: 'Game',
      paymentType: 'split',
      venue: 'Game Center Blok M',
      dateStr: 'Sab, 26 Apr 2025',
      timeStr: '19:00',
      status: 'upcoming',
      participants: '5/8 peserta',
    },
    {
      id: 'a3',
      title: 'Diskusi Buku & Self Improvement',
      category: 'Buku',
      paymentType: 'gift',
      venue: 'Gramedia Matraman',
      dateStr: 'Min, 27 Apr 2025',
      timeStr: '15:00',
      status: 'upcoming',
      participants: '6/10 peserta',
    },
    {
      id: 'a4',
      title: 'Lari sore bareng di GBK',
      category: 'Olahraga',
      paymentType: 'split',
      venue: 'Stadion GBK',
      dateStr: 'Min, 20 Apr 2025',
      timeStr: '16:30',
      status: 'completed',
      participants: '8/12 peserta',
    },
  ];

  const myJoinedActivities: HistoryActivityItem[] = [
    {
      id: 'j1',
      title: 'Makan ramen bareng sepulang kerja',
      category: 'Makan',
      paymentType: 'treat',
      venue: 'Ikkudo Ichi Grand Indonesia',
      dateStr: 'Jum, 25 Apr 2025',
      timeStr: '19:00',
      status: 'upcoming',
      participants: '4/6 peserta',
    },
    {
      id: 'j2',
      title: 'Nonton Bioskop Premiere Bareng',
      category: 'Nonton',
      paymentType: 'split',
      venue: 'XXI Plaza Senayan',
      dateStr: 'Sab, 19 Apr 2025',
      timeStr: '20:15',
      status: 'completed',
      participants: '4/4 peserta',
    },
  ];

  const items = activeTab === 'ajakan' ? myCreatedActivities : myJoinedActivities;

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/profil"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:bg-mint rounded-full px-2.5 py-1"
        >
          <ArrowLeft className="size-4" />
          Profil Saya
        </Link>
      </div>

      <div>
        <h1 className="text-foreground">Riwayat Aktivitas</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Daftar ajakan yang kamu inisiasi dan pertemuan yang kamu ikuti.
        </p>
      </div>

      {/* Segmented Tabs (Screen 25) */}
      <div className="flex rounded-2xl bg-mint/70 p-1 border border-border">
        <button
          type="button"
          onClick={() => setActiveTab('ajakan')}
          className={cn(
            'flex-1 rounded-xl py-2.5 text-xs font-bold transition-all',
            activeTab === 'ajakan'
              ? 'bg-background text-primary shadow-xs'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <FaIcon icon="fa-bullhorn" className="text-xs mr-1.5" />
          Ajakan Saya ({myCreatedActivities.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('bergabung')}
          className={cn(
            'flex-1 rounded-xl py-2.5 text-xs font-bold transition-all',
            activeTab === 'bergabung'
              ? 'bg-background text-primary shadow-xs'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <FaIcon icon="fa-handshake" className="text-xs mr-1.5" />
          Bergabung ({myJoinedActivities.length})
        </button>
      </div>

      {/* List Aktivitas */}
      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/jelajah/${item.id}`}
            className="group flex flex-col gap-2.5 rounded-3xl border border-border bg-background p-4 shadow-card transition-all hover:border-primary/40 hover:shadow-md"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-bold text-secondary bg-mint px-2.5 py-0.5 rounded-full">
                  {item.category}
                </span>
                {(() => {
                  const pInfo = getPaymentTypeInfo(item.paymentType);
                  return (
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border shrink-0 ${pInfo.className}`}
                    >
                      <FaIcon icon={pInfo.icon} className="text-[9px]" />
                      <span>{pInfo.shortLabel}</span>
                    </span>
                  );
                })()}
              </div>
              <Badge variant={item.status === 'completed' ? 'neutral' : 'warning'}>
                {item.status === 'completed' ? (
                  <>
                    <CheckCircle2 className="size-3 mr-1 inline-block" />
                    Selesai
                  </>
                ) : (
                  <>
                    <Clock className="size-3 mr-1 inline-block" />
                    Akan datang
                  </>
                )}
              </Badge>
            </div>

            <h2 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
              {item.title}
            </h2>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="size-3.5 text-primary" />
                {item.dateStr} · {item.timeStr}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="size-3.5 text-primary" />
                {item.venue}
              </span>
              <span className="flex items-center gap-1 ml-auto font-semibold">
                <Users className="size-3.5 text-secondary" />
                {item.participants}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
