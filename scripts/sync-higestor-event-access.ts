/**
 * Sincroniza inscritos pagos de um evento HiGestor para o Firestore.
 *
 * Uso:
 *   HIGESTOR_EVENT_ID=123 PAID_EVENT_ID=workshop-ppcp npm run sync:higestor:event
 *
 * Requer credencial server-side do Firebase Admin:
 *   - GOOGLE_APPLICATION_CREDENTIALS=/caminho/service-account.json; ou
 *   - FIREBASE_SERVICE_ACCOUNT_JSON='{"project_id":"...","client_email":"...","private_key":"..."}'
 *
 * A chave HIGESTOR_API_KEY vem do .env e nunca deve ser exposta no app Expo.
 */
import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, type WriteBatch } from 'firebase-admin/firestore';

const HIGESTOR_API_BASE = 'https://app.higestor.com.br/api';
const PAGE_LIMIT = 200;

type HigestorInvoice = {
  id?: number | string;
  situacao?: string;
  valor?: string;
  valor_pago?: string;
  data_pagamento?: string | null;
};

type HigestorRegistration = {
  id: string;
  attributes?: {
    nome?: string;
    email?: string;
    cpf_cnpj?: string;
    presenca_confirmada?: boolean;
    responsavel?: {
      id_responsavel?: number | string;
      id_participacao?: number | string;
      nome?: string;
      cpf_cnpj?: string;
      email?: string;
      telefone?: string;
      descricao_ingresso?: string;
      valor_pago?: string;
    };
    ingresso?: {
      descricao?: string;
      valor?: string;
    };
    faturas?: HigestorInvoice[];
  };
};

type HigestorRegistrationsResponse = {
  data?: HigestorRegistration[];
  errors?: { detail?: string }[];
};

type HigestorEvent = {
  id: string;
  attributes?: {
    tema?: string;
    data?: string;
    data_fim?: string | null;
    hora?: string;
    local?: string;
  };
};

