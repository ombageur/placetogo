'use client';

import * as React from 'react';
import { MapPin, Search, X } from 'lucide-react';
import type { PlaceDetails, PlaceSuggestion } from '@placetogo/shared';
import { getPlaceDetails, searchPlaces } from '@/lib/maps/client';
import { createSessionToken } from '@/lib/maps/session-token';
import { cn } from '@/lib/utils';

const DEBOUNCE_MS = 350;
const MIN_INPUT_LENGTH = 3;

type SearchStatus = 'idle' | 'loading' | 'error';

/**
 * Pencarian tempat publik: autocomplete lewat backend kita (lihat lib/maps/client.ts),
 * BUKAN panggilan Google langsung dari browser. Satu token sesi dipakai dari ketikan
 * pertama sampai tempat dipilih (atau dibatalkan), lalu token baru dibuat untuk sesi
 * berikutnya — sesuai kebijakan billing sesi Places API (New).
 *
 * Bukan combobox ARIA penuh (tanpa navigasi panah aktif) — daftar saran berupa tombol
 * biasa yang bisa dijangkau Tab, cukup untuk keyboard/pembaca layar tanpa kerumitan
 * widget ARIA lengkap. Lihat docs/discovery/nearby.md untuk batasan lain.
 */
export function PlacePicker({
  label = 'Cari tempat',
  onSelect,
  onClear,
}: {
  label?: string;
  onSelect: (place: PlaceDetails) => void;
  onClear?: () => void;
}) {
  const [sessionToken, setSessionToken] = React.useState(createSessionToken());
  const [input, setInput] = React.useState('');
  const [suggestions, setSuggestions] = React.useState<PlaceSuggestion[]>([]);
  const [status, setStatus] = React.useState<SearchStatus>('idle');
  const [selected, setSelected] = React.useState<PlaceDetails | null>(null);
  const [detailLoadingId, setDetailLoadingId] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listId = React.useId();

  // Debounce: sama seperti SearchBox Discovery, `search` dipanggil lewat setTimeout callback
  // (bukan sinkron di badan efek) agar aman dipakai dengan callback yang setState.
  const searchRef = React.useRef<(text: string) => void>(() => {});
  React.useEffect(() => {
    searchRef.current = (text: string) => {
      if (text.trim().length < MIN_INPUT_LENGTH) {
        setSuggestions([]);
        setStatus('idle');
        return;
      }
      setStatus('loading');
      searchPlaces(text, sessionToken)
        .then((results) => {
          setSuggestions(results);
          setStatus('idle');
        })
        .catch(() => setStatus('error'));
    };
  });
  React.useEffect(() => {
    const timer = setTimeout(() => searchRef.current(input), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [input]);

  async function pick(suggestion: PlaceSuggestion) {
    setDetailLoadingId(suggestion.placeId);
    try {
      const details = await getPlaceDetails(suggestion.placeId, sessionToken);
      setSelected(details);
      setSuggestions([]);
      setInput('');
      setSessionToken(createSessionToken()); // sesi selesai; sesi berikutnya butuh token baru
      onSelect(details);
    } catch {
      setStatus('error');
    } finally {
      setDetailLoadingId(null);
    }
  }

  function clearSelection() {
    setSelected(null);
    setSessionToken(createSessionToken());
    onClear?.();
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  if (selected) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-border-strong bg-mint p-3">
        <MapPin className="size-5 shrink-0 text-primary" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-foreground">{selected.name}</p>
          {selected.formattedAddress && <p className="truncate text-sm text-muted-foreground">{selected.formattedAddress}</p>}
        </div>
        <button
          type="button"
          onClick={clearSelection}
          aria-label="Ganti tempat"
          className="flex size-11 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-mint-strong hover:text-primary"
        >
          <X className="size-5" aria-hidden="true" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={listId ? `${listId}-input` : undefined} className="text-sm font-semibold text-foreground">
        {label}
      </label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <input
          ref={inputRef}
          id={`${listId}-input`}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ketik nama tempat, mis. Tuku Menteng"
          role="combobox"
          aria-expanded={suggestions.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          className="min-h-11 w-full rounded-xl border border-border-strong bg-background py-2 pl-11 pr-4 text-base text-foreground placeholder:text-muted-foreground"
        />
      </div>

      {status === 'loading' && (
        <p role="status" className="text-sm text-muted-foreground">
          Mencari tempat…
        </p>
      )}
      {status === 'error' && (
        <p role="alert" className="text-sm font-medium text-danger">
          Tidak dapat mencari tempat saat ini. Coba lagi.
        </p>
      )}

      {suggestions.length > 0 && (
        <ul id={listId} className="flex flex-col divide-y divide-border overflow-hidden rounded-xl border border-border">
          {suggestions.map((s) => (
            <li key={s.placeId}>
              <button
                type="button"
                onClick={() => void pick(s)}
                disabled={detailLoadingId !== null}
                className={cn(
                  'flex min-h-11 w-full items-center gap-2 px-3 py-2 text-left hover:bg-mint disabled:opacity-60',
                )}
              >
                <MapPin className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-foreground">{s.primaryText}</span>
                  {s.secondaryText && <span className="block truncate text-sm text-muted-foreground">{s.secondaryText}</span>}
                </span>
                {detailLoadingId === s.placeId && (
                  <span role="status" className="text-xs text-muted-foreground">
                    Memuat…
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
