'use client';

import * as React from 'react';

/** Hitung mundur (detik) untuk mencegah kirim ulang berulang; melengkapi batas dari Firebase. */
export function useCooldown(seconds: number): [remaining: number, start: () => void] {
  const [remaining, setRemaining] = React.useState(0);

  React.useEffect(() => {
    if (remaining <= 0) return;
    const timer = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(timer);
  }, [remaining]);

  const start = React.useCallback(() => setRemaining(seconds), [seconds]);
  return [remaining, start];
}
