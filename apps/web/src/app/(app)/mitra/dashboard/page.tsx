'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft, Bell, Plus, Tag } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { FaIcon } from '@/components/ui/font-awesome-icon';

export default function VenueDashboardPage() {
  const chartDays = [
    { day: '1', val: 12 },
    { day: '5', val: 24 },
    { day: '10', val: 18 },
    { day: '15', val: 32 },
    { day: '20', val: 28 },
    { day: '25', val: 45 },
    { day: '30', val: 38 },
  ];

  const maxVal = Math.max(...chartDays.map((d) => d.val));

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/mitra"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:bg-mint rounded-full px-2.5 py-1"
        >
          <ArrowLeft className="size-4" />
          Portal Mitra
        </Link>
        <Link
          href="/notifikasi"
          aria-label="Pusat Notifikasi"
          className="flex size-11 items-center justify-center rounded-full bg-mint text-primary hover:bg-mint-strong transition-colors"
        >
          <Bell className="size-4" aria-hidden="true" />
        </Link>
      </div>

      {/* Profile Venue Card */}
      <Card className="flex items-center justify-between p-4 bg-background border border-border">
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 font-extrabold text-xl shadow-xs">
            ☕
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg text-foreground">Tuku Menteng</h1>
              <span className="rounded-full bg-mint px-2 py-0.5 text-[10px] font-bold text-primary border border-primary/20">
                Partner Resmi
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Jl. Menteng Raya No. 12, Jakarta Pusat</p>
          </div>
        </div>

        <Link
          href="/mitra/promo"
          className="inline-flex items-center gap-1.5 rounded-2xl bg-primary px-3 py-2 text-xs font-bold text-primary-foreground shadow-xs hover:bg-secondary transition-colors"
        >
          <Tag className="size-3.5" />
          Kelola Promo
        </Link>
      </Card>

      {/* 4 Metric Cards (Screen 29) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="flex flex-col gap-1 p-3.5 bg-background">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground">Pengunjung</span>
            <div className="flex size-7 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <FaIcon icon="fa-users" className="text-xs" />
            </div>
          </div>
          <p className="text-xl font-extrabold text-foreground mt-1">248</p>
          <span className="text-[10px] text-primary font-semibold">↑ +18% bln ini</span>
        </Card>

        <Card className="flex flex-col gap-1 p-3.5 bg-background">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground">Coin Diberikan</span>
            <div className="flex size-7 items-center justify-center rounded-xl bg-warning-soft text-warning-soft-foreground">
              <FaIcon icon="fa-coins" className="text-xs" />
            </div>
          </div>
          <p className="text-xl font-extrabold text-foreground mt-1">12.400</p>
          <span className="text-[10px] text-muted-foreground">62 check-in</span>
        </Card>

        <Card className="flex flex-col gap-1 p-3.5 bg-background">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground">Promo Aktif</span>
            <div className="flex size-7 items-center justify-center rounded-xl bg-mint text-primary">
              <FaIcon icon="fa-tag" className="text-xs" />
            </div>
          </div>
          <p className="text-xl font-extrabold text-foreground mt-1">8</p>
          <span className="text-[10px] text-primary font-semibold">Semua tayang</span>
        </Card>

        <Card className="flex flex-col gap-1 p-3.5 bg-background">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground">Rating Komunitas</span>
            <div className="flex size-7 items-center justify-center rounded-xl bg-amber-100 text-amber-500">
              <FaIcon icon="fa-star" className="text-xs" />
            </div>
          </div>
          <p className="text-xl font-extrabold text-foreground mt-1">4.8</p>
          <span className="text-[10px] text-muted-foreground">dari 95 ulasan</span>
        </Card>
      </div>

      {/* Grafik Kunjungan 30 Hari Terakhir */}
      <Card className="flex flex-col gap-4 p-5 bg-background">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-foreground">Kunjungan Komunitas</h2>
            <p className="text-xs text-muted-foreground">Statistik pertemuan 30 hari terakhir</p>
          </div>
          <span className="text-xs font-bold text-primary bg-mint px-2.5 py-1 rounded-full">
            Total 248 Temu
          </span>
        </div>

        {/* Bar chart mockup */}
        <div className="flex items-end justify-between gap-2 h-36 pt-4 px-2 border-b border-border">
          {chartDays.map((item, idx) => {
            const heightPercent = Math.round((item.val / maxVal) * 100);
            return (
              <div key={idx} className="flex flex-col items-center gap-1.5 flex-1 h-full justify-end group">
                <span className="text-[10px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.val}
                </span>
                <div
                  style={{ height: `${heightPercent}%` }}
                  className="w-full max-w-[28px] rounded-t-lg bg-gradient-to-t from-primary to-secondary transition-all hover:brightness-110"
                />
                <span className="text-[10px] text-muted-foreground font-semibold">Tgl {item.day}</span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Quick Action to Manage Promo */}
      <div className="flex items-center justify-between p-4 rounded-3xl bg-mint/50 border border-primary/20">
        <div>
          <p className="font-bold text-sm text-foreground">Ingin menambah diskon atau reward baru?</p>
          <p className="text-xs text-muted-foreground mt-0.5">Tarik lebih banyak pengunjung pada jam-jam sepi.</p>
        </div>
        <Link
          href="/mitra/promo"
          className="inline-flex items-center gap-1.5 rounded-2xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-xs hover:bg-secondary"
        >
          <Plus className="size-3.5" />
          Kelola Promo
        </Link>
      </div>
    </div>
  );
}
