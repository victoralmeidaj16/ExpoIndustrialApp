/**
 * Carga inicial dos expositores no Firestore usando o Firebase Admin SDK (para ter permissão de escrita).
 *
 * Lê o array `BOOTHS` (a fonte atual) e grava um documento por estande na
 * coleção `exhibitors`, já com `status: 'published'`. Idempotente: rodar de
 * novo apenas sobrescreve (merge) os mesmos documentos.
 *
 * Como rodar (com o `.env` preenchido):
 *   node --env-file=.env --import tsx scripts/seed-exhibitors.ts
 */
import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

import { BOOTHS } from '../src/features/venue/venue';

function initializeAdmin() {
  if (getApps().length) return;

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (serviceAccountJson) {
    initializeApp({ credential: cert(JSON.parse(serviceAccountJson)) });
    return;
  }

  initializeApp({ credential: applicationDefault() });
}

initializeAdmin();
const db = getFirestore();

async function seed() {
  const batch = db.batch();

  for (const booth of BOOTHS) {
    const { id, ...data } = booth;
    batch.set(
      db.collection('exhibitors').doc(id),
      { ...data, status: 'published', ownerUid: null },
      { merge: true },
    );
  }

  await batch.commit();
  console.log(`✓ ${BOOTHS.length} expositores gravados via Admin na coleção "exhibitors".`);
  process.exit(0);
}

seed().catch((err) => {
  console.error('✖ Falha no seed via Admin:', err);
  process.exit(1);
});
