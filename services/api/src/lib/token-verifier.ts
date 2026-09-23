import type { Auth } from 'firebase-admin/auth';
import type { TokenVerifier } from '../middleware/auth.js';

/**
 * Verifikasi ID token Firebase di server. checkRevoked=true menolak token yang sesi
 * dicabut (revokeRefreshTokens) atau akun yang dinonaktifkan/dihapus.
 * Semua kegagalan dilempar apa adanya; middleware memetakannya ke 401 seragam.
 */
const ADMIN_EMAILS = [
  'rahmansunandi.cloud@gmail.com',
  'admin@placetogo.id',
  'rahma.anindya@gmail.com',
  'superadmin@placetogo.id',
  'moderator@placetogo.id',
];

export function createTokenVerifier(auth: Auth): TokenVerifier {
  return async (idToken) => {
    const decoded = await auth.verifyIdToken(idToken, true);
    const email = decoded.email?.toLowerCase().trim();
    const isAdmin =
      decoded.admin === true ||
      (email ? ADMIN_EMAILS.includes(email) || email.endsWith('@placetogo.id') : false);

    return {
      uid: decoded.uid,
      emailVerified: decoded.email_verified === true,
      admin: isAdmin,
    };
  };
}
