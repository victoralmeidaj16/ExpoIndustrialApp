/**
 * Separa contatos, tokens push e metadados privados dos perfis públicos.
 *
 * Por segurança, o padrão é somente diagnóstico:
 *   npm run migrate:visitor-privacy
 *
 * Para aplicar no projeto configurado pelas credenciais do Firebase Admin:
 *   npm run migrate:visitor-privacy -- --apply
 */
import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore, type DocumentData } from 'firebase-admin/firestore';

const PRIVATE_FIELDS = [
  'email',
  'phone',
  'linkedin',
  'website',
  'pushTokens',
  'pushPlatform',
  'pushTokenUpdatedAt',
  'leadCapturedAt',
  'leadSource',
  'badgeLookupId',
] as const;
const APPLY = process.argv.includes('--apply');
const USERS_PER_BATCH = 150;

function initializeAdmin() {
  if (getApps().length) return;
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  initializeApp({
    credential: serviceAccountJson
      ? cert(JSON.parse(serviceAccountJson))
      : applicationDefault(),
  });
}

function selectedFields(data: DocumentData) {
  return Object.fromEntries(
    PRIVATE_FIELDS
      .filter((key) => data[key] !== undefined)
      .map((key) => [key, data[key]]),
  );
}

async function main() {
  initializeAdmin();
  const db = getFirestore();
  const visitors = await db.collection('visitors').get();
  const candidates = visitors.docs.filter((snap) => PRIVATE_FIELDS.some((key) => key in snap.data()));

  console.log(`Visitantes analisados: ${visitors.size}`);
  console.log(`Perfis públicos com dados privados: ${candidates.length}`);
  console.log(APPLY ? 'Modo: APLICAR' : 'Modo: DIAGNÓSTICO (nenhuma gravação)');
  if (!APPLY || candidates.length === 0) return;

  for (let offset = 0; offset < candidates.length; offset += USERS_PER_BATCH) {
    const batch = db.batch();
    const group = candidates.slice(offset, offset + USERS_PER_BATCH);

    for (const visitor of group) {
      const data = visitor.data();
      const uid = visitor.id;
      const privateData = selectedFields(data);
      batch.set(db.collection('visitorPrivateProfiles').doc(uid), {
        ...privateData,
        ownerUid: uid,
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      batch.set(db.collection('visitorContactCards').doc(uid), {
        ownerUid: uid,
        email: data.email ?? '',
        phone: data.phone ?? '',
        linkedin: data.linkedin ?? '',
        website: data.website ?? '',
        shareContact: data.shareContact === true,
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      batch.update(visitor.ref, Object.fromEntries(
        PRIVATE_FIELDS.map((key) => [key, FieldValue.delete()]),
      ));
    }

    await batch.commit();
    console.log(`Migrados: ${Math.min(offset + group.length, candidates.length)}/${candidates.length}`);
  }
}

main().catch((error) => {
  console.error('Falha na migração de privacidade:', error);
  process.exitCode = 1;
});
