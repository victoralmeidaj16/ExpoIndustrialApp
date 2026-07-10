import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';

import { getAdminDb } from '@/lib/admin-firebase';

const EXPO_PUSH_ENDPOINT = 'https://exp.host/--/api/v2/push/send';
const CHUNK_SIZE = 100;
const MAX_NOTIFICATIONS_PER_RUN = 20;

type PushTarget = { token: string; uid: string };

type ExpoTicket = {
  status: 'ok' | 'error';
  message?: string;
  details?: { error?: string };
};

type PushSendResult = {
  ok: number;
  failed: number;
  removed: number;
};

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (secret) {
    const auth = request.headers.get('authorization') ?? '';
    const provided = auth.startsWith('Bearer ') ? auth.slice('Bearer '.length) : '';
    return provided === secret || new URL(request.url).searchParams.get('secret') === secret;
  }

  return (request.headers.get('user-agent') ?? '').includes('vercel-cron/1.0');
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

async function collectPushTargets(): Promise<PushTarget[]> {
  const db = getAdminDb();
  const snap = await db.collection('visitors').get();
  const targets: PushTarget[] = [];

  for (const docSnap of snap.docs) {
    const data = docSnap.data();
    for (const token of data.pushTokens ?? []) {
      if (typeof token === 'string' && token.startsWith('ExponentPushToken')) {
        targets.push({ token, uid: docSnap.id });
      }
    }
  }

  return targets;
}

async function pruneInvalidTokens(pairs: PushTarget[]): Promise<void> {
  if (pairs.length === 0) return;

  const db = getAdminDb();
  const batch = db.batch();
  for (const { uid, token } of pairs) {
    batch.update(db.collection('visitors').doc(uid), {
      pushTokens: FieldValue.arrayRemove(token),
    });
  }
  await batch.commit();
}

async function sendPushToTargets(
  targets: PushTarget[],
  title: string,
  body: string,
  data: Record<string, unknown> = {},
): Promise<PushSendResult> {
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

async function lockNotification(id: string, runId: string): Promise<boolean> {
  const db = getAdminDb();
  const ref = db.collection('notifications').doc(id);

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists || snap.data()?.status !== 'pending') return false;

    tx.update(ref, {
      status: 'processing',
      processingRunId: runId,
      processingStartedAt: Date.now(),
      updatedAt: Date.now(),
    });
    return true;
  });
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
  }

  const db = getAdminDb();
  const now = Date.now();
  const runId = `${now}-${Math.random().toString(36).slice(2, 8)}`;

  const snap = await db
    .collection('notifications')
    .where('status', '==', 'pending')
    .limit(50)
    .get();

  const due = snap.docs
    .filter((docSnap) => {
      const scheduledAt = docSnap.data().scheduledAt;
      return typeof scheduledAt === 'number' && scheduledAt <= now;
    })
    .sort((a, b) => (a.data().scheduledAt ?? 0) - (b.data().scheduledAt ?? 0))
    .slice(0, MAX_NOTIFICATIONS_PER_RUN);

  const targets = due.length > 0 ? await collectPushTargets() : [];
  const results = [];

  for (const docSnap of due) {
    const locked = await lockNotification(docSnap.id, runId);
    if (!locked) continue;

    const data = docSnap.data();
    const ref = db.collection('notifications').doc(docSnap.id);

    try {
      const result = await sendPushToTargets(
        targets,
        String(data.title ?? ''),
        String(data.body ?? ''),
        { type: 'evento-aviso', notificationId: docSnap.id, scheduled: true },
      );

      await ref.update({
        status: 'sent',
        sentAt: Date.now(),
        deliveredCount: result.ok,
        failedCount: result.failed,
        removedTokenCount: result.removed,
        targetCount: targets.length,
        updatedAt: Date.now(),
      });
      results.push({ id: docSnap.id, status: 'sent', ...result });
    } catch (err) {
      await ref.update({
        status: 'failed',
        failedAt: Date.now(),
        errorMessage: err instanceof Error ? err.message : 'Falha desconhecida',
        updatedAt: Date.now(),
      });
      results.push({ id: docSnap.id, status: 'failed' });
    }
  }

  return NextResponse.json({
    ok: true,
    due: due.length,
    processed: results.length,
    targets: targets.length,
    results,
  });
}
