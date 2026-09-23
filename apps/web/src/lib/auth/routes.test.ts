import { describe, expect, it } from 'vitest';
import { routeForStage, signedOutRoute } from './routes';

describe('routeForStage', () => {
  it('email belum terverifikasi -> halaman verifikasi', () => {
    expect(routeForStage('verify_email')).toBe('/verifikasi-email');
  });
  it('siap -> beranda', () => {
    expect(routeForStage('ready')).toBe('/');
  });
  it('profil belum lengkap -> halaman lengkapi profil', () => {
    expect(routeForStage('profile_incomplete')).toBe('/lengkapi-profil');
  });
});

describe('signedOutRoute', () => {
  it('pengunjung baru ke pengenalan, yang pernah ke masuk', () => {
    expect(signedOutRoute(false)).toBe('/mulai');
    expect(signedOutRoute(true)).toBe('/masuk');
  });
});
