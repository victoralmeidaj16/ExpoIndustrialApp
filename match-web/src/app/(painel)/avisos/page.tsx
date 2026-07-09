'use client';

import { useEffect, useMemo, useState } from 'react';
import { collection, doc, addDoc, deleteDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';

import { PageHeader } from '@/components/app-shell';
import { Button, Card, Field, Input, Spinner, Textarea } from '@/components/ui';
import { useVisitors } from '@/features/visitors/use-visitors';
import { sendPushToTargets, type PushTarget, type PushSendResult } from '@/features/notifications/send-push';
import { db } from '@/lib/firebase';

const TITLE_MAX = 60;
const BODY_MAX = 178;

export default function AvisosPage() {
  const { visitors, loading } = useVisitors();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<PushSendResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Estados de Agendamento
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loadingNotifs, setLoadingNotifs] = useState(true);

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

  const canSend = title.trim().length > 0 && body.trim().length > 0 && (isScheduled ? scheduledAt.length > 0 : reach > 0) && !sending;

  // Carrega histórico e agendados
  useEffect(() => {
    if (!db) {
      setLoadingNotifs(false);
      return;
    }
    const ref = collection(db, 'notifications');
    const q = query(ref, orderBy('createdAt', 'desc'));
    return onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setNotifications(list);
        setLoadingNotifs(false);
      },
      (err) => {
        console.error('Erro ao buscar avisos no Firestore:', err);
        setLoadingNotifs(false);
      }
    );
  }, []);

  async function onSend() {
    setErrorMsg(null);
    setResult(null);
    if (!canSend) return;

    if (isScheduled) {
      const scheduledTime = new Date(scheduledAt).getTime();
      if (scheduledTime <= Date.now()) {
        setErrorMsg('O horário de agendamento deve ser no futuro.');
        return;
      }

      const confirmed = window.confirm(
        `Agendar este aviso para disparar em ${new Date(scheduledAt).toLocaleString()}?\n\n` +
          `Título: ${title.trim()}\nMensagem: ${body.trim()}`,
      );
      if (!confirmed) return;

      setSending(true);
      try {
        if (!db) throw new Error('Firebase não configurado.');
        await addDoc(collection(db, 'notifications'), {
          title: title.trim(),
          body: body.trim(),
          status: 'pending',
          scheduledAt: scheduledTime,
          createdAt: serverTimestamp(),
          sentAt: null,
          targetCount: reach,
        });
        setTitle('');
        setBody('');
        setScheduledAt('');
        setIsScheduled(false);
        alert('Notificação agendada com sucesso!');
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : 'Falha ao salvar agendamento.');
      } finally {
        setSending(false);
      }
    } else {
      const confirmed = window.confirm(
        `Enviar este aviso IMEDIATAMENTE para ${reach} dispositivo(s) de ${peopleReached} pessoa(s)?\n\n` +
          `Título: ${title.trim()}\nMensagem: ${body.trim()}`,
      );
      if (!confirmed) return;

      setSending(true);
      try {
        const res = await sendPushToTargets(targets, title.trim(), body.trim(), { type: 'evento-aviso' });
        setResult(res);
        if (res.ok > 0) {
          if (db) {
            await addDoc(collection(db, 'notifications'), {
              title: title.trim(),
              body: body.trim(),
              status: 'sent',
              scheduledAt: null,
              createdAt: serverTimestamp(),
              sentAt: Date.now(),
              targetCount: reach,
            });
          }
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
  }

  async function onDeleteNotification(id: string) {
    const confirmed = window.confirm('Deseja realmente cancelar e excluir este aviso agendado?');
    if (!confirmed) return;
    try {
      if (!db) throw new Error('Firebase não configurado.');
      await deleteDoc(doc(db, 'notifications', id));
    } catch (err) {
      alert('Erro ao excluir: ' + (err as Error).message);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Avisos"
        description="Envie notificações push para os participantes ou agende disparos pré-programados para contagem regressiva e avisos."
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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

          {/* Opções de Disparo */}
          <div className="border-t border-slate-100 pt-4 flex flex-col gap-3">
            <span className="text-base font-semibold text-[#071A33]">Agendamento</span>
            <div className="flex gap-6 items-center">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-600 cursor-pointer">
                <input
                  type="radio"
                  name="scheduleType"
                  checked={!isScheduled}
                  onChange={() => setIsScheduled(false)}
                  className="h-4 w-4 accent-[#C9A24C]"
                />
                Disparar agora
              </label>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-600 cursor-pointer">
                <input
                  type="radio"
                  name="scheduleType"
                  checked={isScheduled}
                  onChange={() => setIsScheduled(true)}
                  className="h-4 w-4 accent-[#C9A24C]"
                />
                Pré-programar envio
              </label>
            </div>
          </div>

          {isScheduled && (
            <Field label="Data e hora de disparo" hint="Horário de Brasília">
              <Input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
              />
            </Field>
          )}

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

          <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-4">
            <p className="text-sm text-slate-500">
              {isScheduled
                ? 'Salvará o envio automático no banco.'
                : reach === 0
                ? 'Nenhum dispositivo registrado ainda.'
                : `Será enviado para ${reach} dispositivo(s).`}
            </p>
            <Button onClick={onSend} disabled={!canSend}>
              {sending ? (
                <Spinner className="border-white/40 border-t-white" />
              ) : isScheduled ? (
                'Salvar Agendamento'
              ) : (
                'Enviar aviso'
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Histórico e Agendados */}
      <Card className="p-6">
        <h2 className="text-lg font-extrabold text-[#071A33] mb-4">Histórico & Agendamentos</h2>
        {loadingNotifs ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : notifications.length === 0 ? (
          <p className="text-sm text-slate-500 py-2">Nenhum aviso enviado ou agendado ainda.</p>
        ) : (
          <div className="space-y-4">
            {notifications.map((notif) => {
              const isPending = notif.status === 'pending';
              const dateToShow = isPending
                ? new Date(notif.scheduledAt).toLocaleString('pt-BR')
                : new Date(notif.sentAt || notif.createdAt?.seconds * 1000 || Date.now()).toLocaleString('pt-BR');

              return (
                <div
                  key={notif.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50/50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-md ${
                          isPending ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {isPending ? 'Agendado' : 'Enviado'}
                      </span>
                      <span className="text-xs text-slate-400 font-semibold">{dateToShow}</span>
                      {!isPending && (
                        <span className="text-xs text-slate-400 font-semibold">
                          • {notif.targetCount ?? 0} destinatário(s)
                        </span>
                      )}
                    </div>
                    <h3 className="font-extrabold text-slate-900 text-sm">{notif.title}</h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{notif.body}</p>
                  </div>
                  {isPending && (
                    <Button
                      variant="danger"
                      className="py-1.5 px-3.5 text-xs shrink-0 font-bold"
                      onClick={() => onDeleteNotification(notif.id)}
                    >
                      Cancelar
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
