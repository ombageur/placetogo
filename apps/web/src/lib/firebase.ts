'use client';

import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, type Auth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore, type Firestore } from 'firebase/firestore';
import { getPublicEnv } from './env';

let emulatorsConnected = false;

/** Inisialisasi malas: tidak ada koneksi sebelum dipanggil dari komponen klien. */
export function getFirebase(): { app: FirebaseApp; auth: Auth; db: Firestore } {
  const env = getPublicEnv();
  const app = getApps().length
    ? getApp()
    : initializeApp({
        apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
        storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        measurementId: env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
      });
  const auth = getAuth(app);
  const db = getFirestore(app);
  if (env.NEXT_PUBLIC_USE_EMULATORS === 'true' && !emulatorsConnected) {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
    emulatorsConnected = true;
  }
  return { app, auth, db };
}
