import { describe, expect, it } from 'vitest';
import { parsePublicEnv } from './env';

const ok = {
  NEXT_PUBLIC_FIREBASE_API_KEY: 'k',
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'demo-placetogo.firebaseapp.com',
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'demo-placetogo',
  NEXT_PUBLIC_FIREBASE_APP_ID: 'app',
};

describe('parsePublicEnv', () => {
  it('menerima konfigurasi minimal', () => {
    expect(parsePublicEnv(ok).NEXT_PUBLIC_USE_EMULATORS).toBe('false');
  });
  it('menolak konfigurasi tidak lengkap', () => {
    expect(() => parsePublicEnv({})).toThrow(/tidak valid/);
  });
  it('menolak emulator di production', () => {
    expect(() =>
      parsePublicEnv({ ...ok, NEXT_PUBLIC_APP_ENV: 'production', NEXT_PUBLIC_USE_EMULATORS: 'true' }),
    ).toThrow(/Emulator/);
  });
  it('kunci Maps browser opsional: kosong/hanya-spasi jadi undefined, terisi tetap ada', () => {
    expect(parsePublicEnv(ok).NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_API_KEY).toBeUndefined();
    expect(parsePublicEnv({ ...ok, NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_API_KEY: '' }).NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_API_KEY).toBeUndefined();
    expect(parsePublicEnv({ ...ok, NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_API_KEY: '  ' }).NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_API_KEY).toBeUndefined();
    expect(parsePublicEnv({ ...ok, NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_API_KEY: 'AIzaFake' }).NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_API_KEY).toBe(
      'AIzaFake',
    );
  });
});
