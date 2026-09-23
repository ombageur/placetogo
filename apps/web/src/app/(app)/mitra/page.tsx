'use client';

import * as React from 'react';
import Link from 'next/link';
import { Building2, ChevronRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FaIcon } from '@/components/ui/font-awesome-icon';

import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';

export default function PortalMitraPage() {
  const { toast } = useToast();
  const [openApplyModal, setOpenApplyModal] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [venueName, setVenueName] = React.useState('');
  const [picName, setPicName] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [city, setCity] = React.useState('Surabaya');
  const [social, setSocial] = React.useState('');

  function handleApplySubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!venueName.trim() || !phone.trim()) {
      toast({
        title: 'Form belum lengkap',
        description: 'Mohon isi minimal nama venue dan nomor WhatsApp.',
        variant: 'error',
      });
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setOpenApplyModal(false);
      setVenueName('');
      setPicName('');
      setPhone('');
      setSocial('');
      toast({
        title: 'Pengajuan Berhasil Dikirim!',
        description: 'Terima kasih! Tim kemitraan placetogo.id akan menghubungi via WhatsApp dalam 1x24 jam.',
        variant: 'success',
      });
    }, 600);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-secondary">
          placetogo.id for Business
        </span>
        <Link
          href="/mitra/dashboard"
          className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
        >
          Masuk ke Dashboard
          <ChevronRight className="size-3.5" />
        </Link>
      </div>

      {/* Hero Banner (Screen 27) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary-strong to-emerald-950 p-6 text-white shadow-xl">
        <div className="relative z-10 flex flex-col gap-3 max-w-md">
          <div className="inline-flex items-center gap-1.5 self-start rounded-full bg-white/20 px-3 py-1 text-xs font-bold backdrop-blur-md">
            <Building2 className="size-3.5 text-secondary" />
            PORTAL MITRA VENUE
          </div>
          <h1 className="leading-tight text-white">
            Lebih banyak pengunjung, lebih banyak cerita.
          </h1>
          <p className="text-xs md:text-sm text-white/80 leading-relaxed">
            Daftarkan cafe, kedai kopi, restoran, atau venue komunitasmu sebagai titik temu resmi placetogo.id.
          </p>
          <div className="pt-3 flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => setOpenApplyModal(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-secondary px-5 py-3 text-xs md:text-sm font-bold text-secondary-foreground shadow-lg transition-transform hover:scale-105 cursor-pointer"
            >
              <FaIcon icon="fa-handshake" className="text-sm" />
              Ajukan Kerja Sama
            </button>
            <Link
              href="/mitra/dashboard"
              className="inline-flex items-center gap-2 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-3 text-xs md:text-sm font-bold text-white transition-colors"
            >
              <FaIcon icon="fa-chart-pie" className="text-xs" />
              Lihat Demo Dashboard
            </Link>
          </div>
        </div>

        {/* Decorative background icons */}
        <div className="absolute -bottom-8 -right-8 text-white/10 pointer-events-none select-none">
          <FaIcon icon="fa-store" className="text-[160px]" />
        </div>
      </div>

      {/* Benefit Mitra (Screen 28 Feature Cards) */}
      <div className="flex flex-col gap-3">
        <h2 className="text-base font-bold text-foreground">Keuntungan Menjadi Mitra</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            {
              title: 'Pasang Promo Menarik',
              desc: 'Tampilkan diskon khusus dan menu spesial bagi komunitas yang nongkrong.',
              icon: 'fa-tags',
              color: 'text-amber-600 bg-amber-100',
            },
            {
              title: 'Berikan Reward Coin',
              desc: 'Tarik pengunjung setia dengan reward Coin saat verifikasi check-in di venue.',
              icon: 'fa-coins',
              color: 'text-warning-soft-foreground bg-warning-soft',
            },
            {
              title: 'Statistik Kunjungan Real-time',
              desc: 'Pantau jumlah kedatangan, jam sibuk, dan interaksi pengguna di venuemu.',
              icon: 'fa-chart-line',
              color: 'text-primary bg-mint',
            },
            {
              title: 'Jangkau Komunitas Baru',
              desc: 'Dapatkan eksposur langsung kepada ribuan pengguna aktif yang mencari tempat hangout.',
              icon: 'fa-users',
              color: 'text-blue-600 bg-blue-100',
            },
          ].map((item, idx) => (
            <Card key={idx} className="flex items-start gap-3.5 p-4 bg-background hover:shadow-md transition-shadow">
              <div className={`flex size-11 items-center justify-center rounded-2xl ${item.color} shrink-0 shadow-xs`}>
                <FaIcon icon={item.icon} className="text-lg" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">{item.title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.desc}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Alur Kemitraan */}
      <Card className="flex flex-col gap-4 p-5 bg-mint/30 border border-primary/20">
        <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          Langkah Mudah Bergabung
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="flex flex-col gap-1 p-3 rounded-2xl bg-background border border-border">
            <span className="flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">1</span>
            <p className="font-bold text-xs text-foreground mt-1">Daftarkan Venue</p>
            <p className="text-[11px] text-muted-foreground">Isi profil lokasi, jam operasional, dan foto venue terbaik.</p>
          </div>
          <div className="flex flex-col gap-1 p-3 rounded-2xl bg-background border border-border">
            <span className="flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">2</span>
            <p className="font-bold text-xs text-foreground mt-1">Atur Promo & Reward</p>
            <p className="text-[11px] text-muted-foreground">Buat tawaran voucher atau alokasikan Coin check-in.</p>
          </div>
          <div className="flex flex-col gap-1 p-3 rounded-2xl bg-background border border-border">
            <span className="flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">3</span>
            <p className="font-bold text-xs text-foreground mt-1">Sambut Komunitas</p>
            <p className="text-[11px] text-muted-foreground">Komunitas mulai berkumpul dan meramaikan tempatmu!</p>
          </div>
        </div>
      </Card>

      {/* Modal Ajukan Kemitraan Venue */}
      <Modal
        open={openApplyModal}
        onClose={() => setOpenApplyModal(false)}
        title="Ajukan Kemitraan Venue"
      >
        <form onSubmit={handleApplySubmit} className="flex flex-col gap-4 text-left p-1">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-foreground">Nama Cafe / Venue *</label>
            <input
              type="text"
              required
              placeholder="Contoh: Kopi Kenangan Tunjungan"
              value={venueName}
              onChange={(e) => setVenueName(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-foreground">Nama PIC / Pengelola</label>
              <input
                type="text"
                placeholder="Contoh: Budi Santoso"
                value={picName}
                onChange={(e) => setPicName(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-foreground">Kota Lokasi *</label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="Surabaya">Surabaya</option>
                <option value="Jakarta">Jakarta</option>
                <option value="Bandung">Bandung</option>
                <option value="Yogyakarta">Yogyakarta</option>
                <option value="Malang">Malang</option>
                <option value="Bali">Bali</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-foreground">No. WhatsApp PIC *</label>
            <input
              type="tel"
              required
              placeholder="Contoh: 081234567890"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-foreground">Instagram / Website (opsional)</label>
            <input
              type="text"
              placeholder="Contoh: @kopikenangan.id"
              value={social}
              onChange={(e) => setSocial(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <Button
              type="submit"
              fullWidth
              size="lg"
              loading={submitting}
              className="font-bold rounded-xl"
            >
              Kirim Pengajuan Kemitraan
            </Button>
            <Button
              type="button"
              variant="ghost"
              fullWidth
              size="sm"
              onClick={() => setOpenApplyModal(false)}
            >
              Batal
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
