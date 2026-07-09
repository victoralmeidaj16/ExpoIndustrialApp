/**
 * Sincroniza participantes de um evento Sympla para o Firestore.
 *
 * Uso:
 *   SYMPLA_EVENT_ID=3486582 npm run sync:sympla:event
 *
 * Requer credencial server-side do Firebase Admin:
 *   - GOOGLE_APPLICATION_CREDENTIALS=/caminho/service-account.json; ou
 *   - FIREBASE_SERVICE_ACCOUNT_JSON='{"project_id":"...","client_email":"...","private_key":"..."}'
 *
 * A chave SYMPLA_API vem do .env e nunca deve ser exposta no app Expo.
 */
import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, type WriteBatch } from 'firebase-admin/firestore';

const SYMPLA_API_BASE = 'https://api.sympla.com.br/public/v3';
const PAGE_SIZE = 100;

type SymplaCustomField = {
  id: number;
  name: string;
  value: string;
};

type SymplaParticipant = {
  id: number;
  event_id: number;
  order_id: string;
  order_status: string; // "A" = Aprovado, etc.
  ticket_number: string;
  ticket_num_qr_code: string;
  ticket_name: string;
  first_name: string;
  last_name: string;
  email: string;
  custom_form?: SymplaCustomField[];
};

type SymplaPagination = {
  has_next: boolean;
  has_prev: boolean;
  quantity: number;
  offset: number;
  page: number;
  page_size: number;
  total_page: number;
};

type SymplaParticipantsResponse = {
  data?: SymplaParticipant[];
  pagination?: SymplaPagination;
  errors?: { detail?: string }[];
};

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Preencha ${name} antes de rodar a sincronização.`);
  return value;
}

function normalizeEmail(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return 'email-invalido';
  return `${local.slice(0, 2)}***@${domain}`;
}

function getCustomFieldValue(fields: SymplaCustomField[] | undefined, name: string): string {
  if (!fields) return '';
  const normalizedSearch = name.trim().toLowerCase();
  const found = fields.find(
    (f) => f.name.trim().toLowerCase() === normalizedSearch
  );
  return found ? found.value.trim() : '';
}

function initializeAdmin() {
  if (getApps().length) return;

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (serviceAccountJson) {
    initializeApp({ credential: cert(JSON.parse(serviceAccountJson)) });
    return;
  }

  initializeApp({ credential: applicationDefault() });
}

async function fetchParticipants(eventId: string, page: number): Promise<{ data: SymplaParticipant[]; hasNext: boolean }> {
  const url = new URL(`${SYMPLA_API_BASE}/events/${eventId}/participants`);
  url.searchParams.set('page_size', String(PAGE_SIZE));
  url.searchParams.set('page', String(page));

  const response = await fetch(url, {
    headers: {
      's_token': requiredEnv('SYMPLA_API'),
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Sympla respondeu ${response.status}: ${text}`);
  }

  const json = (await response.json()) as SymplaParticipantsResponse;
  return {
    data: json.data ?? [],
    hasNext: json.pagination?.has_next ?? false,
  };
}

async function commitBatch(batch: WriteBatch, count: number) {
  if (count === 0) return;
  await batch.commit();
}

async function main() {
  const symplaEventId = process.env.SYMPLA_EVENT_ID?.trim() || '3486582';
  const paidEventId = process.env.PAID_EVENT_ID?.trim() || `sympla-${symplaEventId}`;
  const dryRun = process.env.SYMPLA_DRY_RUN === '1';

  if (!dryRun) {
    initializeAdmin();
  }
  const db = dryRun ? null : getFirestore();

  let page = 1;
  let fetched = 0;
  let written = 0;
  let skippedNoEmail = 0;
  let skippedNotApproved = 0;
  let batch: WriteBatch | null = db?.batch() ?? null;
  let batchCount = 0;

  // Garantir que o evento principal exista na coleção paidEvents
  if (!dryRun) {
    if (!db || !batch) throw new Error('Firestore Admin não inicializado.');
    batch.set(
      db.collection('paidEvents').doc(paidEventId),
      {
        title: process.env.PAID_EVENT_TITLE || 'EXPOINDUSTRIAL SUL 2026',
        description: process.env.PAID_EVENT_DESCRIPTION || 'Credenciamento e Acesso à Feira',
        dateLabel: process.env.PAID_EVENT_DATE_LABEL || '16-19 Nov 2026',
        location: process.env.PAID_EVENT_LOCATION || 'Expocentro Edmundo Doubrawa, Joinville/SC',
        symplaEventId,
        order: Number(process.env.PAID_EVENT_ORDER ?? 0),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      { merge: true }
    );
    batchCount += 1;
  }

  while (true) {
    console.log(`Buscando participantes da Sympla (página ${page})...`);
    const { data: participants, hasNext } = await fetchParticipants(symplaEventId, page);
    fetched += participants.length;

    for (const participant of participants) {
      const email = normalizeEmail(participant.email);
      // Status 'A' representa Aprovado (confirmado).
      const isApproved = participant.order_status === 'A' || participant.order_status === 'approved';

      if (!email) {
        skippedNoEmail += 1;
        continue;
      }

      if (!isApproved) {
        skippedNotApproved += 1;
        continue;
      }

      const customFields = participant.custom_form ?? [];
      const whatsapp = getCustomFieldValue(customFields, 'WHATSAPP');
      const company = getCustomFieldValue(customFields, 'EMPRESA');
      const role = getCustomFieldValue(customFields, ' CARGO') || getCustomFieldValue(customFields, 'CARGO');
      const cityState = getCustomFieldValue(customFields, 'Cidade/Estado');

      const docRef = db
        ?.collection('paidEvents')
        .doc(paidEventId)
        .collection('attendees')
        .doc(email);

      const data = {
        status: 'paid', // Como é o ingresso de acesso, liberado = paid
        userEmailLower: email,
        fullName: `${participant.first_name} ${participant.last_name}`.trim(),
        ticketNumber: participant.ticket_number,
        ticketQrCode: participant.ticket_num_qr_code,
        ticketName: participant.ticket_name,
        source: 'sympla',
        symplaEventId,
        symplaParticipantId: participant.id,
        orderId: participant.order_id,
        phone: whatsapp,
        company: company,
        role: role,
        cityState: cityState,
        syncedAt: Date.now(),
      };

      if (dryRun) {
        console.log(`[dry-run] ${maskEmail(email)} (${data.fullName}) -> ${data.ticketQrCode}`);
      } else {
        if (!db || !batch || !docRef) throw new Error('Firestore Admin não inicializado.');
        batch.set(docRef, data, { merge: true });
        batchCount += 1;
        if (batchCount >= 450) {
          await commitBatch(batch, batchCount);
          batch = db.batch();
          batchCount = 0;
        }
      }

      written += 1;
    }

    if (!hasNext) break;
    page += 1;
  }

  if (!dryRun) {
    if (!batch) throw new Error('Firestore Admin não inicializado.');
    await commitBatch(batch, batchCount);
  }

  console.log(
    `Sincronização Sympla concluída: ${fetched} lidos, ${written} ${dryRun ? 'processados' : 'gravados'}, ${skippedNotApproved} não aprovados, ${skippedNoEmail} sem email.`
  );
}

main().catch((err) => {
  console.error('Falha ao sincronizar evento Sympla:', err);
  process.exit(1);
});
