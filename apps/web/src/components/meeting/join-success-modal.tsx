'use client';

import * as React from 'react';
import { CalendarPlus, CheckCircle, MapPin, Sparkles } from 'lucide-react';
import type { ActivityDoc } from '@placetogo/shared';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { cityLabel, formatActivityDateTime } from '@/lib/activities/format';

export interface JoinSuccessModalProps {
  open: boolean;
  onClose: () => void;
  activity: ActivityDoc;
}

export function JoinSuccessModal({ open, onClose, activity }: JoinSuccessModalProps) {
  function handleAddToGoogleCalendar() {
    const startTime = new Date(activity.startsAt);
    const endTime = new Date(activity.startsAt + 2 * 60 * 60 * 1000); // 2 jam durasi default

    const formatGCalDate = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    const title = encodeURIComponent(`placetogo: ${activity.title}`);
    const details = encodeURIComponent(
      `Pertemuan aktivitas bersama komunitas placetogo.id.\nTempat: ${activity.venueName}, ${cityLabel(activity.cityId)}`,
    );
    const location = encodeURIComponent(`${activity.venueName}, ${cityLabel(activity.cityId)}`);
    const dates = `${formatGCalDate(startTime)}/${formatGCalDate(endTime)}`;

    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}&dates=${dates}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  return (
    <Modal open={open} onClose={onClose} title="Konfirmasi Kehadiran">
      <div className="flex flex-col items-center text-center p-2 gap-4">
        <div className="flex size-16 items-center justify-center rounded-full bg-mint text-primary">
          <CheckCircle className="size-10" />
        </div>

        <div>
          <h2 className="text-xl font-bold text-foreground">Kamu berhasil bergabung!</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Sampai jumpa di <span className="font-semibold text-foreground">{activity.venueName}</span>
          </p>
        </div>

        <div className="w-full rounded-2xl border border-border bg-mint/40 p-3.5 text-left text-xs space-y-1.5">
          <div className="flex items-center gap-2 text-foreground font-medium">
            <MapPin className="size-3.5 text-primary shrink-0" />
            <span>{activity.venueName}, {cityLabel(activity.cityId)}</span>
          </div>
          <p className="text-muted-foreground pl-5.5">{formatActivityDateTime(activity.startsAt)}</p>
          <div className="flex items-center gap-1.5 text-primary font-semibold pt-1">
            <Sparkles className="size-3.5 shrink-0" />
            <span>Reward 2.000 Coin dapat diklaim saat check-in di venue.</span>
          </div>
        </div>

        <div className="flex flex-col w-full gap-2 pt-2">
          <Button fullWidth size="md" onClick={handleAddToGoogleCalendar} variant="outline" className="bg-background">
            <CalendarPlus className="size-4" />
            Tambah ke Google Calendar
          </Button>
          <Button fullWidth size="md" onClick={onClose}>
            Lihat Aktivitas
          </Button>
        </div>
      </div>
    </Modal>
  );
}
