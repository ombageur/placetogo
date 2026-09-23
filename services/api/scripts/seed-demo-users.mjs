// Membuat akun demo di Firebase Auth Emulator untuk uji coba lokal.
// HANYA untuk emulator (project demo-placetogo). Jangan pernah dipakai di production.
// Jalankan: node scripts/seed-demo-users.mjs (dari services/api, dengan emulator aktif)
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

process.env.FIREBASE_AUTH_EMULATOR_HOST ??= '127.0.0.1:9099';
const PROJECT = 'demo-placetogo';
const app = initializeApp({ projectId: PROJECT });
const auth = getAuth(app);

const DEMO_USER = { email: 'demo@placetogo.test', password: 'DemoUser2026' };
const DEMO_ADMIN = { email: 'admin@placetogo.test', password: 'DemoAdmin2026' };

async function upsertVerifiedUser({ email, password }) {
  let user;
  try {
    user = await auth.getUserByEmail(email);
    await auth.updateUser(user.uid, { password, emailVerified: true, disabled: false });
  } catch {
    user = await auth.createUser({ email, password, emailVerified: true });
  }
  return user;
}

const user = await upsertVerifiedUser(DEMO_USER);
const admin = await upsertVerifiedUser(DEMO_ADMIN);
await auth.setCustomUserClaims(admin.uid, { admin: true });

console.warn('Akun demo (emulator) siap:');
console.warn(`  User : ${DEMO_USER.email} / ${DEMO_USER.password}  (uid ${user.uid})`);
console.warn(`  Admin: ${DEMO_ADMIN.email} / ${DEMO_ADMIN.password}  (uid ${admin.uid}, custom claim admin=true)`);
console.warn('Catatan: keduanya sudah emailVerified=true. Profil belum diisi — akan diarahkan ke "Lengkapi profil" saat pertama masuk.');
