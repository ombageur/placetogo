import { COLLECTIONS } from '@placetogo/shared';
import { loadEnv } from './config/env.js';
import { initFirebase } from './lib/firebase.js';
import { buildApp } from './app.js';
import { createFirestoreAccountStore } from './modules/accounts/store.js';
import { createFirestoreProfileStore } from './modules/profile/store.js';
import { createTokenVerifier } from './lib/token-verifier.js';
import { notConfiguredPlacesGateway } from './modules/maps/contract.js';
import { createGooglePlacesGateway } from './modules/maps/google-places-gateway.js';
import { createFirestoreActivityStore } from './modules/activities/store.js';
import { createFirestoreChatStore } from './modules/chat/store.js';
import { createFirestoreAppreciationStore } from './modules/appreciations/store.js';
import { DokuPaymentService } from './modules/doku/doku-service.js';
import { FirestoreWalletStore } from './modules/wallet/store.js';
import { FirestoreNotificationStore } from './modules/notifications/store.js';
import { FirestoreReportStore } from './modules/reports/store.js';

const env = loadEnv();
const { auth, db } = initFirebase(env);

const dokuGateway = new DokuPaymentService(
  {
    environment: env.DOKU_ENVIRONMENT,
    clientId: env.DOKU_CLIENT_ID,
    secretKey: env.DOKU_SECRET_KEY,
  },
  env.WEB_ORIGIN,
);
const walletStore = new FirestoreWalletStore(db, dokuGateway);
const notificationStore = new FirestoreNotificationStore(db);
const reportStore = new FirestoreReportStore(db, notificationStore);

const app = await buildApp({
  env,
  verifyToken: createTokenVerifier(auth),
  accounts: createFirestoreAccountStore(db),
  profiles: createFirestoreProfileStore(db),
  places: env.GOOGLE_MAPS_SERVER_API_KEY ? createGooglePlacesGateway(env.GOOGLE_MAPS_SERVER_API_KEY) : notConfiguredPlacesGateway,
  activities: createFirestoreActivityStore(db, notificationStore),
  chat: createFirestoreChatStore(db),
  appreciations: createFirestoreAppreciationStore(db, walletStore, notificationStore),
  wallet: walletStore,
  doku: dokuGateway,
  notifications: notificationStore,
  reports: reportStore,
  readiness: {
    // Baca satu dokumen; tidak memindai koleksi.
    firestore: async () => {
      await db.collection(COLLECTIONS.users).doc('_readiness').get();
    },
  },
});



const shutdown = async () => {
  await app.close();
  process.exit(0);
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

await app.listen({ port: env.PORT, host: '0.0.0.0' });
