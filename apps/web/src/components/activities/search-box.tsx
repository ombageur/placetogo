'use client';

import * as React from 'react';
import { Search } from 'lucide-react';

const DEBOUNCE_MS = 400;

/**
 * Kolom pencarian dengan debounce internal. `onSearch` dipanggil lewat `setTimeout`
 * (bukan sinkron di badan efek), jadi aman dipakai dengan callback yang setState.
 */
export function SearchBox({ onSearch }: { onSearch: (text: string) => void }) {
  const [value, setValue] = React.useState('');
  const onSearchRef = React.useRef(onSearch);
  React.useEffect(() => {
    onSearchRef.current = onSearch;
  });

  React.useEffect(() => {
    const timer = setTimeout(() => onSearchRef.current(value), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [value]);

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Cari aktivitas atau tempat..."
        aria-label="Cari aktivitas"
        className="min-h-11 w-full rounded-full border border-border-strong bg-background py-2 pl-11 pr-4 text-base text-foreground placeholder:text-muted-foreground"
      />
    </div>
  );
}
