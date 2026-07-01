'use client';

import { useMemo, useState } from 'react';

import { PageHeader } from '@/components/app-shell';
import { Button, Card, Field, Input, Spinner, Textarea } from '@/components/ui';
import { useVisitors } from '@/features/visitors/use-visitors';
import { sendPushToTargets, type PushTarget, type PushSendResult } from '@/features/notifications/send-push';

const TITLE_MAX = 60;
const BODY_MAX = 178;

export default function AvisosPage() {
  const { visitors, loading } = useVisitors();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<PushSendResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Destinatários = todos os tokens de visitantes que optaram por receber.
  const targets = useMemo<PushTarget[]>(() => {
    const list: PushTarget[] = [];
    for (const v of visitors) {
      for (const token of v.pushTokens ?? []) {
        if (typeof token === 'string' && token.startsWith('ExponentPushToken')) {
          list.push({ token, uid: v.uid });
        }
      }
    }
    return list;
  }, [visitors]);

  const reach = useMemo(() => new Set(targets.map((t) => t.token)).size, [targets]);
  const peopleReached = useMemo(
    () => visitors.filter((v) => (v.pushTokens ?? []).some((t) => t?.startsWith('ExponentPushToken'))).length,
    [visitors],
  );

  const canSend = title.trim().length > 0 && body.trim().length > 0 && reach > 0 && !sending;

  async function onSend() {
    setErrorMsg(null);
    setResult(null);
    if (!canSend) return;
    const confirmed = window.confirm(
      `Enviar este aviso para ${reach} dispositivo(s) de ${peopleReached} pessoa(s)?\n\n` +
        `Título: ${title.trim()}\nMensagem: ${body.trim()}`,
    );
    if (!confirmed) return;

    setSending(true);
    try {
      const res = await sendPushToTargets(targets, title.trim(), body.trim(), { type: 'evento-aviso' });
      setResult(res);
      if (res.ok > 0) {
        setTitle('');
        setBody('');
      }
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Falha ao enviar. Verifique a conexão e tente novamente.',
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Avisos"
        description="Envie notificações push para os participantes que baixaram o app e aceitaram receber alertas."
      />

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Card className="p-4">
          <p className="text-2xl font-extrabold tracking-tight text-[#071A33]">{loading ? '—' : peopleReached}</p>
          <p className="mt-0.5 text-xs font-bold uppercase tracking-wide text-slate-400">Pessoas alcançáveis</p>
        </Card>
        <Card className="p-4">
          <p className="text-2xl font-extrabold tracking-tight text-[#2F6BFF]">{loading ? '—' : reach}</p>
          <p className="mt-0.5 text-xs font-bold uppercase tracking-wide text-slate-400">Dispositivos registrados</p>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex flex-col gap-5">
          <Field label="Título" hint={`${title.length}/${TITLE_MAX}`}>
            <Input
              value={title}
              maxLength={TITLE_MAX}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex.: Palestra começa em 15 min"
            />
          </Field>

          <Field label="Mensagem" hint={`${body.length}/${BODY_MAX}`}>
            <Textarea
              value={body}
              maxLength={BODY_MAX}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Ex.: A palestra sobre Automação Industrial começa às 14h no Auditório 2."
              className="min-h-28"
            />
          </Field>

          {errorMsg && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {errorMsg}
            </p>
          )}

          {result && (
            <p className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
              Envio concluído: {result.ok} entregue(s), {result.failed} falha(s)
              {result.removed > 0 ? ` — ${result.removed} token(s) inválido(s) removido(s)` : ''}.
            </p>
          )}

          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-slate-500">
              {reach === 0
                ? 'Nenhum dispositivo registrado ainda.'
                : `Será enviado para ${reach} dispositivo(s).`}
            </p>
            <Button onClick={onSend} disabled={!canSend}>
              {sending ? <Spinner className="border-white/40 border-t-white" /> : 'Enviar aviso'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
