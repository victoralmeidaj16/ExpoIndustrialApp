import { NextResponse } from 'next/server';

import { getAdminDb, requireAuthUser } from '@/lib/admin-firebase';
import {
  evaluateExhibitorLink,
  isEmailAuthorizedForBooth,
} from '@/lib/exhibitor-link-policy';

// Literal (e não `@/domain/exhibitor`) para não arrastar o SDK cliente do
// Firebase para o bundle da rota de servidor — mesma convenção do webhook Sympla.
const EXHIBITORS_COLLECTION = 'exhibitors';

/**
 * Vincula a conta do expositor logado a um estande cadastrado pelo organizador.
 *
 * Endpoint: POST /api/portal/expositor/vincular
 * Header:   Authorization: Bearer <idToken do Firebase Auth>
 * Body:     { "exhibitorId": "86" }
 *
 * As Security Rules proíbem o cliente de escrever `ownerUid`/`status` em
 * `exhibitors/{id}` (são campos do organizador), então o vínculo passa pelo
 * Admin SDK. A transação exige e-mail verificado, confere a autorização
 * cadastrada pelo organizador, impede uma conta de assumir dois estandes e
 * sempre cria o novo vínculo em rascunho.
 */
export async function GET(request: Request) {
  try {
    const { email, emailVerified } = await requireAuthUser(request);
    if (!email || !emailVerified) {
      return NextResponse.json(
        { error: 'Confirme seu e-mail corporativo para consultar os estandes autorizados.' },
        { status: 403 },
      );
    }

    const snap = await getAdminDb().collection(EXHIBITORS_COLLECTION).get();
    const booths = snap.docs
      .filter((doc) => {
        const data = doc.data();
        return !data.ownerUid && isEmailAuthorizedForBooth(email, data);
      })
      .map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          company: String(data.company ?? `Estande ${data.stand || doc.id}`),
          stand: String(data.stand ?? doc.id),
          area: String(data.area ?? ''),
          category: String(data.category ?? 'Standard'),
        };
      })
      .sort((a, b) => a.stand.localeCompare(b.stand, 'pt-BR', { numeric: true }));

    return NextResponse.json({ booths });
  } catch (error) {
    const status = (error as { status?: number })?.status ?? 500;
    const message = (error as Error)?.message ?? 'Falha ao consultar estandes autorizados.';
    if (status === 500) console.error('Erro ao consultar estandes autorizados:', error);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const { uid, email, emailVerified } = await requireAuthUser(request);

    const body = await request.json().catch(() => ({}));
    const exhibitorId = String(body?.exhibitorId ?? '').trim();
    if (!exhibitorId) {
      return NextResponse.json({ error: 'Selecione o estande da sua empresa.' }, { status: 400 });
    }

    const db = getAdminDb();
    const docRef = db.collection(EXHIBITORS_COLLECTION).doc(exhibitorId);
    const ownedQuery = db.collection(EXHIBITORS_COLLECTION).where('ownerUid', '==', uid).limit(1);
    let alreadyLinked = false;
    let resultingStatus = 'draft';

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(docRef);
      if (!snap.exists) {
        throw Object.assign(new Error('Estande não encontrado.'), { status: 404 });
      }

      const data = snap.data() ?? {};
      const ownedSnap = await tx.get(ownedQuery);
      const decision = evaluateExhibitorLink({
        uid,
        email,
        emailVerified,
        targetExhibitorId: exhibitorId,
        targetOwnerUid: data.ownerUid,
        claimEmail: data.claimEmail,
        contactEmail: data.contactEmail,
        existingOwnedExhibitorId: ownedSnap.docs[0]?.id,
      });

      alreadyLinked = decision.alreadyLinked;
      if (decision.alreadyLinked) {
        resultingStatus = data.status === 'published' ? 'published' : 'draft';
        return;
      }

      tx.update(docRef, {
        ownerUid: uid,
        linkedEmail: decision.normalizedEmail,
        status: decision.initialStatus,
        linkedAt: Date.now(),
      });
    });

    return NextResponse.json({
      success: true,
      exhibitorId,
      status: resultingStatus,
      alreadyLinked,
    });
  } catch (error) {
    const status = (error as { status?: number })?.status ?? 500;
    const message = (error as Error)?.message ?? 'Falha ao vincular o estande.';
    if (status === 500) console.error('Erro ao vincular estande:', error);
    return NextResponse.json({ error: message }, { status });
  }
}
