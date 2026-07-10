'use client';

import { useState } from 'react';

import { PageHeader } from '@/components/app-shell';
import { Button, Card, Field, Input, Spinner, Textarea } from '@/components/ui';
import {
  deletePaidEvent,
  savePaidEvent,
  toPaidEventForm,
  usePaidEvents,
} from '@/features/paid-events/use-paid-events';
import { type PaidEvent, type PaidEventFormData } from '@/domain/paid-event';

export default function EventosPagosPage() {
  const { events, loading, error } = usePaidEvents();
  const [editing, setEditing] = useState<PaidEvent | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <div>
      <PageHeader
        title="Eventos pagos"
        description="Configure eventos integrados ao HiGestor/R Gestor, link de pagamento e liberacao de materiais no app."
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <Button
          onClick={() => {
            setEditing(null);
            setCreating(true);
          }}>
          + Novo evento pago
        </Button>
      </div>

      <Card className="mb-5 p-4">
        <h2 className="text-sm font-extrabold uppercase text-[#071A33]">Fluxo validado</h2>
        <div className="mt-3 grid gap-2 text-sm text-slate-600 md:grid-cols-3">
          <p>1. O link salvo aqui aparece no botao de pagamento do app quando o visitante ainda nao tem acesso.</p>
          <p>
            2. A sincronizacao HiGestor grava inscritos pagos em{' '}
            <code className="rounded bg-slate-100 px-1">paidEvents/eventId/attendees/email</code>.
          </p>
          <p>3. Ao abrir o app com o mesmo e-mail da compra, o status `paid` libera os materiais exclusivos.</p>
        </div>
      </Card>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : error ? (
        <Card className="p-8 text-center text-sm text-red-600">
          Nao foi possivel carregar os eventos pagos: {error.message}
        </Card>
      ) : events.length === 0 ? (
        <Card className="p-8 text-center text-sm text-slate-500">
          Nenhum evento pago configurado ainda.
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {events.map((event) => (
            <Card key={event.id} className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-extrabold text-slate-900">{event.title}</p>
                  {event.higestorEventId ? (
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500">
                      HiGestor {event.higestorEventId}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 truncate text-xs text-slate-400">
                  {[event.dateLabel, event.location].filter(Boolean).join(' · ') || 'Sem data/local'}
                </p>
                <p className="mt-1 truncate text-xs text-slate-500">
                  {event.paymentUrl || 'Sem link de pagamento'}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                {event.paymentUrl ? (
                  <a href={event.paymentUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="secondary">Testar link</Button>
                  </a>
                ) : null}
                <Button
                  variant="secondary"
                  onClick={() => {
                    setCreating(false);
                    setEditing(event);
                  }}>
                  Editar
                </Button>
                <Button
                  variant="danger"
                  onClick={() => {
                    if (confirm(`Excluir "${event.title}"?`)) deletePaidEvent(event.id);
                  }}>
                  Excluir
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {creating ? <PaidEventDialog onClose={() => setCreating(false)} /> : null}
      {editing ? <PaidEventDialog event={editing} onClose={() => setEditing(null)} /> : null}
    </div>
  );
}

function PaidEventDialog({ event, onClose }: { event?: PaidEvent; onClose: () => void }) {
  const [form, setForm] = useState<PaidEventFormData>(toPaidEventForm(event));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof PaidEventFormData>(key: K, value: PaidEventFormData[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setError(null);
  }

  async function handleSave() {
    setBusy(true);
    setError(null);
    try {
      await savePaidEvent(form, event?.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao salvar evento pago.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <Card className="max-h-[90vh] w-full max-w-2xl overflow-y-auto p-6">
        <h2 className="mb-4 text-lg font-bold text-slate-900">
          {event ? 'Editar evento pago' : 'Novo evento pago'}
        </h2>
        <div className="flex flex-col gap-3">
          <Field label="Titulo">
            <Input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Workshop PPCP" />
          </Field>
          <Field label="Descricao">
            <Textarea value={form.description} onChange={(e) => set('description', e.target.value)} />
          </Field>
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Data / periodo">
              <Input value={form.dateLabel} onChange={(e) => set('dateLabel', e.target.value)} placeholder="16 Nov 2026" />
            </Field>
            <Field label="Local">
              <Input value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="Auditório 1" />
            </Field>
          </div>
          <div className="grid gap-3 md:grid-cols-[1fr_140px]">
            <Field label="ID do evento no HiGestor / R Gestor">
              <Input
                value={form.higestorEventId}
                onChange={(e) => set('higestorEventId', e.target.value)}
                placeholder="Ex.: 12345"
              />
            </Field>
            <Field label="Ordem">
              <Input
                type="number"
                min={0}
                value={form.order}
                onChange={(e) => set('order', Number(e.target.value) || 0)}
              />
            </Field>
          </div>
          <Field label="Link de pagamento" hint="Cole aqui o link publico do checkout/inscricao do HiGestor ou R Gestor.">
            <Input
              type="url"
              value={form.paymentUrl}
              onChange={(e) => set('paymentUrl', e.target.value)}
              placeholder="https://app.higestor.com.br/..."
            />
          </Field>
          {form.paymentUrl ? (
            <a
              href={form.paymentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-[#2F6BFF] hover:underline">
              Abrir link em nova aba para validar redirecionamento
            </a>
          ) : null}
          {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">{error}</p> : null}
          <div className="mt-3 flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose} disabled={busy}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={busy || !form.title.trim()}>
              {busy ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
