'use client';

import Image from 'next/image';

import * as React from 'react';
import Link from 'next/link';
import {
  House,
  CalendarDays,
  Users,
  Store,
  Tag,
  CreditCard,
  ShieldAlert,
  Layers,
  BarChart3,
  Settings,
  Search,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Phone,
  MapPin,
  Calendar,
  Coins,
  Eye,
  RotateCcw,
  QrCode,
  Plus,
  Send,
  ChevronRight,
  Activity,
  DollarSign,
  ArrowRight,
  Lock,
  FileText,
  UserCheck,
  Receipt,
} from 'lucide-react';
import {
  ACTIVITY_CATEGORY_CATALOG,
  type ActivityCategoryId,
} from '@placetogo/shared';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/components/auth/auth-provider';
import { useIsAdmin } from '@/lib/admin-auth';
import { cn } from '@/lib/utils';
import { getCategoryOrInterestImage } from '@/components/activities/category-icons';
import { categoryLabel } from '@/lib/activities/format';

export type AdminMenuKey =
  | 'beranda'
  | 'aktivitas'
  | 'pengguna'
  | 'venue'
  | 'promo'
  | 'pembayaran'
  | 'moderasi'
  | 'konten'
  | 'analitik'
  | 'pengaturan';

interface ActivityDetailRecord {
  id: string;
  title: string;
  category: ActivityCategoryId;
  city: string;
  venueName: string;
  venueAddress: string;
  venuePicPhone: string;
  venueIsOfficial: boolean;
  dateTime: string;
  timeRange: string;
  statusText: 'Menunggu Persetujuan' | 'Sedang Berlangsung' | 'Selesai' | 'Dibatalkan' | 'Siap Berlangsung';
  scheme: 'Patungan' | 'Ditraktir Host' | 'Hadiah/Reward';
  costPerPerson: number;
  totalEscrowAmount: number;
  escrowStatus: 'Menunggu Check-in' | 'Siap Dicairkan' | 'Dana Telah Dicairkan' | 'Refund Selesai';
  host: {
    id: string;
    name: string;
    username: string;
    avatar: string;
    phone: string;
    level: string;
    attendanceRate: number;
    rating: number;
  };
  capacity: { current: number; max: number };
  participants: Array<{
    id: string;
    name: string;
    avatar: string;
    paymentStatus: 'Lunas' | 'Menunggu Pembayaran' | 'Gratis/Ditraktir';
    checkinStatus: 'Hadir di Lokasi' | 'Belum Check-in';
    checkinTime?: string;
    joinedAt: string;
  }>;
  reportCount: number;
  notes?: string;
}

const SAMPLE_ACTIVITIES: ActivityDetailRecord[] = [
  {
    id: 'act_001',
    title: 'Ngobrol Santai & Sharing Karier Tech',
    category: 'ngobrol',
    city: 'Surabaya',
    venueName: 'Titik Koma Coffee & Roastery',
    venueAddress: 'Jl. Juwono No. 2, Darmo, Wonokromo',
    venuePicPhone: '+62 811-3456-789',
    venueIsOfficial: true,
    dateTime: 'Hari ini, 23 Sep 2026',
    timeRange: '19:00 - 21:00 WIB',
    statusText: 'Sedang Berlangsung',
    scheme: 'Patungan',
    costPerPerson: 35000,
    totalEscrowAmount: 140000,
    escrowStatus: 'Menunggu Check-in',
    host: {
      id: 'usr_001',
      name: 'Rahma Anindya',
      username: 'rahmaanindya',
      avatar: '/avatars/cat.webp',
      phone: '+62 812-3456-7890',
      level: 'Level 3 Super Host',
      attendanceRate: 98,
      rating: 4.9,
    },
    capacity: { current: 4, max: 4 },
    participants: [
      {
        id: 'usr_001',
        name: 'Rahma Anindya (Host)',
        avatar: '/avatars/bear.webp',
        paymentStatus: 'Lunas',
        checkinStatus: 'Hadir di Lokasi',
        checkinTime: '18:55 WIB',
        joinedAt: '20 Sep 2026',
      },
      {
        id: 'usr_002',
        name: 'Dimas Wicaksono',
        avatar: '/avatars/fox.webp',
        paymentStatus: 'Lunas',
        checkinStatus: 'Hadir di Lokasi',
        checkinTime: '19:04 WIB',
        joinedAt: '21 Sep 2026',
      },
      {
        id: 'usr_003',
        name: 'Sarah Olivia',
        avatar: '/avatars/owl.webp',
        paymentStatus: 'Lunas',
        checkinStatus: 'Hadir di Lokasi',
        checkinTime: '19:08 WIB',
        joinedAt: '21 Sep 2026',
      },
      {
        id: 'usr_005',
        name: 'Alika Putri',
        avatar: '/avatars/parrot.webp',
        paymentStatus: 'Lunas',
        checkinStatus: 'Belum Check-in',
        joinedAt: '22 Sep 2026',
      },
    ],
    reportCount: 0,
    notes: 'Kupon promo diskon 15% dari Titik Koma otomatis berlaku untuk 4 peserta.',
  },
  {
    id: 'act_002',
    title: 'Jogging Pagi & Sarapan Rame-rame',
    category: 'olahraga',
    city: 'Surabaya',
    venueName: 'Taman Bungkul & Sekitarnya',
    venueAddress: 'Jl. Raya Darmo, Wonokromo',
    venuePicPhone: '+62 812-9988-7766',
    venueIsOfficial: false,
    dateTime: 'Besok, 24 Sep 2026',
    timeRange: '06:00 - 08:30 WIB',
    statusText: 'Menunggu Persetujuan',
    scheme: 'Ditraktir Host',
    costPerPerson: 0,
    totalEscrowAmount: 0,
    escrowStatus: 'Menunggu Check-in',
    host: {
      id: 'usr_002',
      name: 'Dimas Wicaksono',
      username: 'dimas_w',
      avatar: '/avatars/panda.webp',
      phone: '+62 856-7890-1234',
      level: 'Level 2',
      attendanceRate: 95,
      rating: 4.8,
    },
    capacity: { current: 3, max: 6 },
    participants: [
      {
        id: 'usr_002',
        name: 'Dimas Wicaksono',
        avatar: '/avatars/frog.webp',
        paymentStatus: 'Gratis/Ditraktir',
        checkinStatus: 'Belum Check-in',
        joinedAt: '22 Sep 2026',
      },
      {
        id: 'usr_004',
        name: 'Rian Pratama',
        avatar: '/avatars/raccoon.webp',
        paymentStatus: 'Gratis/Ditraktir',
        checkinStatus: 'Belum Check-in',
        joinedAt: '22 Sep 2026',
      },
    ],
    reportCount: 1,
    notes: 'Ada 1 laporan catatan mengenai lokasi yang perlu diverifikasi izin pengelola taman.',
  },
  {
    id: 'act_003',
    title: 'Nonton Film Indie & Diskusi Sinema',
    category: 'film',
    city: 'Malang',
    venueName: 'Dua Meja Boardgame & Cinema Corner',
    venueAddress: 'Jl. Soekarno Hatta No. 88, Lowokwaru',
    venuePicPhone: '+62 857-1122-3344',
    venueIsOfficial: true,
    dateTime: 'Kemarin, 22 Sep 2026',
    timeRange: '18:30 - 21:00 WIB',
    statusText: 'Selesai',
    scheme: 'Patungan',
    costPerPerson: 50000,
    totalEscrowAmount: 200000,
    escrowStatus: 'Dana Telah Dicairkan',
    host: {
      id: 'usr_003',
      name: 'Sarah Olivia',
      username: 'sarah_olivia',
      avatar: '/avatars/koala.webp',
      phone: '+62 821-4567-8901',
      level: 'Level 3 Super Host',
      attendanceRate: 100,
      rating: 5.0,
    },
    capacity: { current: 4, max: 4 },
    participants: [
      {
        id: 'usr_003',
        name: 'Sarah Olivia (Host)',
        avatar: '/avatars/penguin.webp',
        paymentStatus: 'Lunas',
        checkinStatus: 'Hadir di Lokasi',
        checkinTime: '18:25 WIB',
        joinedAt: '19 Sep 2026',
      },
      {
        id: 'usr_001',
        name: 'Rahma Anindya',
        avatar: '/avatars/rabbit.webp',
        paymentStatus: 'Lunas',
        checkinStatus: 'Hadir di Lokasi',
        checkinTime: '18:30 WIB',
        joinedAt: '19 Sep 2026',
      },
    ],
    reportCount: 0,
    notes: 'Pertemuan sukses 100% check-in, dana Rp200.000 telah dilepas ke kasir venue & host.',
  },
];

