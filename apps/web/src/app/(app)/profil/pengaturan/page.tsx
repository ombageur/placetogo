'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Bell,
  ChevronRight,
  FileText,
  Globe,
  Lock,
  LogOut,
  MapPin,
  ShieldCheck,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { useAuth } from '@/components/auth/auth-provider';
import { useToast } from '@/components/ui/toast';

export default function PengaturanPage() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { toast } = useToast();
  const [confirmSignOut, setConfirmSignOut] = React.useState(false);
  const [signingOut, setSigningOut] = React.useState(false);

  const [activeInfoModal, setActiveInfoModal] = React.useState<'terms' | 'privacy' | 'help' | null>(null);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
      router.push('/masuk');
    } catch {
      toast({ title: 'Gagal keluar', description: 'Coba beberapa saat lagi.', variant: 'error' });
      setSigningOut(false);
    }
  }

  const menuSections = [
    {
      title: 'Pengaturan Akun & Privasi',
      items: [
        { label: 'Akun & Profil', href: '/profil/edit', icon: User, note: 'Email & identitas avatar' },
        { label: 'Notifikasi', href: '/notifikasi', icon: Bell, note: 'Push & peringatan aktivitas' },
        { label: 'Privasi & Keamanan', href: '/admin/moderasi', icon: Lock, note: 'Visibilitas & pemblokiran' },
        { label: 'Lokasi & Radius', href: '/jelajah', icon: MapPin, note: 'Jangkauan kota aktif' },
      ],
    },
    {
      title: 'Preferensi & Bantuan',
      items: [
        { label: 'Pusat Bantuan', action: () => setActiveInfoModal('help'), icon: Globe, note: 'Panduan & kontak tim bantuan' },
        { label: 'Syarat & Ketentuan', action: () => setActiveInfoModal('terms'), icon: FileText, note: 'Ketentuan layanan komunitas' },
        { label: 'Kebijakan Privasi', action: () => setActiveInfoModal('privacy'), icon: ShieldCheck, note: 'Perlindungan data avatar' },
      ],
    },
  ];

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
        <h1 className="text-foreground">Pengaturan</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Kelola preferensi akun, privasi avatar, dan ketentuan komunitas.
        </p>
      </div>

      {/* Menu Groups (Screen 27) */}
      <div className="flex flex-col gap-5">
        {menuSections.map((sec, sIdx) => (
          <div key={sIdx} className="flex flex-col gap-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
              {sec.title}
            </h2>
            <Card className="flex flex-col divide-y divide-border p-0 overflow-hidden bg-background">
              {sec.items.map((item, iIdx) => {
                const Icon = item.icon;
                if ('href' in item && item.href) {
                  return (
                    <Link
                      key={iIdx}
                      href={item.href}
                      className="flex items-center justify-between p-3.5 hover:bg-mint/40 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex size-8 items-center justify-center rounded-xl bg-mint text-primary">
                          <Icon className="size-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{item.label}</p>
                          <p className="text-[11px] text-muted-foreground">{item.note}</p>
                        </div>
                      </div>
                      <ChevronRight className="size-4 text-muted-foreground" />
                    </Link>
                  );
                }

                return (
                  <button
                    key={iIdx}
                    type="button"
                    onClick={'action' in item ? item.action : undefined}
                    className="flex items-center justify-between p-3.5 hover:bg-mint/40 transition-colors text-left w-full cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 items-center justify-center rounded-xl bg-mint text-primary">
                        <Icon className="size-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{item.label}</p>
                        <p className="text-[11px] text-muted-foreground">{item.note}</p>
                      </div>
                    </div>
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </button>
                );
              })}
            </Card>
          </div>
        ))}

        {/* Keluar Button */}
        <div className="pt-2">
          <Button
            variant="destructive"
            fullWidth
            size="lg"
            onClick={() => setConfirmSignOut(true)}
            className="gap-2 shadow-xs"
          >
            <LogOut className="size-4" />
            Keluar dari Akun
          </Button>
        </div>
      </div>

      {/* Modal Pusat Bantuan */}
      <Modal
        open={activeInfoModal === 'help'}
        onClose={() => setActiveInfoModal(null)}
        title="Pusat Bantuan"
      >
        <div className="flex flex-col gap-4 text-left p-1 text-xs leading-relaxed text-foreground">
          <p className="font-medium text-sm">Butuh bantuan atau mengalami kendala?</p>
          <div className="rounded-2xl bg-mint/50 border border-primary/20 p-3.5 space-y-2">
            <p className="font-bold text-primary">Kontak Dukungan Resmi:</p>
            <p>📧 Email: <span className="font-semibold">support@placetogo.id</span></p>
            <p>💬 WhatsApp Bantuan: <span className="font-semibold">+62 812-3456-7890</span></p>
            <p className="text-[11px] text-muted-foreground">Tim dukungan aktif setiap hari pukul 09:00 - 21:00 WIB.</p>
          </div>
          <p className="text-muted-foreground">
            Laporkan pengguna atau mitra yang mencurigakan melalui tombol <strong>Lapor</strong> pada halaman detail atau chat.
          </p>
          <Button fullWidth onClick={() => setActiveInfoModal(null)}>Tutup</Button>
        </div>
      </Modal>

      {/* Modal Syarat & Ketentuan */}
      <Modal
        open={activeInfoModal === 'terms'}
        onClose={() => setActiveInfoModal(null)}
        title="Syarat & Ketentuan"
      >
        <div className="flex flex-col gap-3 text-left p-1 text-xs leading-relaxed text-foreground max-h-[60vh] overflow-y-auto">
          <p className="font-bold text-sm">Ketentuan Komunitas placetogo.id</p>
          <p>1. <strong>Identitas Avatar</strong>: placetogo.id menggunakan avatar untuk menjaga privasi visual kamu saat eksplorasi tempat publik.</p>
          <p>2. <strong>Keamanan Pertemuan</strong>: Seluruh pertemuan wajib diadakan di tempat publik yang aman (kafe, resto, co-working space, area terbuka).</p>
          <p>3. <strong>Sistem Koin</strong>: Koin komunitas merupakan instrumen apresiasi dan reward kehadiran di dalam platform, tidak dapat diuangkan langsung (non-withdrawable).</p>
          <p>4. <strong>Norma & Etika</strong>: Dilarang melakukan pelecehan, penipuan, ujaran kebencian, atau promosi ilegal. Pelanggar akan dikenakan sanksi suspensi permanen.</p>
          <Button fullWidth onClick={() => setActiveInfoModal(null)}>Saya Mengerti</Button>
        </div>
      </Modal>

      {/* Modal Kebijakan Privasi */}
      <Modal
        open={activeInfoModal === 'privacy'}
        onClose={() => setActiveInfoModal(null)}
        title="Kebijakan Privasi"
      >
        <div className="flex flex-col gap-3 text-left p-1 text-xs leading-relaxed text-foreground max-h-[60vh] overflow-y-auto">
          <p className="font-bold text-sm">Komitmen Perlindungan Privasi</p>
          <p>Kami sangat memprioritaskan keamanan identitas dan data pribadi kamu:</p>
          <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
            <li>Nomor telepon dan email asli tidak pernah ditampilkan ke pengguna lain.</li>
            <li>Lokasi GPS hanya digunakan untuk pencarian tempat terdekat dan verifikasi check-in saat kamu berada di lokasi kegiatan.</li>
            <li>Percakapan chat dilindungi dan hanya dapat dibaca oleh peserta di ajakan yang bersangkutan.</li>
          </ul>
          <Button fullWidth onClick={() => setActiveInfoModal(null)}>Tutup</Button>
        </div>
      </Modal>

      {/* Modal Konfirmasi Sign Out */}
      <Modal open={confirmSignOut} onClose={() => setConfirmSignOut(false)} title="Keluar dari Akun">
        <div className="flex flex-col gap-4 text-center p-2">
          <p className="text-sm text-foreground">
            Apakah kamu yakin ingin keluar dari sesi placetogo.id di perangkat ini?
          </p>
          <div className="flex flex-col gap-2 pt-2">
            <Button variant="destructive" fullWidth size="lg" loading={signingOut} onClick={handleSignOut}>
              Ya, Keluar
            </Button>
            <Button variant="ghost" fullWidth size="md" onClick={() => setConfirmSignOut(false)}>
              Batal
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
