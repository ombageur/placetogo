'use client';

import * as React from 'react';
import type { ActivityDoc } from '@placetogo/shared';
import type { DiscoveryCursor } from '@/lib/activities/read';
import { discoveryQueryKey, fetchPageFor, type DiscoveryQuery } from '@/lib/activities/query';

export interface DiscoveryFeedState {
  query: DiscoveryQuery;
  items: ActivityDoc[];
  status: 'loading' | 'ready' | 'error';
  loadingMore: boolean;
  hasMore: boolean;
  /** Total dokumen yang terbaca dari Firestore sejauh ini untuk query saat ini (pelaporan biaya). */
  readCount: number;
  /** Mengganti query dan memuat ulang dari awal (dipanggil dari event handler, mis. klik tab/filter). */
  run: (q: DiscoveryQuery) => void;
  loadMore: () => void;
  retry: () => void;
}

/**
 * Mengelola satu feed Discovery (tab/filter/pencarian aktif): memuat halaman pertama saat
 * mount, dan mendukung "Muat lebih banyak" via cursor. `run`/`loadMore`/`retry` hanya boleh
 * dipanggil dari event handler (klik, submit) — bukan dari badan efek lain — karena
 * keduanya memanggil setState secara sinkron di awal (indikator "loading").
 */
export function useDiscoveryFeed(initial: DiscoveryQuery): DiscoveryFeedState {
  const [query, setQuery] = React.useState(initial);
  const [items, setItems] = React.useState<ActivityDoc[]>([]);
  const [cursor, setCursor] = React.useState<DiscoveryCursor | null>(null);
  const [status, setStatus] = React.useState<'loading' | 'ready' | 'error'>('loading');
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [readCount, setReadCount] = React.useState(0);
  const generation = React.useRef(0);

  const run = React.useCallback((next: DiscoveryQuery) => {
    const gen = ++generation.current;
    setQuery(next);
    setStatus('loading');
    setItems([]);
    setCursor(null);
    setReadCount(0);
    void fetchPageFor(next, null)
      .then((page) => {
        if (gen !== generation.current) return;
        setItems(page.items);
        setCursor(page.cursor);
        setReadCount(page.readCount);
        setStatus('ready');
      })
      .catch(() => {
        if (gen !== generation.current) return;
        setStatus('error');
      });
  }, []);

  // Mount pertama: tidak memakai `run` (yang setState sinkron) agar tidak melanggar
  // aturan "jangan setState sinkron di badan efek" — hasil hanya disetel lewat .then().
  // useState (bukan useRef) untuk nilai "hitung sekali di render pertama" karena membaca
  // ref.current sinkron saat render adalah pola yang tidak aman (react-hooks/refs).
  const [initialKey] = React.useState(() => discoveryQueryKey(initial));
  React.useEffect(() => {
    let ignore = false;
    const gen = ++generation.current;
    void fetchPageFor(initial, null)
      .then((page) => {
        if (ignore || gen !== generation.current) return;
        setItems(page.items);
        setCursor(page.cursor);
        setReadCount(page.readCount);
        setStatus('ready');
      })
      .catch(() => {
        if (ignore || gen !== generation.current) return;
        setStatus('error');
      });
    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hanya sekali saat mount; ganti query lewat run()
  }, [initialKey]);

  const loadMore = React.useCallback(() => {
    if (!cursor || loadingMore) return;
    const gen = generation.current;
    setLoadingMore(true);
    void fetchPageFor(query, cursor)
      .then((page) => {
        if (gen !== generation.current) return;
        setItems((prev) => [...prev, ...page.items]);
        setCursor(page.cursor);
        setReadCount((prev) => prev + page.readCount);
      })
      .catch(() => {
        if (gen !== generation.current) return;
        setStatus('error');
      })
      .finally(() => {
        if (gen === generation.current) setLoadingMore(false);
      });
  }, [query, cursor, loadingMore]);

  const retry = React.useCallback(() => run(query), [run, query]);

  return { query, items, status, loadingMore, hasMore: cursor !== null, readCount, run, loadMore, retry };
}