type HigestorEventsResponse = {
  data?: HigestorEvent[];
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

function onlyDigits(value: string | null | undefined): string {
  return (value ?? '').replace(/\D/g, '');
}

function moneyToNumber(value: string | null | undefined): number {
  const normalized = (value ?? '').replace(/\./g, '').replace(',', '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return 'email-invalido';
  return `${local.slice(0, 2)}***@${domain}`;
}

function hasPaidInvoice(invoices: HigestorInvoice[] | undefined): boolean {
  return (invoices ?? []).some((invoice) => {
    const status = (invoice.situacao ?? '').trim().toLowerCase();
    return status === 'pago' || status === 'paga' || status.includes('pago');
  });
}

function isPaidRegistration(registration: HigestorRegistration): boolean {
  const attributes = registration.attributes;
  if (hasPaidInvoice(attributes?.faturas)) return true;
  if (moneyToNumber(attributes?.responsavel?.valor_pago) > 0) return true;
  return false;
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

async function fetchRegistrations(eventId: string, offset: number): Promise<HigestorRegistration[]> {
  const url = new URL(`${HIGESTOR_API_BASE}/eventos/${eventId}/inscricoes`);
  url.searchParams.set('page[limit]', String(PAGE_LIMIT));
  url.searchParams.set('page[offset]', String(offset));

  const response = await fetch(url, {
    headers: {
      'Auth-Token': requiredEnv('HIGESTOR_API_KEY'),
      Accept: 'application/vnd.api+json',
    },
  });

  const json = (await response.json()) as HigestorRegistrationsResponse;

  if (!response.ok) {
    const detail = json.errors?.map((err) => err.detail).filter(Boolean).join('; ');
    throw new Error(`HiGestor respondeu ${response.status}: ${detail || response.statusText}`);
  }

  return json.data ?? [];
}

async function fetchEvents(): Promise<HigestorEvent[]> {
  const url = new URL(`${HIGESTOR_API_BASE}/eventos`);
  url.searchParams.set('page[limit]', '50');
  url.searchParams.set('page[offset]', '0');

  const response = await fetch(url, {
    headers: {
      'Auth-Token': requiredEnv('HIGESTOR_API_KEY'),
      Accept: 'application/vnd.api+json',
    },
  });

  const json = (await response.json()) as HigestorEventsResponse;
  if (!response.ok) {
    const detail = json.errors?.map((err) => err.detail).filter(Boolean).join('; ');
    throw new Error(`HiGestor respondeu ${response.status}: ${detail || response.statusText}`);
  }

  return json.data ?? [];
}

async function commitBatch(batch: WriteBatch, count: number) {
  if (count === 0) return;
  await batch.commit();
}

async function main() {
  const higestorEventId = process.env.HIGESTOR_EVENT_ID?.trim();

  if (!higestorEventId) {
    const events = await fetchEvents();
    console.log('Informe HIGESTOR_EVENT_ID com um dos eventos abaixo:');
    for (const event of events) {
      const attributes = event.attributes ?? {};
      console.log(
        `- ${event.id}: ${attributes.tema || 'sem tema'} ${attributes.data ? `(${attributes.data})` : ''} ${attributes.local ? `- ${attributes.local}` : ''}`,
      );
    }
    return;
  }

  const paidEventId = process.env.PAID_EVENT_ID?.trim() || `higestor-${higestorEventId}`;
  const dryRun = process.env.HIGESTOR_DRY_RUN === '1';
  const includeUnpaid = process.env.HIGESTOR_SYNC_INCLUDE_UNPAID === '1';

  if (!dryRun) {
    initializeAdmin();
  }
  const db = dryRun ? null : getFirestore();

  let offset = 0;
  let fetched = 0;
  let written = 0;
  let skippedNoEmail = 0;
  let skippedUnpaid = 0;
  let batch: WriteBatch | null = db?.batch() ?? null;
  let batchCount = 0;

  if (!dryRun) {
    if (!db || !batch) throw new Error('Firestore Admin não inicializado.');
    batch.set(
      db.collection('paidEvents').doc(paidEventId),
      {
        title: process.env.PAID_EVENT_TITLE || `Evento pago ${higestorEventId}`,
        description: process.env.PAID_EVENT_DESCRIPTION || '',
        dateLabel: process.env.PAID_EVENT_DATE_LABEL || '',
        location: process.env.PAID_EVENT_LOCATION || '',
        higestorEventId,
        paymentUrl: process.env.PAID_EVENT_PAYMENT_URL || '',
        order: Number(process.env.PAID_EVENT_ORDER ?? 0),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      { merge: true },
    );
    batchCount += 1;
  }

  while (true) {
    const registrations = await fetchRegistrations(higestorEventId, offset);
    fetched += registrations.length;

    for (const registration of registrations) {
      const attributes = registration.attributes ?? {};
      const email = normalizeEmail(attributes.email || attributes.responsavel?.email);
      const paid = isPaidRegistration(registration);

      if (!email) {
        skippedNoEmail += 1;
        continue;
      }

      if (!paid && !includeUnpaid) {
        skippedUnpaid += 1;
        continue;
      }

      const cpf = onlyDigits(attributes.cpf_cnpj || attributes.responsavel?.cpf_cnpj);
      const docRef = db
        ?.collection('paidEvents')
        .doc(paidEventId)
        .collection('attendees')
        .doc(email);

      const data = {
        status: paid ? 'paid' : 'pending',
        userEmailLower: email,
        fullName: attributes.nome || attributes.responsavel?.nome || '',
        cpfLast4: cpf ? cpf.slice(-4) : '',
        source: 'higestor',
        higestorEventId,
        higestorRegistrationId: registration.id,
        higestorResponsibleId: attributes.responsavel?.id_responsavel ?? null,
        ticketDescription: attributes.ingresso?.descricao || attributes.responsavel?.descricao_ingresso || '',
        paidAmount: attributes.responsavel?.valor_pago || attributes.faturas?.[0]?.valor_pago || '',
        syncedAt: Date.now(),
      };

      if (dryRun) {
        console.log(`[dry-run] ${maskEmail(email)} -> ${data.status}`);
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

    if (registrations.length < PAGE_LIMIT) break;
    offset += PAGE_LIMIT;
  }

  if (!dryRun) {
    if (!batch) throw new Error('Firestore Admin não inicializado.');
    await commitBatch(batch, batchCount);
  }

  console.log(
    `Sincronização HiGestor concluída: ${fetched} lidos, ${written} ${dryRun ? 'processados' : 'gravados'}, ${skippedUnpaid} sem pagamento, ${skippedNoEmail} sem email.`,
  );
}

main().catch((err) => {
  console.error('Falha ao sincronizar evento HiGestor:', err);
  process.exit(1);
});
