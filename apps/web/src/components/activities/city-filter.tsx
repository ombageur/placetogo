'use client';

import * as React from 'react';
import { CITY_CATALOG, type CityId } from '@placetogo/shared';

export function CityFilter({ value, onChange }: { value: CityId | undefined; onChange: (id: CityId | undefined) => void }) {
  const id = React.useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="sr-only">
        Filter kota
      </label>
      <select
        id={id}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value ? (e.target.value as CityId) : undefined)}
        className="min-h-11 rounded-full border border-border-strong bg-background px-4 text-sm font-semibold text-foreground"
      >
        <option value="">Semua kota</option>
        {CITY_CATALOG.map(({ id: cityId, label }) => (
          <option key={cityId} value={cityId}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
}
