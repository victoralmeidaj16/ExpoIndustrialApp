import { NextResponse } from 'next/server';
import { createHash } from 'node:crypto';

import { getAdminDb } from '@/lib/admin-firebase';

/**
 * Webhook para receber novos cadastros/pedidos da Sympla em tempo real.
 * Suporta integração direta ou via Zapier/Pluga.
 *
 * Endpoint: POST /api/webhooks/sympla
 *
 * Usa o Firebase Admin SDK (as Security Rules exigem admin para escrever em
 * paidEvents/{id}/attendees). Requer a env FIREBASE_SERVICE_ACCOUNT_JSON com o
 * JSON da service account. Se SYMPLA_WEBHOOK_SECRET estiver definida, o
 * header "x-webhook-secret" (ou query ?secret=) precisa bater com ela.
 */

export async function POST(request: Request) {
  try {
    const secret = process.env.SYMPLA_WEBHOOK_SECRET;
    if (secret) {
      const provided =
        request.headers.get('x-webhook-secret') ||
        new URL(request.url).searchParams.get('secret');
      if (provided !== secret) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
      }
    }

    const db = getAdminDb();

    const body = await request.json();
    console.log('Webhook Sympla recebido:', JSON.stringify(body));

    // Mapeamento resiliente do payload (extraindo de qualquer nível comum de objetos)
    const data = body.data || body.participant || body;

    const email = (data.email || data.userEmail || body.email || '').trim().toLowerCase();
    if (!email) {
      return NextResponse.json({ error: 'Email não encontrado no payload' }, { status: 400 });
    }

    const first_name = data.first_name || data.firstName || '';
    const last_name = data.last_name || data.lastName || '';
    const fullName = (data.fullName || data.name || `${first_name} ${last_name}`).trim();

    const ticketQrCode = data.ticket_num_qr_code || data.ticketQrCode || data.ticket_number || data.ticketCode || '';
    const ticketQrHash = hashTicketQrCode(ticketQrCode);
    const ticketNumber = data.ticket_number || ticketQrCode;
    const ticketName = data.ticket_name || data.ticketName || 'Acesso';
    const eventId = String(data.event_id || data.eventId || body.event_id || '3486582');

    const company = data.company || (data.custom_form ? getCustomFieldValue(data.custom_form, 'EMPRESA') : '');
    const role = data.role || data.job || (data.custom_form ? (getCustomFieldValue(data.custom_form, ' CARGO') || getCustomFieldValue(data.custom_form, 'CARGO')) : '');
    const phone = data.phone || (data.custom_form ? getCustomFieldValue(data.custom_form, 'WHATSAPP') : '');

    const paidEventId = `sympla-${eventId}`;

    await db
      .collection('paidEvents')
      .doc(paidEventId)
      .collection('attendees')
      .doc(email)
      .set(
        {
          status: 'paid',
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

    if (ticketQrHash) {
      await db
        .collection('ticketQrLookups')
        .doc(ticketQrHash)
        .set(
          {
            eventId: paidEventId,
            ticketQrHash,
            userEmailLower: email,
            source: 'sympla',
            updatedAt: Date.now(),
          },
          { merge: true }
        );
    }

    return NextResponse.json({ success: true, email, ticketQrCode });
  } catch (error: any) {
    console.error('Erro no Webhook Sympla:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function getCustomFieldValue(fields: any, name: string): string {
  if (!Array.isArray(fields)) return '';
  const normalizedSearch = name.trim().toLowerCase();
  const found = fields.find(
    (f: any) => f?.name?.trim()?.toLowerCase() === normalizedSearch
  );
  return found ? (found.value || '').trim() : '';
}

function hashTicketQrCode(value: string | null | undefined): string {
  return createHash('sha256').update((value ?? '').trim()).digest('hex');
}
