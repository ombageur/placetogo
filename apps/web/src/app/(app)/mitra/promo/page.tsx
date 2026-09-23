'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { FaIcon } from '@/components/ui/font-awesome-icon';
import { cn } from '@/lib/utils';

interface PromoItem {
  id: string;
  title: string;
  type: 'reward_coin' | 'discount' | 'freebie';
  value: string;
  validUntil: string;
  active: boolean;
}

export default function KelolaPromoPage() {
  const { toast } = useToast();
  const [promos, setPromos] = React.useState<PromoItem[]>([
    {
      id: 'p1',
      title: 'Reward Check-in Pertemuan',
      type: 'reward_coin',
      value: '2.000 Coin',
      validUntil: '30 Apr 2025',
      active: true,
    },
    {
      id: 'p2',
      title: 'Diskon Menu Semua Kopi',
      type: 'discount',
      value: 'Diskon 10%',
      validUntil: '20 Apr 2025',
      active: true,
    },
    {
      id: 'p3',
      title: 'Gratis Snack / Croissant',
      type: 'freebie',
      value: 'Gratis 1 Snack',
      validUntil: '15 Mei 2025',
      active: false,
    },
  ]);

  const [openModal, setOpenModal] = React.useState(false);
  const [newTitle, setNewTitle] = React.useState('');
  const [newType, setNewType] = React.useState<'reward_coin' | 'discount' | 'freebie'>('discount');
  const [newValue, setNewValue] = React.useState('');
  const [newValidUntil, setNewValidUntil] = React.useState('30 Mei 2025');

  function togglePromo(id: string) {
    setPromos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, active: !p.active } : p)),
    );
    toast({
      title: 'Status Promo Diperbarui',
      description: 'Pengunjung dapat melihat promo yang aktif langsung pada tab Venue ajakan.',
      variant: 'info',
    });
  }

  function handleCreatePromo(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim() || !newValue.trim()) return;

    const newPromo: PromoItem = {
      id: `p_${Date.now()}`,
      title: newTitle.trim(),
      type: newType,
      value: newValue.trim(),
      validUntil: newValidUntil,
      active: true,
    };

    setPromos((prev) => [newPromo, ...prev]);
    setNewTitle('');
    setNewValue('');
    setOpenModal(false);

    toast({
      title: 'Promo Baru Berhasil Dibuat!',
      description: 'Promo kamu sekarang aktif untuk komunitas placetogo.',
      variant: 'info',
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/mitra/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:bg-mint rounded-full px-2.5 py-1"
        >
          <ArrowLeft className="size-4" />
          Dashboard Venue
        </Link>
        <Button size="sm" onClick={() => setOpenModal(true)} className="gap-1.5">
          <Plus className="size-3.5" />
          Buat Promo Baru
        </Button>
      </div>

      <div>
        <h1 className="text-foreground">Kelola Promo & Reward</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Atur penawaran khusus dan insentif Coin yang tampil pada halaman detail pertemuan di venuemu.
        </p>
      </div>

      {/* List Promo Items (Screen 30) */}
      <div className="flex flex-col gap-3">
        {promos.map((promo) => (
          <Card
            key={promo.id}
            className={cn(
              'flex items-center justify-between p-4 transition-all',
              promo.active ? 'bg-background border-border shadow-xs' : 'bg-muted border-dashed border-border-strong',
            )}
          >
            <div className="flex items-start gap-3.5">
              <div
                className={cn(
                  'flex size-11 items-center justify-center rounded-2xl shrink-0 shadow-xs',
                  promo.type === 'reward_coin' && 'bg-warning-soft text-warning-soft-foreground',
                  promo.type === 'discount' && 'bg-mint text-primary',
                  promo.type === 'freebie' && 'bg-purple-100 text-purple-600',
                )}
              >
                {promo.type === 'reward_coin' && <FaIcon icon="fa-coins" className="text-base" />}
                {promo.type === 'discount' && <FaIcon icon="fa-tag" className="text-base" />}
                {promo.type === 'freebie' && <FaIcon icon="fa-gift" className="text-base" />}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-foreground">{promo.title}</h2>
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-[10px] font-bold',
                      promo.active ? 'bg-mint text-primary border border-primary/20' : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {promo.value}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Berlaku s/d <span className="font-semibold text-foreground">{promo.validUntil}</span>
                </p>
              </div>
            </div>

            {/* Toggle Switch */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-muted-foreground hidden sm:inline">
                {promo.active ? 'Aktif' : 'Nonaktif'}
              </span>
              <button
                type="button"
                onClick={() => togglePromo(promo.id)}
                aria-pressed={promo.active}
                aria-label={`${promo.active ? 'Nonaktifkan' : 'Aktifkan'} promo ${promo.title}`}
                className={cn(
                  'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
                  promo.active ? 'bg-primary' : 'bg-border-strong',
                )}
              >
                <span
                  className={cn(
                    'pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out',
                    promo.active ? 'translate-x-5' : 'translate-x-0',
                  )}
                />
              </button>
            </div>
          </Card>
        ))}
      </div>

      {/* Modal Buat Promo Baru */}
      <Modal open={openModal} onClose={() => setOpenModal(false)} title="Buat Promo / Reward Baru">
        <form onSubmit={handleCreatePromo} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-foreground">Jenis Penawaran</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'discount', label: 'Diskon Menu', icon: 'fa-tag' },
                { id: 'reward_coin', label: 'Reward Coin', icon: 'fa-coins' },
                { id: 'freebie', label: 'Gratis Snack', icon: 'fa-gift' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setNewType(t.id as typeof newType)}
                  className={cn(
                    'flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-semibold transition-all',
                    newType === t.id
                      ? 'border-primary bg-mint text-primary font-bold shadow-xs'
                      : 'border-border bg-background text-muted-foreground hover:bg-mint/30',
                  )}
                >
                  <FaIcon icon={t.icon} className="text-sm mb-1" />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="promo-title" className="text-xs font-bold text-foreground">
              Nama Promo
            </label>
            <input
              id="promo-title"
              type="text"
              required
              placeholder="Contoh: Diskon 15% Semua Manual Brew"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full rounded-xl border border-border-strong bg-background p-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="promo-value" className="text-xs font-bold text-foreground">
              Nilai Manfaat / Badge
            </label>
            <input
              id="promo-value"
              type="text"
              required
              placeholder="Contoh: Diskon 15% atau 3.000 Coin"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              className="w-full rounded-xl border border-border-strong bg-background p-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="promo-valid" className="text-xs font-bold text-foreground">
              Masa Berlaku
            </label>
            <input
              id="promo-valid"
              type="text"
              required
              placeholder="Contoh: 31 Mei 2025"
              value={newValidUntil}
              onChange={(e) => setNewValidUntil(e.target.value)}
              className="w-full rounded-xl border border-border-strong bg-background p-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Button type="submit" fullWidth size="lg">
              Simpan & Aktifkan Promo
            </Button>
            <Button type="button" variant="ghost" onClick={() => setOpenModal(false)} fullWidth size="md">
              Batal
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
