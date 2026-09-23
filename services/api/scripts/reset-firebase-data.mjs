/**
 * Script untuk Mereset / Menghapus Data Lama di Firebase & Cloud
 *
 * Mendukung:
 * 1. Firebase Emulator (Local)
 * 2. Cloud / Firebase Project (Dev/Staging/Prod) dengan safety guard (--force flag)
 *
 * Menghapus:
 * - Seluruh dokumen dan subkoleksi Firestore
 * - Seluruh objek di Firebase / Google Cloud Storage bucket
 * - Seluruh pengguna di Firebase Authentication
 *
 * Penggunaan:
 *   node services/api/scripts/reset-firebase-data.mjs [--emulator] [--force] [--project=PROJECT_ID]
 */

import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';

const args = process.argv.slice(2);
const isEmulatorArg = args.includes('--emulator');
const isForceArg = args.includes('--force');
const projectArg = args.find((a) => a.startsWith('--project='))?.split('=')[1];

const isEmulator = isEmulatorArg || !!process.env.FIRESTORE_EMULATOR_HOST || !!process.env.FIREBASE_AUTH_EMULATOR_HOST;

if (isEmulator) {
  process.env.FIREBASE_AUTH_EMULATOR_HOST ??= '127.0.0.1:9099';
  process.env.FIRESTORE_EMULATOR_HOST ??= '127.0.0.1:8080';
  process.env.FIREBASE_STORAGE_EMULATOR_HOST ??= '127.0.0.1:9199';
}

const projectId = projectArg || process.env.GCLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID || (isEmulator ? 'demo-placetogo' : null);

if (!projectId) {
  console.error('❌ Error: Project ID tidak ditentukan. Gunakan parameter --project=<PROJECT_ID> atau tentukan environment variable.');
  process.exit(1);
}

if (!isEmulator && !isForceArg) {
  console.error('\n⚠️  PERINGATAN: Anda sedang menargetkan LIVE CLOUD / FIREBASE PROJECT:', projectId);
  console.error('Tindakan ini akan MENGHAPUS SEMUA DATA (Firestore, Storage, Auth) secara PERMANEN!');
  console.error('Untuk melanjutkan, jalankan perintah dengan flag --force:');
  console.error(`  node services/api/scripts/reset-firebase-data.mjs --project=${projectId} --force\n`);
  process.exit(1);
}

console.log(`\n======================================================`);
console.log(`🧹 MEMULAI RESET DATA: ${isEmulator ? '[EMULATOR]' : '[LIVE CLOUD PROJECT]'}`);
console.log(`📌 Project ID: ${projectId}`);
console.log(`======================================================\n`);

const app = getApps().length === 0 ? initializeApp({ projectId }) : getApps()[0];
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

async function resetFirestore() {
  console.log('⏳ 1. Menghapus data Firestore...');
  if (isEmulator) {
    try {
      const res = await fetch(`http://127.0.0.1:8080/emulator/v1/projects/${projectId}/databases/(default)/documents`, {
        method: 'DELETE',
      });
      if (res.ok) {
        console.log('   ✅ Firestore emulator data berhasil di-reset.');
        return;
      }
    } catch {
      // Fallback ke recursive delete jika REST endpoint gagal
    }
  }

  const collections = await db.listCollections();
  if (collections.length === 0) {
    console.log('   ℹ️  Firestore sudah bersih (tidak ada koleksi).');
    return;
  }

  for (const col of collections) {
    console.log(`   - Menghapus koleksi: ${col.id}...`);
    await db.recursiveDelete(col);
  }
  console.log('   ✅ Seluruh koleksi Firestore berhasil dihapus.');
}

async function resetAuth() {
  console.log('⏳ 2. Menghapus data Firebase Auth...');
  if (isEmulator) {
    try {
      const res = await fetch(`http://127.0.0.1:9099/emulator/v1/projects/${projectId}/accounts`, {
        method: 'DELETE',
      });
      if (res.ok) {
        console.log('   ✅ Firebase Auth emulator data berhasil di-reset.');
        return;
      }
    } catch {
      // Fallback ke list & delete
    }
  }

  let totalDeleted = 0;
  let pageToken;
  do {
    const listResult = await auth.listUsers(100, pageToken);
    const uids = listResult.users.map((u) => u.uid);
    if (uids.length > 0) {
      const deleteResult = await auth.deleteUsers(uids);
      totalDeleted += deleteResult.successCount;
    }
    pageToken = listResult.pageToken;
  } while (pageToken);

  console.log(`   ✅ Selesai: ${totalDeleted} akun user dihapus.`);
}

async function resetStorage() {
  console.log('⏳ 3. Menghapus file di Firebase Storage...');
  try {
    const bucketName = process.env.STORAGE_BUCKET || `${projectId}.appspot.com` || `${projectId}.firebasestorage.app`;
    const bucket = storage.bucket(bucketName);
    const [exists] = await bucket.exists().catch(() => [false]);
    if (!exists && !isEmulator) {
      console.log(`   ℹ️  Bucket ${bucketName} tidak ditemukan atau belum dibuat.`);
      return;
    }
    await bucket.deleteFiles({ force: true });
    console.log('   ✅ Seluruh file di Firebase Storage berhasil dihapus.');
  } catch (err) {
    console.warn('   ⚠️  Catatan Storage:', err.message);
  }
}

async function main() {
  try {
    await resetFirestore();
    await resetAuth();
    await resetStorage();
    console.log('\n✨ SEMUA DATA LAMA BERHASIL DIBERSIHKAN!');
    console.log('Aplikasi Anda sekarang siap dimulai dengan data baru.\n');
  } catch (error) {
    console.error('\n❌ Terjadi kesalahan saat menghapus data:', error);
    process.exit(1);
  }
}

main();
