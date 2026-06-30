'use client';

import { useState } from 'react';

import { PageHeader } from '@/components/app-shell';
import { Badge, Button, Card, Field, Input, Select, Spinner } from '@/components/ui';
import {
  SPONSOR_TIERS,
  TIER_LABEL,
  type Sponsor,
  type SponsorTier,
} from '@/domain/sponsor';
import { deleteSponsor, upsertSponsor, useSponsors } from '@/features/sponsors/use-sponsors';
import { uploadSponsorLogo } from '@/lib/uploads';

type SponsorForm = Omit<Sponsor, 'id'>;

function emptySponsor(): SponsorForm {
  return { name: '', logoText: '', logoUrl: '', tier: 'GOLD', order: 0 };
}

export default function PatrocinadoresPage() {
  const { sponsors, loading } = useSponsors();
  const [editing, setEditing] = useState<Sponsor | null>(null);
  const [creating, setCreating] = useState(false);

  const byTier = (tier: SponsorTier) => sponsors.filter((s) => s.tier === tier);

  return (
    <div>
      <PageHeader
        title="Patrocinadores"
        description="Cotas de patrocínio exibidas no app. Alterações refletem em tempo real."
      />

      <div className="mb-4">
        <Button
          onClick={() => {
            setEditing(null);
            setCreating(true);
          }}>
          + Novo patrocinador
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : sponsors.length === 0 ? (
        <Card className="p-8 text-center text-sm text-slate-500">
          Nenhum patrocinador cadastrado.
        </Card>
      ) : (
        <div className="flex flex-col gap-6">
          {SPONSOR_TIERS.map((tier) => {
            const list = byTier(tier);
            if (list.length === 0) return null;
            return (
              <div key={tier}>
                <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-400">
                  {TIER_LABEL[tier]}
                </h2>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {list.map((s) => (
                    <Card key={s.id} className="flex items-center justify-between gap-3 p-4">
                      <div className="flex items-center gap-3 min-w-0">
                        {s.logoUrl ? (
                          <img src={s.logoUrl} alt={s.name} className="h-10 w-10 shrink-0 rounded object-contain border bg-slate-50" />
                        ) : (
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded border bg-slate-100 text-xs font-bold text-slate-500">
                            {s.logoText || s.name.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">{s.name}</p>
                          <p className="truncate text-xs text-slate-400">
                            {s.logoText} · ordem {s.order}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setCreating(false);
                            setEditing(s);
                          }}>
                          ✎
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => {
                            if (confirm(`Excluir “${s.name}”?`)) deleteSponsor(s.id);
                          }}>
                          🗑
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {(editing || creating) && (
        <SponsorDialog
          sponsor={editing}
          onClose={() => {
            setEditing(null);
            setCreating(false);
          }}
        />
      )}
    </div>
  );
}

function SponsorDialog({ sponsor, onClose }: { sponsor: Sponsor | null; onClose: () => void }) {
  const [form, setForm] = useState<SponsorForm>(sponsor ? { ...sponsor } : emptySponsor());
  const [busy, setBusy] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  function set<K extends keyof SponsorForm>(key: K, value: SponsorForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      const sponsorIdForUpload = sponsor?.id || `temp-${Math.random().toString(36).substring(2, 9)}`;
      const url = await uploadSponsorLogo(sponsorIdForUpload, file);
      set('logoUrl', url);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setUploadingFile(false);
    }
  }

  async function handleSave() {
    setBusy(true);
    try {
      await upsertSponsor(sponsor?.id ?? null, form);
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <Card className="w-full max-w-md p-6">
        <h2 className="mb-4 text-lg font-bold text-slate-900">
          {sponsor ? 'Editar patrocinador' : 'Novo patrocinador'}
        </h2>
        <div className="flex flex-col gap-3">
          <Field label="Nome">
            <Input value={form.name} onChange={(e) => set('name', e.target.value)} />
          </Field>
          <Field label="Texto do logo" hint="ex.: INTEL (exibido no card)">
            <Input value={form.logoText} onChange={(e) => set('logoText', e.target.value)} />
          </Field>
          <Field label="Imagem do Logotipo">
            <div className="flex items-center gap-3">
              {form.logoUrl ? (
                <img src={form.logoUrl} alt="Preview Logo" className="h-12 w-12 rounded object-contain border bg-slate-50 shrink-0" />
              ) : (
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded border border-dashed bg-slate-50 text-[10px] text-slate-400">Sem Imagem</div>
              )}
              <input
                type="file"
                accept="image/*"
                className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                onChange={handleFileChange}
              />
            </div>
            {uploadingFile && <span className="text-[10px] text-indigo-500 animate-pulse">Enviando imagem...</span>}
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Cota">
              <Select value={form.tier} onChange={(e) => set('tier', e.target.value as SponsorTier)}>
                {SPONSOR_TIERS.map((t) => (
                  <option key={t} value={t}>
                    {TIER_LABEL[t]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Ordem" hint="menor aparece primeiro">
              <Input
                type="number"
                min={0}
                value={form.order}
                onChange={(e) => set('order', Number(e.target.value) || 0)}
              />
            </Field>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <span className="text-xs text-slate-400">Pré-visualização:</span>
            <Badge tone="indigo">{form.logoText || form.name || '—'}</Badge>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={busy || uploadingFile}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={busy || uploadingFile || !form.name.trim()}>
            {busy ? 'Salvando…' : 'Salvar'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
