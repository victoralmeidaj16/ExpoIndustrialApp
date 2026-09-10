import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { fetchParticipants, synchronize } from './sync.mjs';

const projectId = process.env.GOOGLE_CLOUD_PROJECT;
const eventId = process.env.SYMPLA_EVENT_ID;
const eventHash = process.env.SYMPLA_EVENT_HASH;
const apiKey = process.env.SYMPLA_API;
if (projectId !== 'movie-app-ddda3' || eventId !== '3486582' || eventHash !== 's353376' || !apiKey) throw new Error('Missing or unexpected integration configuration');
initializeApp({ credential: applicationDefault(), projectId });
const db = getFirestore();
try {
  const rows = await fetchParticipants({ apiKey, eventHash });
  const result = await synchronize(db, rows, eventId, process.env.SYMPLA_DRY_RUN !== '0');
  console.log(JSON.stringify({ integration: 'sympla', ...result }));
} catch (error) {
  // Never log provider payloads, participant identifiers, tokens or QR codes.
  console.error(JSON.stringify({ integration: 'sympla', failed: true, code: error.code ?? 'sync-error' }));
  process.exitCode = 1;
} finally {
  await db.terminate();
}
