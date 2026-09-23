/**
 * Memberi custom claim `admin: true` pada sebuah akun di Firebase Auth Emulator.
 *
 * HANYA untuk emulator. Skrip ini menolak berjalan bila FIREBASE_AUTH_EMULATOR_HOST tidak
 * mengarah ke localhost, supaya tidak ada yang keliru memberi hak admin di project sungguhan.
 * Untuk production, hak admin diberikan lewat prosedur tersendiri yang diaudit, bukan skrip ini.
 *
 * Alamat email diterima sebagai argumen, bukan ditulis di dalam berkas, supaya alamat pribadi
 * tidak ikut tersimpan di repositori.
 *
 *   node services/api/scripts/grant-admin.mjs <email> [password]
 *
 * Bila akunnya belum ada, akun dibuat dengan kata sandi yang diberikan (atau kata sandi
 * pengembangan bawaan) dan langsung ditandai emailVerified.
 */
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

process.env.FIREBASE_AUTH_EMULATOR_HOST ??= '127.0.0.1:9099';

const host = process.env.FIREBASE_AUTH_EMULATOR_HOST;
if (!/^(127\.0\.0\.1|localhost|\[::1\]):\d+$/.test(host)) {
  console.error(`Menolak berjalan: FIREBASE_AUTH_EMULATOR_HOST = "${host}" bukan emulator lokal.`);
  process.exit(1);
}

const [email, passwordArg] = process.argv.slice(2);
if (!email || !email.includes('@')) {
  console.error('Pemakaian: node services/api/scripts/grant-admin.mjs <email> [password]');
  process.exit(1);
}

const password = passwordArg ?? 'AdminLokal2026';
const app = initializeApp({ projectId: 'demo-placetogo' });
const auth = getAuth(app);

let user;
let created = false;
try {
  user = await auth.getUserByEmail(email);
  await auth.updateUser(user.uid, { emailVerified: true, disabled: false });
} catch {
  user = await auth.createUser({ email, password, emailVerified: true });
  created = true;
}

// Claim lain dipertahankan supaya pemberian hak admin tidak menghapus penanda lain.
const claims = { ...(user.customClaims ?? {}), admin: true };
await auth.setCustomUserClaims(user.uid, claims);

console.warn(`${created ? 'Akun dibuat' : 'Akun ditemukan'}: ${email} (uid ${user.uid})`);
console.warn(`Custom claim sekarang: ${JSON.stringify(claims)}`);
if (created) console.warn(`Kata sandi: ${password}`);
console.warn('Token yang sudah terbit belum memuat claim baru. Keluar lalu masuk lagi agar berlaku.');
