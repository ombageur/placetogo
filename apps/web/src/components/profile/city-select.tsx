'use client';

import * as React from 'react';
import { CITY_CATALOG, type CityId } from '@placetogo/shared';
import { cn } from '@/lib/utils';

export interface CitySelectProps {
  value: CityId | '';
  onChange: (id: CityId) => void;
  error?: string;
  id?: string;
}

export function CitySelect({ value, onChange, error, id }: CitySelectProps) {
  const autoId = React.useId();
  const selectId = id ?? autoId;
  const errorId = error ? `${selectId}-error` : undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={selectId} className="text-sm font-semibold text-foreground">
        Kota
      </label>
      <select
        id={selectId}
        value={value}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
        onChange={(e) => onChange(e.target.value as CityId)}
        className={cn(
          'min-h-11 w-full rounded-xl border border-border-strong bg-background px-4 text-base text-foreground aria-[invalid=true]:border-danger',
        )}
      >
        <option value="" disabled>
          Pilih kota
        </option>
        {CITY_CATALOG.map(({ id: cityId, label }) => (
          <option key={cityId} value={cityId}>
            {label}
          </option>
        ))}
      </select>
      {error && (
        <p id={errorId} role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
