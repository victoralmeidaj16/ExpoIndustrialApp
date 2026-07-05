/**
 * Carga inicial dos patrocinadores no Firestore usando o Firebase Admin SDK.
 *
 * Uso:
 *   node --env-file=.env --import tsx scripts/seed-sponsors.ts
 */
import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const SPONSORS_COLLECTION = 'sponsors';

const SPONSOR_SEED = [
  { id: 'intel', name: 'Intel', logoText: 'INTEL', tier: 'DIAMOND', order: 0 },
  { id: 'cisco', name: 'Cisco', logoText: 'CISCO', tier: 'DIAMOND', order: 1 },
  { id: 'microsoft', name: 'Microsoft', logoText: 'MICROSOFT', tier: 'GOLD', order: 0 },
  { id: 'dell', name: 'Dell', logoText: 'DELL', tier: 'GOLD', order: 1 },
  { id: 'sap', name: 'SAP', logoText: 'SAP', tier: 'SILVER', order: 0 },
  { id: 'oracle', name: 'Oracle', logoText: 'ORACLE', tier: 'SILVER', order: 1 },
];

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

  for (const sponsor of SPONSOR_SEED) {
    const { id, ...data } = sponsor;
    batch.set(db.collection(SPONSORS_COLLECTION).doc(id), data, { merge: true });
  }

  await batch.commit();
  console.log(`Patrocinadores publicados via Admin: ${SPONSOR_SEED.length}.`);
}

seed().catch((err) => {
  console.error('Falha no seed de patrocinadores via Admin:', err);
  process.exit(1);
});
