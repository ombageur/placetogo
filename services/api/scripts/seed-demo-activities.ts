// Mengisi Firestore Emulator dengan ajakan contoh untuk uji coba Discovery (Fase 04).
// HANYA untuk emulator (project demo-placetogo). Jalankan setelah seed-demo-users.mjs
// (butuh akun demo@placetogo.test sebagai pembuat) dan emulator aktif:
//   pnpm --filter @placetogo/api exec tsx scripts/seed-demo-activities.ts
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { seedActivities } from '../test/seed-activities.js';

process.env.FIREBASE_AUTH_EMULATOR_HOST ??= '127.0.0.1:9099';
process.env.FIRESTORE_EMULATOR_HOST ??= '127.0.0.1:8080';
const PROJECT = 'demo-placetogo';
const DEMO_EMAIL = 'demo@placetogo.test';

const app = initializeApp({ projectId: PROJECT });
const auth = getAuth(app);
const db = getFirestore(app);

const user = await auth.getUserByEmail(DEMO_EMAIL).catch(() => {
  throw new Error(`Akun ${DEMO_EMAIL} belum ada. Jalankan seed-demo-users.mjs terlebih dahulu.`);
});

/*
 * Dibersihkan dulu supaya skrip ini aman dijalankan berulang. Tanpa ini setiap eksekusi
 * menambah sepuluh ajakan baru dengan id acak, sehingga daftar demo terisi duplikat.
 * recursiveDelete ikut menghapus subkoleksi peserta, permintaan gabung, dan check-in.
 */
const existing = await db.collection('activities').listDocuments();
for (const doc of existing) await db.recursiveDelete(doc);
if (existing.length > 0) console.warn(`${existing.length} ajakan lama dihapus terlebih dahulu.`);

const ids = await seedActivities(db, user.uid);
console.warn(`${ids.length} ajakan contoh dibuat (pembuat: ${DEMO_EMAIL}).`);
console.warn('Termasuk 1 yang sudah kedaluwarsa dan 1 draft — keduanya sengaja TIDAK boleh muncul di Discovery.');
