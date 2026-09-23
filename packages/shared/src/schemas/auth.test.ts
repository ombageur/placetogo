import { describe, expect, it } from 'vitest';
import { loginSchema, passwordSchema, registerSchema, resetRequestSchema, resolveAccountStage } from '../index.js';

describe('registerSchema', () => {
  it('menormalisasi email', () => {
    const r = registerSchema.parse({ email: '  Halo@Example.COM ', password: 'abcd1234' });
    expect(r.email).toBe('halo@example.com');
  });
  it('menolak email tidak valid', () => {
    expect(registerSchema.safeParse({ email: 'bukan-email', password: 'abcd1234' }).success).toBe(false);
  });
  it.each(['pendek1', 'hurufsajahurufsaja', '1234567890'])('menolak kata sandi lemah: %s', (p) => {
    expect(passwordSchema.safeParse(p).success).toBe(false);
  });
  it('menolak kata sandi > 128 karakter', () => {
    expect(passwordSchema.safeParse('a1'.repeat(65)).success).toBe(false);
  });
  it('menerima kata sandi valid', () => {
    expect(passwordSchema.safeParse('kopisenja2026').success).toBe(true);
  });
});

describe('loginSchema', () => {
  it('tidak menerapkan kebijakan kata sandi (tidak membocorkan aturan)', () => {
    expect(loginSchema.safeParse({ email: 'a@b.co', password: 'x' }).success).toBe(true);
  });
  it('menolak kata sandi kosong', () => {
    expect(loginSchema.safeParse({ email: 'a@b.co', password: '' }).success).toBe(false);
  });
});

describe('resetRequestSchema', () => {
  it('memvalidasi email', () => {
    expect(resetRequestSchema.safeParse({ email: 'x' }).success).toBe(false);
    expect(resetRequestSchema.safeParse({ email: 'x@y.co' }).success).toBe(true);
  });
});

describe('resolveAccountStage', () => {
  it('email belum terverifikasi selalu verify_email', () => {
    expect(resolveAccountStage({ emailVerified: false, profileComplete: true })).toBe('verify_email');
    expect(resolveAccountStage({ emailVerified: false, profileComplete: false })).toBe('verify_email');
  });
  it('terverifikasi tapi profil belum lengkap', () => {
    expect(resolveAccountStage({ emailVerified: true, profileComplete: false })).toBe('profile_incomplete');
  });
  it('siap dipakai', () => {
    expect(resolveAccountStage({ emailVerified: true, profileComplete: true })).toBe('ready');
  });
});
