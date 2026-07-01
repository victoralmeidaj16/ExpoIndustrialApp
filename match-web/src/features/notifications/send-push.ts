'use client';

/**
 * Envio de push (alertas do evento) direto do navegador do organizador para a
 * Expo Push API. O match-web é um site estático (output: export), então não há
 * backend — o disparo é client-side, restrito ao perfil admin pela página.
 *
 * Fonte dos destinos: `visitors/{uid}.pushTokens` (o app grava o token só depois
 * que o usuário concede a permissão de notificação — presença do token = opt-in).
 * Tokens que a Expo reporta como `DeviceNotRegistered` são removidos do doc.
 */
import { arrayRemove, collection, doc, getDocs, writeBatch } from 'firebase/firestore';

import { VISITORS_COLLECTION, visitorConverter } from '@/domain/visitor';
import { db } from '@/lib/firebase';

const EXPO_PUSH_ENDPOINT = 'https://exp.host/--/api/v2/push/send';
const CHUNK_SIZE = 100;

/** Um destinatário: o token e o uid dono (para limpar tokens inválidos depois). */
export type PushTarget = { token: string; uid: string };

export type PushSendResult = {
  /** Tokens aceitos pela Expo (ticket ok). */
  ok: number;
  /** Tokens com erro (inclui os removidos). */
  failed: number;
  /** Quantos tokens `DeviceNotRegistered` foram removidos dos docs. */
  removed: number;
};

type ExpoTicket = {
  status: 'ok' | 'error';
  message?: string;
  details?: { error?: string };
};

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/**
 * Coleta todos os destinos (token + uid) dos visitantes que optaram por receber.
 * Só admins conseguem ler `visitors` inteira (Security Rules).
 */
export async function collectPushTargets(): Promise<PushTarget[]> {
  if (!db) return [];
  const ref = collection(db, VISITORS_COLLECTION).withConverter(visitorConverter);
  const snap = await getDocs(ref);
  const targets: PushTarget[] = [];
  for (const d of snap.docs) {
    const v = d.data();
    for (const token of v.pushTokens ?? []) {
      if (typeof token === 'string' && token.startsWith('ExponentPushToken')) {
        targets.push({ token, uid: v.uid });
      }
    }
  }
  return targets;
}

/** Remove tokens inválidos dos respectivos docs `visitors/{uid}` (em lote). */
async function pruneInvalidTokens(pairs: PushTarget[]): Promise<void> {
  if (!db || pairs.length === 0) return;
  const batch = writeBatch(db);
  for (const { uid, token } of pairs) {
    batch.update(doc(db, VISITORS_COLLECTION, uid), { pushTokens: arrayRemove(token) });
  }
  await batch.commit();
}

/**
 * Dispara a notificação para todos os destinos informados. Deduplica tokens,
 * envia em lotes de 100 e limpa os tokens que a Expo diz estarem inválidos.
 */
export async function sendPushToTargets(
  targets: PushTarget[],
  title: string,
  body: string,
  data: Record<string, unknown> = {},
): Promise<PushSendResult> {
  // Deduplica por token, preservando o uid dono.
  const byToken = new Map<string, string>();
  for (const t of targets) if (!byToken.has(t.token)) byToken.set(t.token, t.uid);
  const unique: PushTarget[] = [...byToken].map(([token, uid]) => ({ token, uid }));

  let ok = 0;
  let failed = 0;
  const invalid: PushTarget[] = [];

  for (const group of chunk(unique, CHUNK_SIZE)) {
    const messages = group.map((t) => ({
      to: t.token,
      title,
      body,
      data,
      sound: 'default',
      channelId: 'default',
    }));

    const res = await fetch(EXPO_PUSH_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(messages),
    });

    if (!res.ok) {
      failed += group.length;
      continue;
    }

    const payload = (await res.json()) as { data?: ExpoTicket[] };
    const tickets = payload.data ?? [];
    tickets.forEach((ticket, i) => {
      if (ticket.status === 'ok') {
        ok += 1;
      } else {
        failed += 1;
        if (ticket.details?.error === 'DeviceNotRegistered') invalid.push(group[i]);
      }
    });
  }

  await pruneInvalidTokens(invalid);
  return { ok, failed, removed: invalid.length };
}
