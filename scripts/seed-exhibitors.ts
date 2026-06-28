/**
 * Carga inicial dos expositores no Firestore.
 *
 * Lê o array `BOOTHS` (a fonte atual) e grava um documento por estande na
 * coleção `exhibitors`, já com `status: 'published'`. Idempotente: rodar de
 * novo apenas sobrescreve (merge) os mesmos documentos.
 *
 * Como rodar (com o `.env` preenchido):
 *   node --env-file=.env --import tsx scripts/seed-exhibitors.ts
 */
import { initializeApp } from 'firebase/app';
import { doc, getFirestore, writeBatch } from 'firebase/firestore';

import { BOOTHS } from '../src/features/venue/venue';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

if (!firebaseConfig.projectId) {
  console.error('✖ Falta configurar o .env (EXPO_PUBLIC_FIREBASE_*). Veja .env.example.');
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seed() {
  const batch = writeBatch(db);

  for (const booth of BOOTHS) {
    const { id, ...data } = booth;
    batch.set(
      doc(db, 'exhibitors', id),
      { ...data, status: 'published', ownerUid: null },
      { merge: true },
    );
  }

  await batch.commit();
  console.log(`✓ ${BOOTHS.length} expositores gravados na coleção "exhibitors".`);
  process.exit(0);
}

seed().catch((err) => {
  console.error('✖ Falha no seed:', err);
  process.exit(1);
});
