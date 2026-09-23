'use client';

import * as React from 'react';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { TextField } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { SkeletonList } from '@/components/ui/skeleton';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { useToast } from '@/components/ui/toast';
import { MapView } from '@/components/maps/map-view';
import { PlacePicker } from '@/components/maps/place-picker';

const SWATCHES = [
  ['primary', 'bg-primary'],
  ['secondary', 'bg-secondary'],
  ['mint', 'bg-mint'],
  ['mint-strong', 'bg-mint-strong'],
  ['danger', 'bg-danger'],
  ['coin', 'bg-coin'],
] as const;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-primary">{title}</h2>
      {children}
    </section>
  );
}

/** Galeri komponen. Semua isi adalah contoh antarmuka, bukan data pengguna atau produksi. */
export function DesignSystemDemo() {
  const [open, setOpen] = React.useState(false);
  const { toast } = useToast();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h1>Sistem Desain</h1>
        <p className="text-sm text-muted-foreground">Contoh komponen antarmuka. Bukan data produksi.</p>
      </div>

      <Section title="Warna">
        <ul className="grid grid-cols-3 gap-3 md:grid-cols-6">
          {SWATCHES.map(([name, cls]) => (
            <li key={name} className="flex flex-col gap-1 text-xs font-semibold">
              <span className={`h-12 rounded-xl border border-border ${cls}`} aria-hidden="true" />
              {name}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Tombol">
        <div className="flex flex-wrap gap-2">
          <Button>Utama</Button>
          <Button variant="secondary">Sekunder</Button>
          <Button variant="outline">Garis</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Hapus</Button>
          <Button loading>Memproses</Button>
          <Button disabled>Nonaktif</Button>
        </div>
        <Button fullWidth size="lg">
          Lebar penuh
        </Button>
      </Section>

      <Section title="Input">
        <div className="grid gap-4 md:grid-cols-2">
          <TextField label="Nama panggilan" placeholder="Contoh: KopiSenja" hint="Tampil di profil publik." />
          <TextField label="Email" type="email" defaultValue="salah-format" error="Format email tidak valid." />
        </div>
      </Section>

      <Section title="Kartu, avatar, dan badge">
        <div className="grid gap-3 md:grid-cols-2">
          <Card className="flex items-center gap-3">
            <Avatar name="Contoh Pengguna" />
            <div className="flex-1">
              <CardTitle>Judul kartu contoh</CardTitle>
              <CardDescription>Deskripsi singkat kartu.</CardDescription>
            </div>
            <Badge variant="warning">Ditraktir</Badge>
          </Card>
          <Card variant="mint" className="flex flex-wrap items-center gap-2">
            <Badge>Netral</Badge>
            <Badge variant="success">Berhasil</Badge>
            <Badge variant="warning">Peringatan</Badge>
            <Badge variant="danger">Bahaya</Badge>
            <Badge variant="info">Info</Badge>
          </Card>
        </div>
      </Section>

      <Section title="Pemuatan">
        <SkeletonList count={2} />
      </Section>

      <Section title="Kondisi kosong dan galat">
        <EmptyState title="Belum ada isi" description="Contoh kondisi kosong." action={<Button variant="secondary">Aksi</Button>} />
        <ErrorState onRetry={() => toast({ title: 'Mencoba lagi', variant: 'info' })} />
      </Section>

      <Section title="Modal dan toast">
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setOpen(true)}>Buka modal</Button>
          <Button variant="secondary" onClick={() => toast({ title: 'Tersimpan', description: 'Contoh notifikasi.', variant: 'success' })}>
            Tampilkan toast
          </Button>
        </div>
        <Modal
          open={open}
          onClose={() => setOpen(false)}
          title="Contoh modal"
          description="Fokus terkunci di dalam modal; tekan Esc atau Tutup untuk keluar."
          footer={
            <>
              <Button onClick={() => setOpen(false)}>Mengerti</Button>
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Batal
              </Button>
            </>
          }
        />
      </Section>

      <Section title="Lokasi (Fase 05)">
        <p className="text-sm text-muted-foreground">
          Pencarian tempat lewat backend (kunci server); peta hanya kunci browser. Butuh kunci Maps
          Platform asli untuk berfungsi — lihat docs/discovery/nearby.md.
        </p>
        <PlacePicker label="Cari tempat pertemuan" onSelect={() => {}} />
        <MapView lat={-6.1754} lng={106.8272} label="Monas, Jakarta (contoh)" />
      </Section>
    </div>
  );
}
