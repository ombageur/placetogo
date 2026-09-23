'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface DateOption {
  date: Date;
  dateString: string; // YYYY-MM-DD
  dayName: string; // SEL, RAB, KAM, dll
  dayNumber: number; // 22, 23, dll
  isToday: boolean;
}

const DAY_NAMES_ID = ['MIN', 'SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB'];

export function generateUpcomingDates(daysCount = 14): DateOption[] {
  const dates: DateOption[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < daysCount; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;

    dates.push({
      date: d,
      dateString,
      dayName: DAY_NAMES_ID[d.getDay()] ?? 'SEN',
      dayNumber: d.getDate(),
      isToday: i === 0,
    });
  }

  return dates;
}

export interface DateScrollStripProps {
  selectedDate?: string; // YYYY-MM-DD atau undefined untuk semua
  onSelectDate: (dateString?: string) => void;
  className?: string;
}

/**
 * Komponen strip kalender horizontal sesuai referensi Screen 13.
 * Menampilkan pilihan hari: SEL 22, RAB 23, KAM 24, dst.
 */
export function DateScrollStrip({
  selectedDate,
  onSelectDate,
  className,
}: DateScrollStripProps) {
  const dates = React.useMemo(() => generateUpcomingDates(14), []);

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div
        role="tablist"
        aria-label="Pilih tanggal aktivitas"
        className="flex gap-2 overflow-x-auto pb-1.5 no-scrollbar touch-pan-x"
      >
        {/* Pilihan bawaan: menampilkan seluruh ajakan tanpa dibatasi satu tanggal. */}
        <button
          type="button"
          role="tab"
          aria-selected={selectedDate === undefined}
          onClick={() => onSelectDate(undefined)}
          className={cn(
            'flex min-h-14 flex-col items-center justify-center rounded-2xl border px-3 py-1.5 transition-all shadow-xs shrink-0',
            selectedDate === undefined
              ? 'border-primary bg-primary text-primary-foreground font-bold shadow-sm scale-105'
              : 'border-border bg-background text-muted-foreground hover:bg-mint/50 hover:text-foreground',
          )}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider">Semua</span>
          <span className="mt-0.5 whitespace-nowrap text-sm font-extrabold">Semua</span>
        </button>

        {/* Daftar Tanggal */}
        {dates.map((item) => {
          const isSelected = selectedDate === item.dateString;
          return (
            <button
              key={item.dateString}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => onSelectDate(isSelected ? undefined : item.dateString)}
              className={cn(
                'flex min-h-14 min-w-[52px] flex-col items-center justify-center rounded-2xl border px-2.5 py-1.5 transition-all shadow-xs shrink-0',
                isSelected
                  ? 'border-primary bg-primary text-primary-foreground font-bold shadow-sm scale-105'
                  : 'border-border bg-background text-muted-foreground hover:bg-mint/50 hover:text-foreground',
              )}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider">
                {item.isToday ? 'Hari ini' : item.dayName}
              </span>
              <span className="text-base font-extrabold mt-0.5">
                {item.dayNumber}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
