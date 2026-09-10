import { NextResponse } from 'next/server';
import { createHash } from 'node:crypto';

import { getAdminDb } from '@/lib/admin-firebase';

type WebhookObject = Record<string, unknown>;

function asObject(value: unknown): WebhookObject {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as WebhookObject
    : {};
}

function firstText(...values: unknown[]): string {
  const value = values.find((item) => typeof item === 'string' || typeof item === 'number');
  return value === undefined ? '' : String(value);
}

/**
 * Webhook para receber novos cadastros/pedidos da Sympla em tempo real.
 * Suporta integração direta ou via Zapier/Pluga.
 *
 * Endpoint: POST /api/webhooks/sympla
 *
 * Usa o Firebase Admin SDK (as Security Rules exigem admin para escrever em
 * paidEvents/{id}/attendees). Requer a env FIREBASE_SERVICE_ACCOUNT_JSON com o
 * JSON da service account. SYMPLA_WEBHOOK_SECRET é obrigatória e o header
 * "x-webhook-secret" (ou query ?secret=) precisa corresponder ao segredo.
 */

export async function POST(request: Request) {
  try {
    const secret = process.env.SYMPLA_WEBHOOK_SECRET?.trim();
    if (!secret) {
      console.error('Webhook Sympla bloqueado: SYMPLA_WEBHOOK_SECRET ausente.');
      return NextResponse.json({ error: 'Integração não configurada' }, { status: 503 });
    }
    const provided =
      request.headers.get('x-webhook-secret') ||
      new URL(request.url).searchParams.get('secret');
    if (provided !== secret) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const db = getAdminDb();

    const body = asObject(await request.json());
    console.log('Webhook Sympla autenticado recebido.');

    // Mapeamento resiliente do payload (extraindo de qualquer nível comum de objetos)
    const data = asObject(body.data ?? body.participant ?? body);

    const email = firstText(data.email, data.userEmail, body.email).trim().toLowerCase();
    if (!email) {
      return NextResponse.json({ error: 'Email não encontrado no payload' }, { status: 400 });
    }

    const firstName = firstText(data.first_name, data.firstName);
    const lastName = firstText(data.last_name, data.lastName);
    const fullName = firstText(data.fullName, data.name, `${firstName} ${lastName}`).trim();

    const ticketQrCode = firstText(data.ticket_num_qr_code, data.ticketQrCode, data.ticket_number, data.ticketCode);
    const ticketQrHash = hashTicketQrCode(ticketQrCode);
    const ticketNumber = firstText(data.ticket_number, ticketQrCode);
    const ticketName = firstText(data.ticket_name, data.ticketName) || 'Acesso';
    // Payload manda; senão, a edição configurada no deploy (SYMPLA_EVENT_ID).
    const eventId = String(
      firstText(data.event_id, data.eventId, body.event_id, process.env.SYMPLA_EVENT_ID?.trim()) || '3486582'
    );

    const company = firstText(data.company) || getCustomFieldValue(data.custom_form, 'EMPRESA');
    const role = firstText(data.role, data.job)
      || getCustomFieldValue(data.custom_form, ' CARGO')
      || getCustomFieldValue(data.custom_form, 'CARGO');
    const phone = firstText(data.phone) || getCustomFieldValue(data.custom_form, 'WHATSAPP');

    // Acesso só é liberado com confirmação explícita. Payload sem status fica
    // pendente para impedir que uma integração incompleta conceda acesso.
    const orderStatus = firstText(data.order_status, data.orderStatus, body.order_status)
      .trim()
      .toLowerCase();
    const approved = ['a', 'approved', 'paid'].includes(orderStatus);
    const revoked = ['c', 'cancelled', 'canceled', 'r', 'refunded', 'declined'].includes(orderStatus);
    const accessStatus = approved ? 'paid' : revoked ? 'cancelled' : 'pending';

    const paidEventId = `sympla-${eventId}`;

    await db
      .collection('paidEvents')
      .doc(paidEventId)
      .collection('attendees')
      .doc(email)
      .set(
        {
          status: accessStatus,
          orderStatus,
          userEmailLower: email,
          fullName: fullName || 'Visitante Sympla',
          ticketNumber,
          ticketQrCode,
          ticketQrHash,
          ticketName,
          source: 'sympla',
          symplaEventId: eventId,
          company,
          role,
          phone,
          syncedAt: Date.now(),
          realtimeWebhook: true,
        },
        { merge: true }
      );

    // O conjunto de campos abaixo é subconjunto estrito do `hasOnly` das Security
    // Rules para `ticketQrLookups`. Num merge o `request.resource.data` é o doc
    // resultante, então um campo extra aqui bloquearia para sempre o
    // `publishSymplaTicketQrLookup` do app naquele visitante. Não acrescentar campos.
    if (ticketQrHash && approved) {
      await db
        .collection('ticketQrLookups')
        .doc(ticketQrHash)
        .set(
          {
            eventId: paidEventId,
            ticketQrHash,
            userEmailLower: email,
            source: 'sympla',
            // Sem o perfil, o leitor do expositor rejeitava o crachá de quem nunca
            // abriu o app (mesmos campos que o sync em lote grava).
            profile: { name: fullName, company, role, email, phone },
            updatedAt: Date.now(),
          },
          { merge: true }
        );
    } else if (ticketQrHash) {
      // Sem aprovação explícita, o QR deixa de resolver no leitor de crachás.
      await db.collection('ticketQrLookups').doc(ticketQrHash).delete();
    }

    return NextResponse.json({ success: true, email, ticketQrCode });
  } catch (error: unknown) {
    console.error('Erro no Webhook Sympla:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 },
    );
  }
}

function getCustomFieldValue(fields: unknown, name: string): string {
  if (!Array.isArray(fields)) return '';
  const normalizedSearch = name.trim().toLowerCase();
  const found = fields.find(
    (field) => firstText(asObject(field).name).trim().toLowerCase() === normalizedSearch,
  );
  return found ? firstText(asObject(found).value).trim() : '';
}

function hashTicketQrCode(value: string | null | undefined): string {
  const payload = (value ?? '').trim();
  // Sem QR não há índice: o hash do vazio é constante e todos colidiriam num só doc.
  return payload ? createHash('sha256').update(payload).digest('hex') : '';
}
