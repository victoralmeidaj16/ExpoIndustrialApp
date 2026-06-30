'use client';

import { useEffect, useState } from 'react';

import { PageHeader } from '@/components/app-shell';
import { Button, Card, Field, Input, Spinner, Textarea } from '@/components/ui';
import { type EventConfig } from '@/domain/event';
import { saveEventConfig, useEventConfig } from '@/features/event/use-event-config';

export default function EventoPage() {
  const { config, loading } = useEventConfig();
  const [form, setForm] = useState<EventConfig>(config);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  // Hidrata o formulário quando o doc chega/muda no Firestore.
  useEffect(() => {
    if (!loading) setForm(config);
  }, [loading, config]);

  function set<K extends keyof EventConfig>(key: K, value: EventConfig[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  async function handleSave() {
    setBusy(true);
    try {
      await saveEventConfig(form);
      setSaved(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Dados do evento"
        description="Identidade do evento compartilhada no ecossistema (coleção event/config)."
      />

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : (
        <Card className="max-w-2xl p-6">
          <div className="flex flex-col gap-4">
            <Field label="Nome do evento">
              <Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="ExpoIndustrial Sul 2026" />
            </Field>
            <Field label="Tagline / chamada">
              <Input value={form.tagline} onChange={(e) => set('tagline', e.target.value)} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Rótulo de datas" hint="ex.: 16–18 Nov 2026">
                <Input value={form.dateLabel} onChange={(e) => set('dateLabel', e.target.value)} />
              </Field>
              <div />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Data inicial" hint="AAAA-MM-DD">
                <Input type="date" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} />
              </Field>
              <Field label="Data final" hint="AAAA-MM-DD">
                <Input type="date" value={form.endDate} onChange={(e) => set('endDate', e.target.value)} />
              </Field>
            </div>
            <Field label="Local">
              <Input value={form.venueName} onChange={(e) => set('venueName', e.target.value)} placeholder="Centreventos Cau Hansen" />
            </Field>
            <Field label="Endereço">
              <Textarea value={form.venueAddress} onChange={(e) => set('venueAddress', e.target.value)} />
            </Field>

            <div className="flex items-center gap-3 pt-2">
              <Button onClick={handleSave} disabled={busy}>
                {busy ? 'Salvando…' : 'Salvar'}
              </Button>
              {saved ? <span className="text-sm text-green-600">✓ Salvo</span> : null}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
