import type { AccountStage } from '@placetogo/shared';

/**
 * Pengalihan hanya untuk kenyamanan (UX); penegakan akses sebenarnya di Security Rules
 * dan verifikasi token di backend.
 */
export function routeForStage(stage: AccountStage): string {
  switch (stage) {
    case 'verify_email':
      return '/verifikasi-email';
    case 'profile_incomplete':
      return '/lengkapi-profil';
    case 'ready':
      return '/';
  }
}

/** Pengunjung baru melihat pengenalan dahulu; yang sudah pernah langsung ke halaman masuk. */
export function signedOutRoute(seenIntro: boolean): string {
  return seenIntro ? '/masuk' : '/mulai';
}

const INTRO_KEY = 'ptg:intro-seen';

export function hasSeenIntro(): boolean {
  try {
    return window.localStorage.getItem(INTRO_KEY) === '1';
  } catch {
    return false; // penyimpanan diblokir: anggap belum pernah
  }
}

export function markIntroSeen(): void {
  try {
    window.localStorage.setItem(INTRO_KEY, '1');
  } catch {
    /* abaikan: hanya preferensi tampilan */
  }
}
