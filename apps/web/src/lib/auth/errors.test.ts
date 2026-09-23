import { describe, expect, it } from 'vitest';
import { authErrorMessage, errorCodeOf } from './errors';

describe('authErrorMessage', () => {
  it('email tidak terdaftar dan sandi salah memakai pesan yang sama (anti enumerasi)', () => {
    const a = authErrorMessage('auth/user-not-found', 'login');
    const b = authErrorMessage('auth/wrong-password', 'login');
    const c = authErrorMessage('auth/invalid-credential', 'login');
    expect(a).toBe(b);
    expect(b).toBe(c);
    expect(a).toBe('Email atau kata sandi salah.');
  });

  it('kode tak dikenal menghasilkan pesan generik tanpa membocorkan kode', () => {
    const msg = authErrorMessage('auth/internal-error-rahasia', 'login');
    expect(msg).toMatch(/Terjadi kesalahan/);
    expect(msg).not.toContain('rahasia');
    expect(authErrorMessage(undefined, 'login')).toMatch(/Terjadi kesalahan/);
  });

  it('popup ditutup pengguna diabaikan', () => {
    expect(authErrorMessage('auth/popup-closed-by-user', 'google')).toBeNull();
  });

  it('too-many-requests dan jaringan punya pesan ramah', () => {
    expect(authErrorMessage('auth/too-many-requests', 'login')).toMatch(/Terlalu banyak/);
    expect(authErrorMessage('auth/network-request-failed', 'login')).toMatch(/Koneksi/);
  });

  it('semua pesan berbahasa Indonesia dan tidak memuat "auth/"', () => {
    for (const code of [
      'auth/email-already-in-use',
      'auth/weak-password',
      'auth/invalid-email',
      'auth/user-disabled',
      'auth/popup-blocked',
    ]) {
      expect(authErrorMessage(code, 'register')).not.toMatch(/auth\//);
    }
  });
});

describe('errorCodeOf', () => {
  it('mengambil code string dan mengabaikan bentuk lain', () => {
    expect(errorCodeOf({ code: 'auth/x' })).toBe('auth/x');
    expect(errorCodeOf(new Error('x'))).toBeUndefined();
    expect(errorCodeOf(null)).toBeUndefined();
    expect(errorCodeOf({ code: 5 })).toBeUndefined();
  });
});