export function AdminDashboardView() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentMenu, setCurrentMenu] = React.useState<AdminMenuKey>('beranda');

  // Selected Activity for Full Lifecycle Modal
  const [selectedActivity, setSelectedActivity] = React.useState<ActivityDetailRecord | null>(null);
  const [activityModalOpen, setActivityModalOpen] = React.useState(false);

  // Filter & search states
  const [activitySearch, setActivitySearch] = React.useState('');
  const [activityFilterStatus, setActivityFilterStatus] = React.useState<string>('all');

  // Verify Admin Access
  const isSuperAdmin = useIsAdmin();

  function handleOpenActivityDetail(activity: ActivityDetailRecord) {
    setSelectedActivity(activity);
    setActivityModalOpen(true);
  }

  function handleApproveActivity(activityId: string) {
    toast({
      title: 'Aktivitas Disetujui & Diterbitkan',
      description: 'Ajakan kini aktif dan peserta dapat bergabung serta melakukan pembayaran.',
      variant: 'success',
    });
    if (selectedActivity && selectedActivity.id === activityId) {
      setSelectedActivity({ ...selectedActivity, statusText: 'Siap Berlangsung' });
    }
  }

  function handleSettleEscrow(activityId: string) {
    toast({
      title: 'Dana & Coin Berhasil Diselesaikan',
      description: 'Dana escrow telah dicairkan ke Host dan reward Coin telah didistribusikan ke peserta.',
      variant: 'success',
    });
    if (selectedActivity && selectedActivity.id === activityId) {
      setSelectedActivity({ ...selectedActivity, escrowStatus: 'Dana Telah Dicairkan', statusText: 'Selesai' });
    }
  }

  function handleCancelAndRefund(activityId: string) {
    toast({
      title: 'Aktivitas Dibatalkan & Refund Diproses',
      description: 'Seluruh dana peserta dikembalikan otomatis 100% ke saldo Dompet / Rekening asal.',
      variant: 'error',
    });
    if (selectedActivity && selectedActivity.id === activityId) {
      setSelectedActivity({ ...selectedActivity, escrowStatus: 'Refund Selesai', statusText: 'Dibatalkan' });
    }
  }

  // --- ACCESS CONTROL SCREEN ---
  if (!isSuperAdmin) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 bg-white rounded-3xl border border-border">
        <div className="size-16 rounded-3xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mb-4 shadow-sm">
          <Lock className="size-8" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Akses Admin Terbatas</h2>
        <p className="text-sm text-muted-foreground max-w-md mt-1.5 leading-relaxed">
          Halaman ini hanya dapat diakses oleh Administrator resmi placetogo.id. Akun Anda (
          <strong className="text-foreground">{user?.email || 'Guest / Non-Admin'}</strong>) tidak terdaftar dalam daftar
          otorisasi sistem.
        </p>

        <div className="flex flex-wrap gap-2.5 mt-6">
          <Link href="/">
            <Button variant="secondary" size="md">
              Kembali ke Beranda
            </Button>
          </Link>
          <Button
            variant="primary"
            size="md"
            onClick={() => {
              toast({
                title: 'Info Hak Akses',
                description: 'Silakan login menggunakan email berdomain @placetogo.id atau hubungi tim Super Admin.',
                variant: 'info',
              });
            }}
          >
            Hubungi Super Admin
          </Button>
        </div>
      </div>
    );
  }

  // --- DESKTOP ADMIN LAYOUT ---
  return (
    <div className="flex flex-col gap-6 pb-20 w-full min-h-screen">
      {/* Top Console Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-3xl bg-primary text-white shadow-md">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
            <ShieldCheck className="size-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-white/80">Pusat Kendali</span>
              <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-bold text-white border border-white/20">
                Super Admin
              </span>
            </div>
            <h1 className="text-lg text-white">Admin Console placetogo.id</h1>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end md:self-auto">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-white">{user?.email}</p>
            <p className="text-[11px] text-white/70">Waktu Server: 23 Sep 2026, 10:45 WIB</p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              toast({
                title: 'Data Tersinkronisasi',
                description: 'Seluruh metrik pertemuan, check-in, dan transaksi telah diperbarui.',
                variant: 'success',
              });
            }}
            className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs font-semibold gap-1.5"
          >
            <RotateCcw className="size-3.5" />
            Sync Real-time
          </Button>
        </div>
      </div>

      {/* Main Admin Workspace (Sidebar Navigation + Dynamic Work Area) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ========================================================================= */}
        {/* SIDEBAR MENU (10 Navigation Items)                                        */}
        {/* ========================================================================= */}
        <div className="lg:col-span-3 flex flex-col gap-1.5 p-3 bg-white rounded-3xl border border-border shadow-xs sticky top-4">
          <span className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
            Menu Operasional
          </span>

          {[
            { key: 'beranda' as AdminMenuKey, label: 'Beranda', icon: House, badge: undefined },
            {
              key: 'aktivitas' as AdminMenuKey,
              label: 'Aktivitas',
              icon: CalendarDays,
              badge: '3 Pengajuan',
              badgeColor: 'warning',
            },
            { key: 'pengguna' as AdminMenuKey, label: 'Pengguna & Host', icon: Users, badge: undefined },
            {
              key: 'venue' as AdminMenuKey,
              label: 'Venue & Mitra',
              icon: Store,
              badge: '2 Mitra Baru',
              badgeColor: 'warning',
            },
            { key: 'promo' as AdminMenuKey, label: 'Promo & Coin', icon: Tag, badge: undefined },
            {
              key: 'pembayaran' as AdminMenuKey,
              label: 'Pembayaran & Escrow',
              icon: CreditCard,
              badge: '4 Tertahan',
              badgeColor: 'warning',
            },
            {
              key: 'moderasi' as AdminMenuKey,
              label: 'Moderasi Komunitas',
              icon: ShieldAlert,
              badge: '2 Laporan',
              badgeColor: 'danger',
            },
            { key: 'konten' as AdminMenuKey, label: 'Konten & Kategori', icon: Layers, badge: undefined },
            { key: 'analitik' as AdminMenuKey, label: 'Analitik Bisnis', icon: BarChart3, badge: undefined },
            { key: 'pengaturan' as AdminMenuKey, label: 'Pengaturan & Hak Akses', icon: Settings, badge: undefined },
          ].map((menuItem) => {
            const Icon = menuItem.icon;
            const active = currentMenu === menuItem.key;
            return (
              <button
                key={menuItem.key}
                type="button"
                onClick={() => setCurrentMenu(menuItem.key)}
                className={cn(
                  'flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs md:text-sm font-semibold transition-all cursor-pointer text-left',
                  active
                    ? 'bg-primary text-white shadow-xs font-bold'
                    : 'text-foreground hover:bg-muted/70 hover:text-primary',
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={cn('size-4', active ? 'text-white' : 'text-muted-foreground')} />
                  <span>{menuItem.label}</span>
                </div>
                {menuItem.badge && (
                  <span
                    className={cn(
                      'px-1.5 py-0.5 rounded-md text-[10px] font-extrabold',
                      active
                        ? 'bg-white/20 text-white'
                        : menuItem.badgeColor === 'danger'
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-amber-100 text-amber-800',
                    )}
                  >
                    {menuItem.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ========================================================================= */}
        {/* MAIN WORK AREA                                                            */}
        {/* ========================================================================= */}
        <div className="lg:col-span-9 flex flex-col gap-6">
          {/* ========================================================================= */}
          {/* VIEW: BERANDA                                                             */}
          {/* ========================================================================= */}
          {currentMenu === 'beranda' && (
            <div className="flex flex-col gap-6">
              {/* 1. KOTAK PERLU TINDAKAN (TOP PRIORITY AT THE VERY TOP) */}
              <div className="rounded-3xl bg-amber-50/80 border-2 border-amber-300 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="flex size-3 rounded-full bg-amber-500 animate-pulse" />
                    <h2 className="text-sm md:text-base font-extrabold text-amber-950 flex items-center gap-1.5">
                      <AlertTriangle className="size-4 text-amber-600" />
                      Perlu Tindakan Mendesak
                    </h2>
                  </div>
                  <span className="text-xs font-bold text-amber-900 bg-amber-200/70 px-2.5 py-0.5 rounded-full">
                    11 Pekerjaan Menunggu
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <button
                    type="button"
                    onClick={() => setCurrentMenu('aktivitas')}
                    className="p-3.5 rounded-2xl bg-white border border-amber-200 hover:border-amber-400 text-left transition-all hover:shadow-xs cursor-pointer flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase text-amber-800">Aktivitas Menunggu</span>
                        <CalendarDays className="size-3.5 text-amber-600" />
                      </div>
                      <p className="text-xl font-extrabold text-amber-950 mt-1">3 Pengajuan</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Ajakan berbayar & khusus butuh review.</p>
                    </div>
                    <span className="text-[11px] font-bold text-primary flex items-center gap-1 mt-2.5 group-hover:underline">
                      Tinjau Sekarang <ArrowRight className="size-3" />
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentMenu('moderasi')}
                    className="p-3.5 rounded-2xl bg-white border border-rose-200 hover:border-rose-400 text-left transition-all hover:shadow-xs cursor-pointer flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase text-rose-800">Laporan Pengguna</span>
                        <ShieldAlert className="size-3.5 text-rose-600" />
                      </div>
                      <p className="text-xl font-extrabold text-rose-950 mt-1">2 Laporan</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Pelecehan chat & spam komunitas.</p>
                    </div>
                    <span className="text-[11px] font-bold text-rose-700 flex items-center gap-1 mt-2.5 group-hover:underline">
                      Moderasi <ArrowRight className="size-3" />
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentMenu('pembayaran')}
                    className="p-3.5 rounded-2xl bg-white border border-amber-200 hover:border-amber-400 text-left transition-all hover:shadow-xs cursor-pointer flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase text-amber-800">Klaim & Penarikan</span>
                        <Coins className="size-3.5 text-coin" />
                      </div>
                      <p className="text-xl font-extrabold text-amber-950 mt-1">4 Permintaan</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Rp4.200.000 payout host tertahan.</p>
                    </div>
                    <span className="text-[11px] font-bold text-primary flex items-center gap-1 mt-2.5 group-hover:underline">
                      Proses Pencairan <ArrowRight className="size-3" />
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentMenu('venue')}
                    className="p-3.5 rounded-2xl bg-white border border-amber-200 hover:border-amber-400 text-left transition-all hover:shadow-xs cursor-pointer flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase text-amber-800">Pengajuan Venue</span>
                        <Store className="size-3.5 text-amber-600" />
                      </div>
                      <p className="text-xl font-extrabold text-amber-950 mt-1">2 Mitra Cafe</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Pendaftaran titik temu cafe baru.</p>
                    </div>
                    <span className="text-[11px] font-bold text-primary flex items-center gap-1 mt-2.5 group-hover:underline">
                      Verifikasi Mitra <ArrowRight className="size-3" />
                    </span>
                  </button>
                </div>
              </div>

              {/* 2. RINGKASAN HARI INI */}
              <div className="flex flex-col gap-3">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Activity className="size-4 text-primary" />
                  Ringkasan Operasional Hari Ini (23 Sep 2026)
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Card className="p-3.5 flex flex-col justify-between">
                    <span className="text-[11px] text-muted-foreground font-semibold">Aktivitas Berlangsung</span>
                    <p className="text-2xl font-extrabold text-foreground mt-1">18 Acara</p>
                    <span className="text-[10px] text-emerald-600 font-bold mt-1">Live di 4 kota</span>
                  </Card>

                  <Card className="p-3.5 flex flex-col justify-between">
                    <span className="text-[11px] text-muted-foreground font-semibold">Peserta Terdaftar</span>
                    <p className="text-2xl font-extrabold text-foreground mt-1">84 Orang</p>
                    <span className="text-[10px] text-emerald-600 font-bold mt-1">96% kapasitas terisi</span>
                  </Card>

                  <Card className="p-3.5 flex flex-col justify-between">
                    <span className="text-[11px] text-muted-foreground font-semibold">Check-in Berhasil</span>
                    <p className="text-2xl font-extrabold text-emerald-700 mt-1">76 Check-in</p>
                    <span className="text-[10px] text-emerald-600 font-bold mt-1">90.4% tingkat hadir</span>
                  </Card>

                  <Card className="p-3.5 flex flex-col justify-between">
                    <span className="text-[11px] text-muted-foreground font-semibold">Aktivitas Selesai</span>
                    <p className="text-2xl font-extrabold text-foreground mt-1">12 Selesai</p>
                    <span className="text-[10px] text-primary font-bold mt-1">Dana telah dilepas</span>
                  </Card>
                </div>
              </div>

              {/* 3. AKTIVITAS BERLANGSUNG (LIVE MONITOR TABLE) */}
              <Card className="p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Aktivitas Berlangsung & Monitor Live</h3>
                    <p className="text-xs text-muted-foreground">
                      Pantau jam mulai, venue, host, kuota peserta, dan check-in secara real-time.
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setCurrentMenu('aktivitas')}
                    className="text-xs gap-1"
                  >
                    Semua Aktivitas <ChevronRight className="size-3" />
                  </Button>
                </div>

                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/60 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border">
                      <tr>
                        <th className="px-3.5 py-2.5 font-bold">Waktu & Kategori</th>
                        <th className="px-3.5 py-2.5 font-bold">Judul & Venue</th>
                        <th className="px-3.5 py-2.5 font-bold">Host</th>
                        <th className="px-3.5 py-2.5 font-bold">Kuota & Check-in</th>
                        <th className="px-3.5 py-2.5 font-bold">Status Acara</th>
                        <th className="px-3.5 py-2.5 font-bold text-right">Alur Lengkap</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-white">
                      {SAMPLE_ACTIVITIES.map((act) => {
                        const checkedInCount = act.participants.filter((p) => p.checkinStatus === 'Hadir di Lokasi').length;
                        return (
                          <tr key={act.id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-3.5 py-2.5 whitespace-nowrap">
                              <span className="font-bold text-foreground block">{act.timeRange}</span>
                              <span className="text-[10px] text-muted-foreground">
                                {categoryLabel(act.category)}
                              </span>
                            </td>

                            <td className="px-3.5 py-2.5">
                              <span className="font-bold text-foreground block">{act.title}</span>
                              <span className="text-[11px] text-primary flex items-center gap-1">
                                <Store className="size-3" /> {act.venueName}
                              </span>
                            </td>

                            <td className="px-3.5 py-2.5 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <Image
                                  src={act.host.avatar}
                                  alt={act.host.name}
                                  width={24}
                                  height={24}
                                  className="size-6 rounded-full border border-border object-cover"
                                />
                                <span className="font-semibold text-foreground">{act.host.name}</span>
                              </div>
                            </td>

                            <td className="px-3.5 py-2.5 whitespace-nowrap">
                              <div className="flex flex-col gap-0.5">
                                <span className="font-bold text-foreground">
                                  {act.capacity.current}/{act.capacity.max} Peserta
                                </span>
                                <span className="text-[10px] font-bold text-emerald-700">
                                  {checkedInCount}/{act.capacity.current} Hadir di Lokasi
                                </span>
                              </div>
                            </td>

                            <td className="px-3.5 py-2.5 whitespace-nowrap">
                              <span
                                className={cn(
                                  'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold border',
                                  act.statusText === 'Sedang Berlangsung'
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                    : act.statusText === 'Menunggu Persetujuan'
                                      ? 'bg-amber-50 text-amber-800 border-amber-300'
                                      : act.statusText === 'Selesai'
                                        ? 'bg-slate-100 text-slate-800 border-slate-300'
                                        : 'bg-rose-50 text-rose-800 border-rose-300',
                                )}
                              >
                                {act.statusText}
                              </span>
                            </td>

                            <td className="px-3.5 py-2.5 text-right whitespace-nowrap">
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleOpenActivityDetail(act)}
                                className="text-xs h-7 px-2.5 font-bold text-primary gap-1"
                              >
                                <Eye className="size-3" /> Detail Alur
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* 4. TRANSAKSI & VENUE/PROMOSI DUA KOLOM */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Transaksi Summary */}
                <Card className="p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between border-b border-border pb-2">
                    <h3 className="text-xs md:text-sm font-bold text-foreground flex items-center gap-1.5">
                      <CreditCard className="size-4 text-primary" />
                      Arus Transaksi & Escrow
                    </h3>
                    <button
                      type="button"
                      onClick={() => setCurrentMenu('pembayaran')}
                      className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
                    >
                      Buka Pembayaran
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="p-2.5 rounded-xl bg-muted/50 border border-border/70">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold">Pembayaran Masuk</span>
                      <p className="text-sm font-extrabold text-foreground mt-0.5">Rp14.800.000</p>
                      <span className="text-[10px] text-emerald-600 font-semibold">+18.2% minggu ini</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200">
                      <span className="text-[10px] text-amber-800 uppercase font-bold">Dana Escrow Tertahan</span>
                      <p className="text-sm font-extrabold text-amber-950 mt-0.5">Rp8.400.000</p>
                      <span className="text-[10px] text-amber-700 font-semibold">Menunggu event selesai</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200">
                      <span className="text-[10px] text-rose-800 uppercase font-bold">Refund Peserta</span>
                      <p className="text-sm font-extrabold text-rose-950 mt-0.5">Rp650.000</p>
                      <span className="text-[10px] text-rose-700 font-semibold">3 transaksi dibatalkan</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                      <span className="text-[10px] text-emerald-800 uppercase font-bold">Penarikan Host (Payout)</span>
                      <p className="text-sm font-extrabold text-emerald-950 mt-0.5">Rp18.200.000</p>
                      <span className="text-[10px] text-emerald-700 font-semibold">142 penarikan selesai</span>
                    </div>
                  </div>
                </Card>

                {/* Venue & Promosi Summary */}
                <Card className="p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between border-b border-border pb-2">
                    <h3 className="text-xs md:text-sm font-bold text-foreground flex items-center gap-1.5">
                      <Store className="size-4 text-primary" />
                      Venue & Anggaran Promosi
                    </h3>
                    <button
                      type="button"
                      onClick={() => setCurrentMenu('promo')}
                      className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
                    >
                      Kelola Kampanye
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="p-2.5 rounded-xl bg-muted/50 border border-border/70">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold">Venue Mitra Aktif</span>
                      <p className="text-sm font-extrabold text-foreground mt-0.5">128 Lokasi</p>
                      <span className="text-[10px] text-primary font-semibold">Surabaya & Malang</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-muted/50 border border-border/70">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold">Promo Berjalan</span>
                      <p className="text-sm font-extrabold text-foreground mt-0.5">24 Kampanye</p>
                      <span className="text-[10px] text-emerald-600 font-semibold">Diskon 10% - 20%</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200">
                      <span className="text-[10px] text-amber-800 uppercase font-bold">Sisa Saldo Kampanye</span>
                      <p className="text-sm font-extrabold text-amber-950 mt-0.5">Rp35.000.000</p>
                      <span className="text-[10px] text-amber-700 font-semibold">Budget kuartal ini</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-yellow-50 border border-yellow-200">
                      <span className="text-[10px] text-yellow-800 uppercase font-bold">Coin Reward Diberikan</span>
                      <p className="text-sm font-extrabold text-yellow-950 mt-0.5">1.240.000 Coin</p>
                      <span className="text-[10px] text-yellow-700 font-semibold">Reward check-in</span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* VIEW: AKTIVITAS (WITH FULL LIFECYCLE CONTROLS)                             */}
          {/* ========================================================================= */}
          {currentMenu === 'aktivitas' && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Cari judul ajakan, venue, host..."
                    value={activitySearch}
                    onChange={(e) => setActivitySearch(e.target.value)}
                    className="w-full pl-9.5 pr-4 py-2 text-xs md:text-sm rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
                  {['all', 'Menunggu Persetujuan', 'Sedang Berlangsung', 'Selesai', 'Dibatalkan'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setActivityFilterStatus(st)}
                      className={cn(
                        'px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all cursor-pointer',
                        activityFilterStatus === st
                          ? 'bg-primary text-white border-primary shadow-xs'
                          : 'bg-white text-muted-foreground border-border hover:bg-muted',
                      )}
                    >
                      {st === 'all' ? 'Semua Status' : st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Activity Cards List */}
              <div className="grid grid-cols-1 gap-3.5">
                {SAMPLE_ACTIVITIES.filter((act) => {
                  const matchQ =
                    act.title.toLowerCase().includes(activitySearch.toLowerCase()) ||
                    act.venueName.toLowerCase().includes(activitySearch.toLowerCase()) ||
                    act.host.name.toLowerCase().includes(activitySearch.toLowerCase());
                  if (!matchQ) return false;
                  if (activityFilterStatus !== 'all' && act.statusText !== activityFilterStatus) return false;
                  return true;
                }).map((act) => {
                  const checkedInCount = act.participants.filter((p) => p.checkinStatus === 'Hadir di Lokasi').length;
                  return (
                    <Card key={act.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-3.5">
                        <div className="size-12 shrink-0 overflow-hidden rounded-2xl border border-border bg-mint">
                          <Image
                            src={getCategoryOrInterestImage(act.category)}
                            alt=""
                            width={48}
                            height={48}
                            className="size-full object-contain"
                          />
                        </div>
                        <div className="flex flex-col">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-bold text-sm md:text-base text-foreground">{act.title}</h4>
                            <span
                              className={cn(
                                'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold border',
                                act.statusText === 'Sedang Berlangsung'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                  : act.statusText === 'Menunggu Persetujuan'
                                    ? 'bg-amber-50 text-amber-800 border-amber-300'
                                    : act.statusText === 'Selesai'
                                      ? 'bg-slate-100 text-slate-800 border-slate-300'
                                      : 'bg-rose-50 text-rose-800 border-rose-300',
                              )}
                            >
                              {act.statusText}
                            </span>
                            <Badge variant="neutral" className="text-[10px]">
                              Skema: {act.scheme}
                            </Badge>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1">
                            <span className="flex items-center gap-1 font-medium text-foreground">
                              <Store className="size-3 text-primary" /> {act.venueName} ({act.city})
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="size-3" /> {act.dateTime} ({act.timeRange})
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Users className="size-3" /> Host: <strong>{act.host.name}</strong>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-border">
                        <div className="text-left md:text-right">
                          <p className="text-xs font-bold text-foreground">
                            {act.capacity.current}/{act.capacity.max} Peserta ({checkedInCount} Hadir)
                          </p>
                          <p className="text-[11px] text-emerald-700 font-semibold">
                            Escrow: Rp{act.totalEscrowAmount.toLocaleString('id-ID')}
                          </p>
                        </div>

                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleOpenActivityDetail(act)}
                          className="text-xs font-bold gap-1.5 shadow-sm"
                        >
                          <FileText className="size-3.5" />
                          Buka Alur Lengkap
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* VIEW: PENGGUNA & HOST                                                     */}
          {/* ========================================================================= */}
          {currentMenu === 'pengguna' && (
            <Card className="p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-foreground">Pengguna & Host Terdaftar</h3>
                  <p className="text-xs text-muted-foreground">
                    Verifikasi identitas KTP/Selfie, kelola saldo coin, penarikan host, dan riwayat sanksi.
                  </p>
                </div>
                <Badge variant="success" className="text-xs">
                  14.820 Akun Aktif
                </Badge>
              </div>

              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/60 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border">
                    <tr>
                      <th className="px-3.5 py-2.5 font-bold">Pengguna</th>
                      <th className="px-3.5 py-2.5 font-bold">Status Verifikasi</th>
                      <th className="px-3.5 py-2.5 font-bold">Dompet Coin & Penghasilan</th>
                      <th className="px-3.5 py-2.5 font-bold">Aktivitas & Kehadiran</th>
                      <th className="px-3.5 py-2.5 font-bold text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-white">
                    {[
                      {
                        name: 'Rahma Anindya',
                        username: 'rahmaanindya',
                        email: 'rahma.anindya@gmail.com',
                        phone: '+62 812-3456-7890',
                        badge: 'Level 3 Super Host',
                        city: 'Surabaya',
                        verified: true,
                        coin: 75000,
                        earnings: 125000,
                        hosted: 14,
                        joined: 28,
                        rate: 98,
                      },
                      {
                        name: 'Dimas Wicaksono',
                        username: 'dimas_w',
                        email: 'dimas.w@yahoo.com',
                        phone: '+62 856-7890-1234',
                        badge: 'Level 2 Host',
                        city: 'Surabaya',
                        verified: true,
                        coin: 24000,
                        earnings: 45000,
                        hosted: 6,
                        joined: 19,
                        rate: 95,
                      },
                      {
                        name: 'Sarah Olivia',
                        username: 'sarah_olivia',
                        email: 'sarah.o@gmail.com',
                        phone: '+62 821-4567-8901',
                        badge: 'Level 3 Super Host',
                        city: 'Malang',
                        verified: true,
                        coin: 98000,
                        earnings: 320000,
                        hosted: 22,
                        joined: 31,
                        rate: 100,
                      },
                    ].map((u) => (
                      <tr key={u.username} className="hover:bg-muted/30">
                        <td className="px-3.5 py-2.5">
                          <strong className="text-foreground block">{u.name}</strong>
                          <span className="text-[11px] text-muted-foreground">@{u.username} • {u.city}</span>
                        </td>
                        <td className="px-3.5 py-2.5">
                          <Badge variant="success" className="text-[10px]">
                            ✓ Terverifikasi KTP
                          </Badge>
                          <span className="block text-[10px] text-primary font-semibold mt-0.5">{u.badge}</span>
                        </td>
                        <td className="px-3.5 py-2.5">
                          <span className="text-xs font-bold text-amber-800 block">
                            {u.coin.toLocaleString('id-ID')} Coin
                          </span>
                          <span className="text-[11px] text-emerald-700 font-semibold">
                            Rp{u.earnings.toLocaleString('id-ID')} (Penghasilan)
                          </span>
                        </td>
                        <td className="px-3.5 py-2.5">
                          <span className="text-xs font-semibold block">{u.hosted} Buat • {u.joined} Ikut</span>
                          <span className="text-[10px] text-primary font-bold">{u.rate}% Tingkat Hadir</span>
                        </td>
                        <td className="px-3.5 py-2.5 text-right">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              toast({
                                title: `Audit Pengguna: ${u.name}`,
                                description: 'Profil dan catatan log pengguna terbuka.',
                                variant: 'info',
                              });
                            }}
                            className="text-xs h-7 px-2.5"
                          >
                            Kelola Akun
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* ========================================================================= */}
          {/* VIEW: VENUE & MITRA                                                       */}
          {/* ========================================================================= */}
          {currentMenu === 'venue' && (
            <Card className="p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-foreground">Klaim Tempat & Data Mitra Resmi</h3>
                  <p className="text-xs text-muted-foreground">
                    Verifikasi pengajuan cafe baru, kelola QR Spot check-in, dan atur komisi diskon komunitas.
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    toast({
                      title: 'Tambah Mitra',
                      description: 'Form pendaftaran mitra baru dibuka.',
                      variant: 'info',
                    });
                  }}
                  className="text-xs gap-1.5"
                >
                  <Plus className="size-3.5" /> Tambah Mitra
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {[
                  {
                    name: 'Titik Koma Coffee & Roastery',
                    city: 'Surabaya',
                    address: 'Jl. Juwono No. 2, Darmo, Wonokromo',
                    pic: 'Hendra Setiawan (+62 811-3456-789)',
                    promo: 'Diskon 15% All Beverage',
                    checkins: 184,
                    statusText: 'Terverifikasi Official Spot',
                  },
                  {
                    name: 'Kroma Creative Space & Cafe',
                    city: 'Surabaya',
                    address: 'Jl. Panglima Sudirman No. 45',
                    pic: 'Maya Kusuma (+62 812-9988-7766)',
                    promo: 'Free 1 Jam Private Room',
                    checkins: 210,
                    statusText: 'Terverifikasi Official Spot',
                  },
                  {
                    name: 'Kopi Toko Djawa Heritage',
                    city: 'Bandung',
                    address: 'Jl. Braga No. 81',
                    pic: 'Asep Ridwan (+62 813-2233-4455)',
                    promo: 'Diskon 10% Pastry',
                    checkins: 0,
                    statusText: 'Menunggu Persetujuan',
                  },
                ].map((m) => (
                  <div key={m.name} className="p-3.5 rounded-2xl bg-white border border-border flex flex-col justify-between gap-3 shadow-2xs">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-bold text-sm text-foreground">{m.name}</h4>
                        <Badge
                          variant={m.statusText.includes('Official') ? 'success' : 'warning'}
                          className="text-[10px] shrink-0"
                        >
                          {m.statusText}
                        </Badge>
                      </div>
                      <p className="text-xs text-primary font-medium mt-0.5">{m.city} • {m.address}</p>
                      <p className="text-[11px] text-muted-foreground mt-1">PIC: {m.pic}</p>
                    </div>

                    <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-semibold flex items-center justify-between">
                      <span>Promo: {m.promo}</span>
                      <span className="text-[10px] text-amber-700">{m.checkins} check-in bln ini</span>
                    </div>

                    <div className="flex justify-end gap-2 pt-1 border-t border-border">
                      {m.statusText === 'Menunggu Persetujuan' && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            toast({
                              title: 'Mitra Disetujui',
                              description: `${m.name} resmi menjadi Titik Temu terdaftar.`,
                              variant: 'success',
                            });
                          }}
                          className="text-xs h-7 px-2.5 bg-emerald-600 hover:bg-emerald-700"
                        >
                          Setujui Mitra
                        </Button>
                      )}
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          toast({
                            title: 'QR Spot Generated',
                            description: `QR Code Check-in untuk ${m.name} siap dicetak.`,
                            variant: 'success',
                          });
                        }}
                        className="text-xs h-7 px-2.5 gap-1"
                      >
                        <QrCode className="size-3.5" /> QR Spot
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* ========================================================================= */}
          {/* VIEW: PROMO & COIN                                                        */}
          {/* ========================================================================= */}
          {currentMenu === 'promo' && (
            <Card className="p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-foreground">Promo & Anggaran Kampanye Coin</h3>
                  <p className="text-xs text-muted-foreground">
                    Pantau alokasi budget reward, subsidi voucher mitra, dan riwayat klaim koin.
                  </p>
                </div>
                <span className="text-xs font-bold text-amber-900 bg-amber-100 px-3 py-1 rounded-full">
                  Total Budget: Rp50.000.000
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200">
                  <span className="text-[10px] text-amber-800 uppercase font-bold">Saldo Kampanye Aktif</span>
                  <p className="text-xl font-extrabold text-amber-950 mt-1">Rp35.000.000</p>
                  <span className="text-[10px] text-amber-700">70% sisa anggaran Q3</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-yellow-50 border border-yellow-200">
                  <span className="text-[10px] text-yellow-800 uppercase font-bold">Coin Diberikan</span>
                  <p className="text-xl font-extrabold text-yellow-950 mt-1">1.240.000 Coin</p>
                  <span className="text-[10px] text-yellow-700">Setara Rp12.400.000</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200">
                  <span className="text-[10px] text-emerald-800 uppercase font-bold">Voucher Diklaim</span>
                  <p className="text-xl font-extrabold text-emerald-950 mt-1">842 Voucher</p>
                  <span className="text-[10px] text-emerald-700">Di 48 mitra cafe aktif</span>
                </div>
              </div>
            </Card>
          )}

          {/* ========================================================================= */}
          {/* VIEW: PEMBAYARAN & ESCROW                                                 */}
          {/* ========================================================================= */}
          {currentMenu === 'pembayaran' && (
            <Card className="p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-foreground">Pembayaran, Escrow & Penarikan Dana</h3>
                  <p className="text-xs text-muted-foreground">
                    Audit arus kas sistem, pelepasan dana escrow pasca-checkin, refund, dan penarikan host.
                  </p>
                </div>
                <Badge variant="warning" className="text-xs">
                  4 Permintaan Payout Tertahan
                </Badge>
              </div>

              <div className="flex flex-col gap-3">
                {[
                  {
                    id: 'wd_001',
                    hostName: 'Sarah Olivia',
                    bank: 'BCA (1234567890)',
                    amount: 320000,
                    statusText: 'Menunggu Persetujuan',
                    date: '23 Sep 2026, 09:12 WIB',
                  },
                  {
                    id: 'wd_002',
                    hostName: 'Dimas Wicaksono',
                    bank: 'GoPay (085678901234)',
                    amount: 45000,
                    statusText: 'Menunggu Persetujuan',
                    date: '23 Sep 2026, 08:30 WIB',
                  },
                  {
                    id: 'wd_003',
                    hostName: 'Rahma Anindya',
                    bank: 'Mandiri (9876543210)',
                    amount: 125000,
                    statusText: 'Selesai Ditransfer',
                    date: '22 Sep 2026, 14:00 WIB',
                  },
                ].map((wd) => (
                  <div key={wd.id} className="p-3.5 rounded-2xl bg-white border border-border flex items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-foreground">{wd.hostName}</span>
                        <Badge
                          variant={wd.statusText === 'Selesai Ditransfer' ? 'success' : 'warning'}
                          className="text-[10px]"
                        >
                          {wd.statusText}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Rekening Tujuan: <strong>{wd.bank}</strong> • {wd.date}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-sm font-extrabold text-emerald-700">
                          Rp{wd.amount.toLocaleString('id-ID')}
                        </span>
                        <span className="block text-[10px] text-muted-foreground">Penghasilan Hadiah</span>
                      </div>

                      {wd.statusText === 'Menunggu Persetujuan' && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            toast({
                              title: 'Penarikan Disetujui & Dikirim',
                              description: `Dana Rp${wd.amount.toLocaleString('id-ID')} berhasil ditransfer ke ${wd.hostName}.`,
                              variant: 'success',
                            });
                          }}
                          className="text-xs h-8 px-3 bg-emerald-600 hover:bg-emerald-700"
                        >
                          Transfer Dana
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* ========================================================================= */}
          {/* VIEW: MODERASI KOMUNITAS                                                  */}
          {/* ========================================================================= */}
          {currentMenu === 'moderasi' && (
            <Card className="p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-foreground">Dasbor Moderasi Komunitas & Chat</h3>
                  <p className="text-xs text-muted-foreground">
                    Tangani laporan pelecehan, SARA, spam promosi, dan peserta no-show.
                  </p>
                </div>
                <Badge variant="danger" className="text-xs">
                  2 Laporan Belum Ditindak
                </Badge>
              </div>

              <div className="flex flex-col gap-3">
                {[
                  {
                    id: 'rep_101',
                    category: 'Pelecehan / Harassment',
                    target: 'Pengguna (@rian_pratama99)',
                    reporter: 'Dimas Wicaksono (@dimas_w)',
                    reason: 'Mengirimkan pesan tidak sopan dan memaksa meminta nomor WhatsApp peserta lain saat acara.',
                    time: 'Hari ini, 08:15 WIB',
                    statusText: 'Menunggu Tindakan',
                  },
                  {
                    id: 'rep_102',
                    category: 'Spam & Promosi Ilegal',
                    target: 'Aktivitas (act_991)',
                    reporter: 'Rahma Anindya (@rahmaanindya)',
                    reason: 'Ajakan mengarah ke jualan produk MLM dan bukan murni aktivitas ngobrol komunitas.',
                    time: 'Kemarin, 19:40 WIB',
                    statusText: 'Menunggu Tindakan',
                  },
                ].map((rep) => (
                  <div key={rep.id} className="p-4 rounded-2xl bg-white border border-rose-200 flex flex-col gap-2.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="p-1 rounded-lg bg-rose-100 text-rose-700 font-bold text-xs">
                          {rep.category}
                        </span>
                        <span className="text-xs font-bold text-foreground">{rep.target}</span>
                      </div>
                      <Badge variant="warning" className="text-[10px]">
                        {rep.statusText}
                      </Badge>
                    </div>

                    <p className="text-xs text-foreground bg-muted/50 p-2.5 rounded-xl border border-border/60">
                      "{rep.reason}"
                    </p>

                    <div className="flex items-center justify-between pt-1 text-[11px] text-muted-foreground">
                      <span>Pelapor: {rep.reporter} • {rep.time}</span>
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            toast({
                              title: 'Laporan Diabaikan',
                              description: 'Laporan ditandai sebagai tidak melanggar ketentuan.',
                              variant: 'info',
                            });
                          }}
                          className="text-xs h-7 px-2.5"
                        >
                          Abaikan
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            toast({
                              title: 'Sanksi Diterapkan',
                              description: 'Peringatan resmi dan pembekuan akun 7 hari telah diberlakukan.',
                              variant: 'error',
                            });
                          }}
                          className="text-xs h-7 px-2.5 bg-rose-600 hover:bg-rose-700"
                        >
                          Beri Sanksi & Suspend
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* ========================================================================= */}
          {/* VIEW: KONTEN, ANALITIK, PENGATURAN                                        */}
          {/* ========================================================================= */}
          {currentMenu === 'konten' && (
            <Card className="p-5 flex flex-col gap-4">
              <h3 className="font-bold text-base text-foreground">Konten, 12 Minat Resmi & Banner</h3>
              <p className="text-xs text-muted-foreground">
                Kelola katalog 12 kategori minat resmi, aset cover ilustrasi, dan promosi banner beranda.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                {ACTIVITY_CATEGORY_CATALOG.map((item) => (
                  <div key={item.id} className="p-2.5 rounded-xl bg-muted/50 border border-border flex items-center gap-2">
                    <Image
                      src={getCategoryOrInterestImage(item.id)}
                      alt=""
                      width={28}
                      height={28}
                      className="size-7 shrink-0 object-contain"
                    />
                    <span className="text-xs font-bold text-foreground">{item.label}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {currentMenu === 'analitik' && (
            <Card className="p-5 flex flex-col gap-4">
              <h3 className="font-bold text-base text-foreground">Analitik Bisnis & Metrik Pertumbuhan</h3>
              <p className="text-xs text-muted-foreground">
                MAU Pertumbuhan +18.4%, Keberhasilan Pertemuan 94.2%, Total Volume GMV 4.850.000 Coin.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200">
                  <span className="text-xs font-bold text-emerald-800">Tingkat Check-in Sukses</span>
                  <p className="text-2xl font-extrabold text-emerald-950 mt-1">94.2%</p>
                  <span className="text-[10px] text-emerald-700">1.240 pertemuan terselenggara</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200">
                  <span className="text-xs font-bold text-amber-800">Retensi Pengguna (D-30)</span>
                  <p className="text-2xl font-extrabold text-amber-950 mt-1">48.6%</p>
                  <span className="text-[10px] text-amber-700">Host & Peserta berulang</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200">
                  <span className="text-xs font-bold text-blue-800">Net Platform Margin</span>
                  <p className="text-2xl font-extrabold text-blue-950 mt-1">Rp14.250.000</p>
                  <span className="text-[10px] text-blue-700">Take-rate & Fee Voucher</span>
                </div>
              </div>
            </Card>
          )}

          {currentMenu === 'pengaturan' && (
            <Card className="p-5 flex flex-col gap-4">
              <h3 className="font-bold text-base text-foreground">Pengaturan & Hak Akses Administrator</h3>
              <p className="text-xs text-muted-foreground">
                Kelola daftar email admin terotorisasi, role permission, dan log aktivitas audit.
              </p>
              <div className="p-3 rounded-2xl bg-muted/40 border border-border flex flex-col gap-2">
                <span className="text-xs font-bold text-foreground">Daftar Admin Aktif</span>
                <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-1">
                  <li>admin@placetogo.id (Super Admin Utama)</li>
                  <li>rahma.anindya@gmail.com (Super Admin)</li>
                  <li>moderator@placetogo.id (Tim Keamanan & Moderasi)</li>
                </ul>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* LAYAR PALING PENTING: DETAIL AKTIVITAS ADMIN (SATU ALUR LENGKAP)           */}
      {/* ========================================================================= */}
      {selectedActivity && (
        <Modal
          open={activityModalOpen}
          onClose={() => setActivityModalOpen(false)}
          title={`Pusat Kendali Aktivitas: ${selectedActivity.title}`}
        >
          <div className="flex flex-col gap-5 max-h-[80vh] overflow-y-auto pr-1">
            {/* 1. Header Status & Summary */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-mint-soft to-white border border-border flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Image
                    src={getCategoryOrInterestImage(selectedActivity.category)}
                    alt=""
                    width={24}
                    height={24}
                    className="size-6 shrink-0 object-contain"
                  />
                  <span className="text-xs font-bold uppercase text-primary">
                    {categoryLabel(selectedActivity.category)} • ID: {selectedActivity.id}
                  </span>
                </div>
                <h3 className="text-base md:text-lg font-extrabold text-foreground mt-0.5">
                  {selectedActivity.title}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  <Calendar className="size-3 inline mr-1" />
                  {selectedActivity.dateTime} ({selectedActivity.timeRange}) • Kota {selectedActivity.city}
                </p>
              </div>

              <div className="flex flex-col items-start md:items-end gap-1">
                <span className="text-[10px] font-bold uppercase text-muted-foreground">Status Acara</span>
                <span
                  className={cn(
                    'px-3 py-1 rounded-full text-xs font-extrabold border',
                    selectedActivity.statusText === 'Sedang Berlangsung'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : selectedActivity.statusText === 'Menunggu Persetujuan'
                        ? 'bg-amber-50 text-amber-800 border-amber-300'
                        : selectedActivity.statusText === 'Selesai'
                          ? 'bg-slate-100 text-slate-800 border-slate-300'
                          : 'bg-rose-50 text-rose-800 border-rose-300',
                  )}
                >
                  {selectedActivity.statusText}
                </span>
              </div>
            </div>

            {/* 2. Grid Dua Kolom: Host & Venue */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* Host Box */}
              <div className="p-3.5 rounded-2xl bg-white border border-border flex flex-col gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Users className="size-3.5 text-primary" /> Informasi Host / Inisiator
                </span>
                <div className="flex items-center gap-3">
                  <Image
                    src={selectedActivity.host.avatar}
                    alt={selectedActivity.host.name}
                    width={48}
                    height={48}
                    className="size-12 rounded-full border border-border object-cover"
                  />
                  <div>
                    <h4 className="font-bold text-sm text-foreground">{selectedActivity.host.name}</h4>
                    <p className="text-xs text-muted-foreground">@{selectedActivity.host.username}</p>
                    <span className="inline-block text-[10px] font-bold text-primary">
                      {selectedActivity.host.level} • {selectedActivity.host.attendanceRate}% Hadir • ★ {selectedActivity.host.rating}
                    </span>
                  </div>
                </div>
                <div className="text-[11px] text-muted-foreground pt-1 border-t border-border flex items-center justify-between">
                  <span>Kontak WA: <strong>{selectedActivity.host.phone}</strong></span>
                  <a
                    href={`https://wa.me/${selectedActivity.host.phone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
                  >
                    <Phone className="size-3" /> Chat Host
                  </a>
                </div>
              </div>

              {/* Venue Box */}
              <div className="p-3.5 rounded-2xl bg-white border border-border flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Store className="size-3.5 text-primary" /> Venue Titik Temu
                  </span>
                  {selectedActivity.venueIsOfficial ? (
                    <Badge variant="success" className="text-[10px]">★ Official Spot</Badge>
                  ) : (
                    <Badge variant="neutral" className="text-[10px]">Lokasi Publik</Badge>
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-foreground">{selectedActivity.venueName}</h4>
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                    <MapPin className="size-3 inline mr-1" /> {selectedActivity.venueAddress}
                  </p>
                </div>
                <div className="text-[11px] text-muted-foreground pt-1 border-t border-border flex items-center justify-between">
                  <span>PIC Venue: <strong>{selectedActivity.venuePicPhone}</strong></span>
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(selectedActivity.venueName + ' ' + selectedActivity.venueAddress)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                  >
                    <MapPin className="size-3" /> Buka Maps
                  </a>
                </div>
              </div>
            </div>

            {/* 3. Skema Biaya & Arus Dana Escrow */}
            <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/90 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                  <Receipt className="size-3.5 text-amber-700" />
                  Skema Biaya & Status Escrow Sistem
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-200/80 text-[10px] font-extrabold text-amber-900">
                  {selectedActivity.escrowStatus}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
                <div className="p-2 rounded-xl bg-white border border-amber-200">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">Skema Pembayaran</span>
                  <p className="font-bold text-foreground mt-0.5">
                    {selectedActivity.scheme} ({selectedActivity.costPerPerson > 0 ? `Rp${selectedActivity.costPerPerson.toLocaleString('id-ID')}/org` : 'Gratis'})
                  </p>
                </div>
                <div className="p-2 rounded-xl bg-white border border-amber-200">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">Total Dana Escrow</span>
                  <p className="font-bold text-emerald-800 mt-0.5">
                    Rp{selectedActivity.totalEscrowAmount.toLocaleString('id-ID')}
                  </p>
                </div>
                <div className="p-2 rounded-xl bg-white border border-amber-200">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">Distribusi Koin Reward</span>
                  <p className="font-bold text-amber-800 mt-0.5">
                    +250 Coin / Peserta Hadir
                  </p>
                </div>
              </div>
            </div>

            {/* 4. Daftar Peserta & Live Check-in Log */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs md:text-sm font-bold text-foreground flex items-center gap-1.5">
                  <UserCheck className="size-4 text-primary" />
                  Daftar Peserta & Waktu Check-in Lokasi ({selectedActivity.participants.length} Orang)
                </h4>
                <span className="text-[11px] font-bold text-emerald-700">
                  {selectedActivity.participants.filter((p) => p.checkinStatus === 'Hadir di Lokasi').length} Sudah Check-in
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/60 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border">
                    <tr>
                      <th className="px-3.5 py-2 font-bold">Peserta</th>
                      <th className="px-3.5 py-2 font-bold">Pembayaran</th>
                      <th className="px-3.5 py-2 font-bold">Status Check-in Lokasi</th>
                      <th className="px-3.5 py-2 font-bold">Waktu Scan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-white">
                    {selectedActivity.participants.map((p) => (
                      <tr key={p.id} className="hover:bg-muted/20">
                        <td className="px-3.5 py-2.5">
                          <div className="flex items-center gap-2">
                            <Image
                              src={p.avatar}
                              alt={p.name}
                              width={28}
                              height={28}
                              className="size-7 rounded-full border border-border object-cover"
                            />
                            <span className="font-bold text-foreground">{p.name}</span>
                          </div>
                        </td>
                        <td className="px-3.5 py-2.5">
                          <span
                            className={cn(
                              'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold',
                              p.paymentStatus === 'Lunas'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-800',
                            )}
                          >
                            {p.paymentStatus}
                          </span>
                        </td>
                        <td className="px-3.5 py-2.5">
                          <span
                            className={cn(
                              'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold',
                              p.checkinStatus === 'Hadir di Lokasi'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800',
                            )}
                          >
                            {p.checkinStatus === 'Hadir di Lokasi' ? '✓ Hadir di Lokasi' : '⏳ Belum Check-in'}
                          </span>
                        </td>
                        <td className="px-3.5 py-2.5 text-muted-foreground font-mono text-[11px]">
                          {p.checkinTime ?? '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 5. Catatan Insiden & Status Laporan */}
            <div className="p-3 rounded-xl bg-muted/40 border border-border/80 text-xs text-foreground">
              <span className="font-bold block mb-0.5">Catatan Keamanan & Komunitas:</span>
              <p className="text-muted-foreground">{selectedActivity.notes ?? 'Tidak ada catatan insiden.'}</p>
            </div>

            {/* 6. Admin Control Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-border">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    toast({
                      title: 'Pesan Broadcast Dikirim',
                      description: 'Notifikasi admin terkirim ke seluruh peserta aktivitas ini.',
                      variant: 'info',
                    });
                  }}
                  className="text-xs gap-1"
                >
                  <Send className="size-3.5" /> Broadcast Peserta
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => handleCancelAndRefund(selectedActivity.id)}
                  className="text-xs text-rose-700 hover:bg-rose-50 border-rose-200"
                >
                  Batalkan & Refund Peserta
                </Button>
              </div>

              <div className="flex items-center gap-2">
                {selectedActivity.statusText === 'Menunggu Persetujuan' && (
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => handleApproveActivity(selectedActivity.id)}
                    className="text-xs bg-emerald-600 hover:bg-emerald-700 gap-1"
                  >
                    <CheckCircle2 className="size-3.5" /> Setujui & Terbitkan
                  </Button>
                )}

                {selectedActivity.escrowStatus !== 'Dana Telah Dicairkan' && (
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => handleSettleEscrow(selectedActivity.id)}
                    className="text-xs gap-1 bg-primary hover:bg-primary-strong"
                  >
                    <DollarSign className="size-3.5" /> Selesaikan & Lepas Dana
                  </Button>
                )}

                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setActivityModalOpen(false)}
                  className="text-xs"
                >
                  Tutup
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
