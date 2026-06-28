/**
 * Carga inicial dos patrocinadores no Firestore.
 *
 * Uso:
 *   node --env-file=.env --import tsx scripts/seed-sponsors.ts
 */
import { initializeApp } from 'firebase/app';
import { doc, getFirestore, writeBatch } from 'firebase/firestore';

import { SPONSORS_COLLECTION, SPONSOR_SEED } from '../src/features/sponsors/sponsor';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

if (!firebaseConfig.projectId) {
  throw new Error('Preencha EXPO_PUBLIC_FIREBASE_PROJECT_ID no .env antes de rodar o seed.');
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seed() {
  const batch = writeBatch(db);

  for (const sponsor of SPONSOR_SEED) {
    const { id, ...data } = sponsor;
    batch.set(doc(db, SPONSORS_COLLECTION, id), data, { merge: true });
  }

  await batch.commit();
  console.log(`Patrocinadores publicados: ${SPONSOR_SEED.length}.`);
}

seed().catch((err) => {
  console.error('Falha no seed de patrocinadores:', err);
  process.exit(1);
});
