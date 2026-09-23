'use client';

import { cn } from '@/lib/utils';

export type DiscoveryTab = 'rekomendasi' | 'terdekat' | 'terbaru';

const TABS: Array<{ id: DiscoveryTab; label: string }> = [
  { id: 'rekomendasi', label: 'Rekomendasi' },
  { id: 'terdekat', label: 'Terdekat' },
  { id: 'terbaru', label: 'Terbaru' },
];

export function DiscoveryTabs({ value, onChange }: { value: DiscoveryTab; onChange: (tab: DiscoveryTab) => void }) {
  return (
    <div role="tablist" aria-label="Urutan ajakan" className="flex gap-2">
      {TABS.map((tab) => {
        const active = tab.id === value;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.id)}
            className={cn(
              'flex min-h-11 items-center rounded-full px-4 text-sm font-semibold transition-colors',
              active ? 'bg-primary text-primary-foreground' : 'bg-mint text-primary hover:bg-mint-strong',
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
