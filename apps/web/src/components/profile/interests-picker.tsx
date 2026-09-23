'use client';
import Image from 'next/image';
import { INTEREST_CATALOG, type InterestId } from '@placetogo/shared';
import { cn } from '@/lib/utils';
import { INTEREST_IMAGE_SRC } from './interest-images';

const MAX_INTERESTS = 8;

export function InterestsPicker({
  value,
  onChange,
  error,
}: {
  value: InterestId[];
  onChange: (ids: InterestId[]) => void;
  error?: string;
}) {
  function toggle(id: InterestId) {
    if (value.includes(id)) return onChange(value.filter((v) => v !== id));
    if (value.length >= MAX_INTERESTS) return;
    onChange([...value, id]);
  }

  const describedBy = ['interests-hint', error ? 'interests-error' : null].filter(Boolean).join(' ');

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-semibold text-foreground">Minat (pilih beberapa)</span>
      <p id="interests-hint" className="text-sm text-muted-foreground">
        Pilih 1–{MAX_INTERESTS} minat. Dipilih: {value.length}/{MAX_INTERESTS}.
      </p>
      <div role="group" aria-label="Minat" aria-describedby={describedBy} className="flex flex-wrap gap-2">
        {INTEREST_CATALOG.map(({ id, label }) => {
          const selected = value.includes(id);
          const disabled = !selected && value.length >= MAX_INTERESTS;
          return (
            <button
              key={id}
              type="button"
              aria-pressed={selected}
              disabled={disabled}
              onClick={() => toggle(id)}
              className={cn(
                'inline-flex min-h-12 items-center gap-2.5 rounded-2xl border pl-2 pr-4 py-1.5 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50 shadow-2xs',
                selected
                  ? 'border-primary bg-mint-strong text-primary shadow-xs ring-2 ring-primary/30 scale-[1.02]'
                  : 'border-border-strong bg-background text-foreground hover:bg-mint/40 hover:border-primary/40',
              )}
            >
              <Image
                src={INTEREST_IMAGE_SRC[id]}
                alt=""
                width={36}
                height={36}
                className="size-8 shrink-0 rounded-full object-contain"
              />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
      {error && (
        <p id="interests-error" role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
