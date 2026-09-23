import { getApps, initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import type { Env } from '../config/env.js';

/**
 * Admin SDK melewati Security Rules: setiap handler wajib memeriksa
 * autentikasi, otorisasi, dan input sendiri.
 * Di emulator tidak ada kredensial asli; di Cloud Run memakai ADC (service account).
 */
export function initFirebase(env: Env) {
  const usingEmulator = Boolean(env.FIRESTORE_EMULATOR_HOST || env.FIREBASE_AUTH_EMULATOR_HOST);
  const app =
    getApps()[0] ??
    initializeApp({
      projectId: env.FIREBASE_PROJECT_ID,
      ...(usingEmulator ? {} : { credential: applicationDefault() }),
    });
  return { auth: getAuth(app), db: getFirestore(app) };
}
