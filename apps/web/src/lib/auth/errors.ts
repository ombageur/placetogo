export type AuthContext = 'login' | 'register' | 'reset' | 'verify' | 'google';

const GENERIC = 'Terjadi kesalahan. Coba lagi beberapa saat lagi.';

/**
 * Memetakan kode galat Firebase Auth ke pesan aman berbahasa Indonesia.
 * - Tidak pernah menampilkan pesan mentah dari SDK.
 * - Masuk: email tidak ada / sandi salah memakai pesan yang sama (anti enumerasi akun).
 * Mengembalikan null bila galat sebaiknya diabaikan (mis. pengguna menutup popup).
 */
export function authErrorMessage(code: string | undefined, context: AuthContext): string | null {
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/invalid-login-credentials':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'Email atau kata sandi salah.';
    case 'auth/email-already-in-use':
      return 'Email ini tidak dapat dipakai untuk mendaftar. Coba masuk, atau gunakan email lain.';
    case 'auth/weak-password':
      return 'Kata sandi terlalu lemah. Gunakan minimal 8 karakter dengan huruf dan angka.';
    case 'auth/invalid-email':
      return 'Format email tidak valid.';
    case 'auth/too-many-requests':
      return 'Terlalu banyak percobaan. Tunggu beberapa saat lalu coba lagi.';
    case 'auth/network-request-failed':
      return 'Koneksi bermasalah. Periksa internet kamu lalu coba lagi.';
    case 'auth/user-disabled':
      return 'Akun ini tidak dapat digunakan saat ini.';
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return null;
    case 'auth/popup-blocked':
      return 'Jendela masuk diblokir peramban. Izinkan popup lalu coba lagi.';
    case 'auth/account-exists-with-different-credential':
      return context === 'google'
        ? 'Akun dengan email ini sudah ada dengan cara masuk lain. Masuk dengan email dan kata sandi.'
        : GENERIC;
    default:
      return GENERIC;
  }
}

export function errorCodeOf(err: unknown): string | undefined {
  if (typeof err === 'object' && err !== null && 'code' in err) {
    const code = (err as { code: unknown }).code;
    return typeof code === 'string' ? code : undefined;
  }
  return undefined;
}
