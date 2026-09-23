'use client';

import Image from 'next/image';
import { ACTIVITY_CATEGORY_CATALOG, type ActivityCategoryId } from '@placetogo/shared';
import { getCategoryOrInterestImage } from './category-icons';
import { FaIcon } from '@/components/ui/font-awesome-icon';
import { cn } from '@/lib/utils';

export function CategoryFilter({
  value,
  onChange,
}: {
  value: ActivityCategoryId | undefined;
  onChange: (id: ActivityCategoryId | undefined) => void;
}) {
  return (
    <div role="group" aria-label="Filter kategori" className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
      <button
        type="button"
        aria-pressed={value === undefined}
        onClick={() => onChange(undefined)}
        className={cn(
          'flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border px-4 text-xs font-bold transition-all shadow-xs',
          value === undefined
            ? 'border-primary bg-primary text-primary-foreground shadow-sm'
            : 'border-border bg-background text-muted-foreground hover:bg-mint hover:text-foreground',
        )}
      >
        <FaIcon icon="fa-layer-group" className="text-xs" />
        Semua
      </button>
      {ACTIVITY_CATEGORY_CATALOG.map(({ id, label }) => {
        const selected = value === id;
        return (
          <button
            key={id}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(selected ? undefined : id)}
            className={cn(
              'flex min-h-11 shrink-0 items-center gap-2 rounded-full border pl-2 pr-3.5 text-xs font-bold transition-all shadow-xs',
              selected
                ? 'border-primary bg-mint-strong text-primary ring-1 ring-primary shadow-sm'
                : 'border-border bg-background text-foreground hover:bg-mint/40',
            )}
          >
            <Image
              src={getCategoryOrInterestImage(id)}
              alt=""
              width={24}
              height={24}
              className="size-6 shrink-0 rounded-full object-contain"
            />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
