/**
 * Carga inicial da agenda no Firestore usando o Firebase Admin SDK (para ter permissão de escrita).
 *
 * Uso:
 *   node --env-file=.env --import tsx scripts/seed-sessions.ts
 */
import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

import { SESSIONS_COLLECTION, SESSION_SEED } from '../src/features/agenda/session';

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

const OLD_MOCK_IDS = [
  'd1-1', 'd1-2', 'd1-3', 'd1-4', 'd1-5',
  'd2-1', 'd2-2', 'd2-3',
  'd3-1', 'd3-2',
  'd4-1'
];

async function seed() {
  const batch = db.batch();

  // Remove as sessões mockadas antigas
  for (const oldId of OLD_MOCK_IDS) {
    batch.delete(db.collection(SESSIONS_COLLECTION).doc(oldId));
  }

  // Adiciona as novas sessões reais
  for (const session of SESSION_SEED) {
    const { id, ...data } = session;
    batch.set(db.collection(SESSIONS_COLLECTION).doc(id), data, { merge: true });
  }

  await batch.commit();
  console.log(`Agenda publicada via Admin: ${SESSION_SEED.length} sessões reais adicionadas. ${OLD_MOCK_IDS.length} mockadas removidas.`);
}

seed().catch((err) => {
  console.error('Falha no seed de sessões via Admin:', err);
  process.exit(1);
});
