import { NextResponse } from 'next/server';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

/**
 * Webhook para receber novos cadastros/pedidos da Sympla em tempo real.
 * Suporta integração direta ou via Zapier/Pluga.
 *
 * Endpoint: POST /api/webhooks/sympla
 */
export async function POST(request: Request) {
  try {
    if (!db) {
      return NextResponse.json({ error: 'Firebase não configurado' }, { status: 500 });
    }

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
    const ticketNumber = data.ticket_number || ticketQrCode;
    const ticketName = data.ticket_name || data.ticketName || 'Acesso';
    const eventId = String(data.event_id || data.eventId || body.event_id || '3486582');

    const company = data.company || (data.custom_form ? getCustomFieldValue(data.custom_form, 'EMPRESA') : '');
    const role = data.role || data.job || (data.custom_form ? (getCustomFieldValue(data.custom_form, ' CARGO') || getCustomFieldValue(data.custom_form, 'CARGO')) : '');
    const phone = data.phone || (data.custom_form ? getCustomFieldValue(data.custom_form, 'WHATSAPP') : '');

    const paidEventId = `sympla-${eventId}`;

    const docRef = doc(db, 'paidEvents', paidEventId, 'attendees', email);
    await setDoc(docRef, {
      status: 'paid',
      userEmailLower: email,
      fullName: fullName || 'Visitante Sympla',
      ticketNumber,
      ticketQrCode,
      ticketName,
      source: 'sympla',
      symplaEventId: eventId,
      company,
      role,
      phone,
      syncedAt: Date.now(),
      realtimeWebhook: true
    }, { merge: true });

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
