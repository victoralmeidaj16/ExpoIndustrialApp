'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import { PageHeader } from '@/components/app-shell';
import { Badge, Button, Card, Field, Input, Spinner, Textarea } from '@/components/ui';
import { type Exhibitor } from '@/domain/exhibitor';
import {
  getExhibitorApprovalChecklist,
  isExhibitorReadyForPublication,
  splitList,
} from '@/features/exhibitors/moderation';
import {
  publishExhibitor,
  type ExhibitorCommercialUpdate,
  updateExhibitorCommercialProfile,
  updateExhibitorPlacement,
  updateExhibitorStatus,
  useExhibitors,
} from '@/features/exhibitors/use-exhibitors';
import { uploadExhibitorLogo } from '@/lib/uploads';

type StatusFilter = 'draft' | 'published' | 'all';

export default function ExpositoresPage() {
  const { exhibitors, loading, error } = useExhibitors();
  const [filter, setFilter] = useState<StatusFilter>('draft');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('pt-BR');
    return exhibitors.filter((item) => {
      if (filter !== 'all' && (item.status ?? 'draft') !== filter) return false;
      if (!query) return true;
      return [item.company, item.industry, item.stand, item.contactName, item.contactEmail]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase('pt-BR')
        .includes(query);
    });
  }, [exhibitors, filter, search]);
  const selected = exhibitors.find((item) => item.id === selectedId) ?? null;
  const drafts = exhibitors.filter((item) => item.status !== 'published').length;
  const published = exhibitors.length - drafts;

  return (
    <div>
      <PageHeader
        title="Moderação de expositores"
        description="Revise a ficha comercial e o checklist antes de publicar uma empresa no aplicativo. Nenhuma ação desta tela envia mensagens ao expositor."
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <Metric label="Total" value={exhibitors.length} />
        <Metric label="Em análise" value={drafts} tone="amber" />
        <Metric label="Publicados" value={published} tone="green" />
      </div>

      <Card className="mb-5 p-4">
        <div className="flex flex-col gap-3 lg:flex-row">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar empresa, setor, estande ou contato..."
          />
          <div className="flex gap-2">
            <FilterButton active={filter === 'draft'} onClick={() => setFilter('draft')}>Em análise</FilterButton>
            <FilterButton active={filter === 'published'} onClick={() => setFilter('published')}>Publicados</FilterButton>
            <FilterButton active={filter === 'all'} onClick={() => setFilter('all')}>Todos</FilterButton>
          </div>
        </div>
      </Card>

      {error ? <Card className="mb-4 border-red-200 p-4 text-sm text-red-700">{error.message}</Card> : null}
      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[minmax(280px,0.8fr)_minmax(0,1.4fr)]">
          <div className="flex flex-col gap-3">
            {filtered.map((item) => {
              const checklist = getExhibitorApprovalChecklist(item);
              const complete = checklist.filter((entry) => entry.done).length;
              return (
                <button key={item.id} type="button" onClick={() => setSelectedId(item.id)} className="text-left">
                  <Card className={`p-4 transition hover:border-[#C9A24C] ${selectedId === item.id ? 'border-[#C9A24C] ring-1 ring-[#C9A24C]' : ''}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="font-bold text-[#071A33]">{item.company || 'Empresa sem nome'}</h2>
                        <p className="mt-1 text-sm text-slate-500">{item.industry || 'Setor pendente'} · {item.stand || 'Estande pendente'}</p>
                      </div>
                      <Badge tone={item.status === 'published' ? 'green' : 'amber'}>
                        {item.status === 'published' ? 'Publicado' : 'Análise'}
                      </Badge>
                    </div>
                    <p className="mt-3 text-xs font-semibold text-slate-500">Checklist {complete}/{checklist.length}</p>
                  </Card>
                </button>
              );
            })}
            {filtered.length === 0 ? <Card className="p-8 text-center text-sm text-slate-500">Nenhum expositor neste filtro.</Card> : null}
          </div>

          {selected ? (
            <ExhibitorEditor key={selected.id} exhibitor={selected} />
          ) : (
            <Card className="p-8 text-center text-sm text-slate-500">Selecione uma empresa para revisar e moderar.</Card>
          )}
        </div>
      )}
    </div>
  );
}

function Metric({ label, value, tone = 'slate' }: { label: string; value: number; tone?: 'slate' | 'amber' | 'green' }) {
  const colors = { slate: 'text-[#071A33]', amber: 'text-amber-600', green: 'text-green-600' };
  return <Card className="p-4"><p className={`text-2xl font-black ${colors[tone]}`}>{value}</p><p className="text-xs font-bold uppercase text-slate-400">{label}</p></Card>;
}

function FilterButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold ${active ? 'bg-[#071A33] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{children}</button>;
}

function ExhibitorEditor({ exhibitor }: { exhibitor: Exhibitor }) {
  const [form, setForm] = useState(exhibitor);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const checklist = getExhibitorApprovalChecklist(form);
  const ready = isExhibitorReadyForPublication(form);
  const set = <K extends keyof Exhibitor>(key: K, value: Exhibitor[K]) => setForm((current) => ({ ...current, [key]: value }));

  function commercialPayload(): ExhibitorCommercialUpdate {
    return {
      company: form.company.trim(), industry: form.industry.trim(), about: form.about.trim(),
      products: form.products, contactName: form.contactName?.trim(), contactRole: form.contactRole?.trim(),
      contactEmail: form.contactEmail?.trim().toLowerCase(), contactPhone: form.contactPhone?.trim(),
      website: form.website?.trim(), instagram: form.instagram?.trim(), linkedin: form.linkedin?.trim(),
      segments: form.segments ?? [], targetAudience: form.targetAudience ?? [],
      lookingFor: form.lookingFor ?? [], keywords: form.keywords ?? [],
    };
  }

  async function save() {
    setBusy(true);
    setNotice(null);
    try {
      await updateExhibitorCommercialProfile(exhibitor.id, commercialPayload());
      setNotice({ tone: 'success', text: 'Ficha comercial salva.' });
    } catch (error) {
      setNotice({ tone: 'error', text: (error as Error).message });
    } finally {
      setBusy(false);
    }
  }

  async function changeStatus(status: 'draft' | 'published') {
    if (status === 'published' && !ready) {
      setNotice({ tone: 'error', text: 'Complete todos os itens do checklist antes de publicar.' });
      return;
    }
    const prompt = status === 'published'
      ? 'Publicar esta empresa no aplicativo agora?'
      : 'Retirar esta empresa do aplicativo e devolver para análise?';
    if (!window.confirm(prompt)) return;
    setBusy(true);
    setNotice(null);
    try {
      if (status === 'published') {
        await publishExhibitor(exhibitor.id, commercialPayload());
      } else {
        await updateExhibitorStatus(exhibitor.id, status);
      }
      setForm((current) => ({ ...current, status }));
      setNotice({ tone: 'success', text: status === 'published' ? 'Empresa publicada.' : 'Empresa devolvida para análise.' });
    } catch (error) {
      setNotice({ tone: 'error', text: (error as Error).message });
    } finally {
      setBusy(false);
    }
  }

  async function uploadLogo(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setNotice(null);
    try {
      const logoUrl = await uploadExhibitorLogo(exhibitor.id, file);
      await updateExhibitorPlacement(exhibitor.id, { logoUrl });
      set('logoUrl', logoUrl);
      setNotice({ tone: 'success', text: 'Logo enviada e vinculada à ficha.' });
    } catch (error) {
      setNotice({ tone: 'error', text: (error as Error).message });
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  }

  return (
    <Card className="p-5">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div><h2 className="text-xl font-black text-[#071A33]">Revisão da ficha</h2><p className="text-sm text-slate-500">Documento: {exhibitor.id}</p></div>
        <Badge tone={form.status === 'published' ? 'green' : 'amber'}>{form.status === 'published' ? 'Publicado' : 'Em análise'}</Badge>
      </div>

      <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="mb-3 flex items-center justify-between"><h3 className="font-bold text-[#071A33]">Checklist de publicação</h3><span className="text-sm font-bold text-slate-500">{checklist.filter((item) => item.done).length}/{checklist.length}</span></div>
        <div className="grid gap-2 sm:grid-cols-2">
          {checklist.map((item) => <div key={item.key} className={`text-sm font-semibold ${item.done ? 'text-green-700' : 'text-amber-700'}`}>{item.done ? '✓' : '○'} {item.label}</div>)}
        </div>
        <Link href="/croqui" className="mt-3 inline-block text-sm font-bold text-indigo-600 hover:underline">Editar estande e croqui →</Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Empresa"><Input value={form.company} onChange={(event) => set('company', event.target.value)} /></Field>
        <Field label="Setor"><Input value={form.industry} onChange={(event) => set('industry', event.target.value)} /></Field>
        <Field label="Descrição"><Textarea value={form.about} onChange={(event) => set('about', event.target.value)} /></Field>
        <Field label="Produtos" hint="Separe por vírgula ou linha"><Textarea value={form.products.join('\n')} onChange={(event) => set('products', splitList(event.target.value))} /></Field>
        <Field label="Responsável"><Input value={form.contactName ?? ''} onChange={(event) => set('contactName', event.target.value)} /></Field>
        <Field label="Cargo do responsável"><Input value={form.contactRole ?? ''} onChange={(event) => set('contactRole', event.target.value)} /></Field>
        <Field label="E-mail"><Input type="email" value={form.contactEmail ?? ''} onChange={(event) => set('contactEmail', event.target.value)} /></Field>
        <Field label="Telefone"><Input value={form.contactPhone ?? ''} onChange={(event) => set('contactPhone', event.target.value)} /></Field>
        <Field label="Site"><Input value={form.website ?? ''} onChange={(event) => set('website', event.target.value)} /></Field>
        <Field label="Instagram"><Input value={form.instagram ?? ''} onChange={(event) => set('instagram', event.target.value)} /></Field>
        <Field label="LinkedIn"><Input value={form.linkedin ?? ''} onChange={(event) => set('linkedin', event.target.value)} /></Field>
        <Field label="Segmentos atendidos" hint="Separe por vírgula ou linha"><Textarea value={(form.segments ?? []).join('\n')} onChange={(event) => set('segments', splitList(event.target.value))} /></Field>
        <Field label="Público-alvo" hint="Separe por vírgula ou linha"><Textarea value={(form.targetAudience ?? []).join('\n')} onChange={(event) => set('targetAudience', splitList(event.target.value))} /></Field>
        <Field label="O que busca" hint="Separe por vírgula ou linha"><Textarea value={(form.lookingFor ?? []).join('\n')} onChange={(event) => set('lookingFor', splitList(event.target.value))} /></Field>
        <Field label="Palavras-chave" hint="Separe por vírgula ou linha"><Textarea value={(form.keywords ?? []).join('\n')} onChange={(event) => set('keywords', splitList(event.target.value))} /></Field>
        <Field label="Logotipo" hint="PNG/JPG até 5 MB">
          <div className="flex items-center gap-3">
            {form.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.logoUrl} alt={`Logo ${form.company}`} className="h-14 w-14 rounded-lg border object-contain" />
            ) : <div className="flex h-14 w-14 items-center justify-center rounded-lg border text-xs text-slate-400">Sem logo</div>}
            <label className="cursor-pointer rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold">{uploading ? 'Enviando…' : 'Selecionar logo'}<input className="hidden" type="file" accept="image/*" disabled={uploading} onChange={uploadLogo} /></label>
          </div>
        </Field>
      </div>

      {notice ? <p className={`mt-4 rounded-lg p-3 text-sm font-semibold ${notice.tone === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{notice.text}</p> : null}
      <div className="mt-5 flex flex-wrap gap-3 border-t border-slate-200 pt-5">
        <Button onClick={save} disabled={busy || uploading}>{busy ? 'Processando…' : 'Salvar correções'}</Button>
        {form.status === 'published'
          ? <Button variant="secondary" onClick={() => changeStatus('draft')} disabled={busy}>Voltar para análise</Button>
          : <Button variant="secondary" onClick={() => changeStatus('published')} disabled={busy || !ready}>Publicar no aplicativo</Button>}
      </div>
    </Card>
  );
}
