'use client';

import { useState } from 'react';

import { PageHeader } from '@/components/app-shell';
import { Badge, Button, Card, Field, Input, Select, Spinner, Textarea } from '@/components/ui';
import { emptySession, TRACKS, type Session } from '@/domain/session';
import { deleteSession, upsertSession, useSessions } from '@/features/sessions/use-sessions';

export default function AgendaPage() {
  const { sessions, loading } = useSessions();
  const [editing, setEditing] = useState<Session | null>(null);
  const [creating, setCreating] = useState(false);

  const byDay = sessions.reduce<Record<number, Session[]>>((acc, s) => {
    (acc[s.day] ??= []).push(s);
    return acc;
  }, {});
  const days = Object.keys(byDay)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div>
      <PageHeader title="Agenda" description="Palestras e sessões do evento. Alterações refletem no app em tempo real." />

      <div className="mb-4">
        <Button
          onClick={() => {
            setEditing(null);
            setCreating(true);
          }}>
          + Nova sessão
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : sessions.length === 0 ? (
        <Card className="p-8 text-center text-sm text-slate-500">
          Nenhuma sessão cadastrada. Clique em “Nova sessão”.
        </Card>
      ) : (
        <div className="flex flex-col gap-6">
          {days.map((day) => (
            <div key={day}>
              <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-400">
                Dia {day} {byDay[day][0]?.dateLabel ? `· ${byDay[day][0].dateLabel}` : ''}
              </h2>
              <div className="flex flex-col gap-2">
                {byDay[day].map((s) => (
                  <Card key={s.id} className="flex items-center justify-between gap-4 p-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900">{s.title}</span>
                        <Badge tone="indigo">{s.track}</Badge>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        {s.time} · {s.location} · {s.speaker}
                        {s.company ? ` (${s.company})` : ''} · {s.registeredCount}/{s.capacity}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setCreating(false);
                          setEditing(s);
                        }}>
                        Editar
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() => {
                          if (confirm(`Excluir “${s.title}”?`)) deleteSession(s.id);
                        }}>
                        Excluir
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {(editing || creating) && (
        <SessionDialog
          session={editing}
          onClose={() => {
            setEditing(null);
            setCreating(false);
          }}
        />
      )}
    </div>
  );
}

function SessionDialog({ session, onClose }: { session: Session | null; onClose: () => void }) {
  const [form, setForm] = useState<Omit<Session, 'id'>>(
    session ? { ...session } : emptySession(),
  );
  const [busy, setBusy] = useState(false);

  function set<K extends keyof Omit<Session, 'id'>>(key: K, value: Omit<Session, 'id'>[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSave() {
    setBusy(true);
    try {
      await upsertSession(session?.id ?? null, form);
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <Card className="max-h-[90vh] w-full max-w-lg overflow-y-auto p-6">
        <h2 className="mb-4 text-lg font-bold text-slate-900">
          {session ? 'Editar sessão' : 'Nova sessão'}
        </h2>
        <div className="flex flex-col gap-3">
          <Field label="Título">
            <Input value={form.title} onChange={(e) => set('title', e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Palestrante">
              <Input value={form.speaker} onChange={(e) => set('speaker', e.target.value)} />
            </Field>
            <Field label="Cargo">
              <Input value={form.role} onChange={(e) => set('role', e.target.value)} />
            </Field>
          </div>
          <Field label="Empresa">
            <Input value={form.company} onChange={(e) => set('company', e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Horário" hint="ex.: 10:00 - 10:45">
              <Input value={form.time} onChange={(e) => set('time', e.target.value)} />
            </Field>
            <Field label="Local">
              <Input value={form.location} onChange={(e) => set('location', e.target.value)} />
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Trilha">
              <Select value={form.track} onChange={(e) => set('track', e.target.value as Session['track'])}>
                {TRACKS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Dia">
              <Input
                type="number"
                min={1}
                value={form.day}
                onChange={(e) => set('day', Number(e.target.value) || 1)}
              />
            </Field>
            <Field label="Rótulo data" hint="ex.: 16 Nov">
              <Input value={form.dateLabel} onChange={(e) => set('dateLabel', e.target.value)} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Capacidade">
              <Input
                type="number"
                min={0}
                value={form.capacity}
                onChange={(e) => set('capacity', Number(e.target.value) || 0)}
              />
            </Field>
            <Field label="Inscritos">
              <Input
                type="number"
                min={0}
                value={form.registeredCount}
                onChange={(e) => set('registeredCount', Number(e.target.value) || 0)}
              />
            </Field>
          </div>
          <Field label="Descrição">
            <Textarea value={form.description} onChange={(e) => set('description', e.target.value)} />
          </Field>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={busy || !form.title.trim()}>
            {busy ? 'Salvando…' : 'Salvar'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
