'use client';

import { useMemo, useRef, useState } from 'react';

import { PageHeader } from '@/components/app-shell';
import { Badge, Button, Card, Field, Input, Select, Spinner } from '@/components/ui';
import { hasPlacement, type Exhibitor } from '@/domain/exhibitor';
import { BOOTH_CATEGORIES } from '@/domain/venue';
import { updateExhibitorPlacement, useExhibitors } from '@/features/exhibitors/use-exhibitors';
import { uploadExhibitorLogo } from '@/lib/uploads';

const REAL_3D_MAP_URL = '/mapa-feira-3d-real.html';

function standNumber(stand?: string) {
  return stand?.match(/\d+/)?.[0] ?? null;
}

export default function CroquiPage() {
  const { exhibitors, loading } = useExhibitors();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const mapFrameRef = useRef<HTMLIFrameElement>(null);

  const selected = useMemo(
    () => exhibitors.find((e) => e.id === selectedId) ?? null,
    [exhibitors, selectedId],
  );

  const placed = exhibitors.filter(hasPlacement);
  const unplaced = exhibitors.filter((e) => !hasPlacement(e));

  function sendMapMessage(type: 'SELECT_STAND' | 'ROUTE_TO_STAND' | 'RESET_VIEW', stand?: string) {
    const standNum = standNumber(stand);
    mapFrameRef.current?.contentWindow?.postMessage(
      JSON.stringify({ type, standNumber: standNum }),
      window.location.origin,
    );
  }

  return (
    <div>
      <PageHeader
        title="Mapa 3D — estandes da feira"
        description="Mapa 3D real da ExpoIndustrialSul. Use a lista lateral para localizar estandes, conferir dados do expositor e manter as informações do organizador atualizadas."
      />

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px] xl:grid-cols-[minmax(0,1fr)_260px]">
          {/* Mapa 3D real */}
          <Card className="overflow-hidden p-3">
            <div className="relative min-h-[820px] overflow-hidden rounded-lg bg-slate-950">
              <iframe
                ref={mapFrameRef}
                src={REAL_3D_MAP_URL}
                title="Mapa 3D real da ExpoIndustrialSul"
                className="h-[820px] w-full border-0"
                allow="fullscreen"
              />
              <div className="pointer-events-none absolute left-3 top-3 rounded-full border border-white/10 bg-slate-950/80 px-3 py-1 text-xs font-bold text-white shadow">
                Mapa 3D real
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 px-1 pt-3 text-xs text-slate-400">
              <span>{placed.length} expositor(es) com posição no sistema · {unplaced.length} sem posição administrativa</span>
              <button
                type="button"
                onClick={() => sendMapMessage('RESET_VIEW')}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                Recentrar mapa
              </button>
            </div>
          </Card>

          {/* Painel lateral */}
          <div className="flex flex-col gap-4">
            {unplaced.length > 0 && (
              <Card className="p-4">
                <h3 className="text-sm font-semibold text-slate-900">
                  Sem posição ({unplaced.length})
                </h3>
                <p className="mb-2 text-xs text-slate-400">
                  Selecione para completar estande, área, categoria e score.
                </p>
                <div className="flex max-h-40 flex-col gap-1 overflow-y-auto">
                  {unplaced.map((e) => (
                    <button
                      key={e.id}
                      onClick={() => setSelectedId(e.id)}
                      className={`rounded-lg px-3 py-2 text-left text-sm transition ${
                        e.id === selectedId
                          ? 'bg-indigo-50 text-indigo-700'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}>
                      {e.company || 'Sem nome'}
                    </button>
                  ))}
                </div>
              </Card>
            )}

            {selected ? (
              <PlacementEditor
                key={selected.id}
                exhibitor={selected}
                onLocate={(mode) => sendMapMessage(mode, selected.stand)}
              />
            ) : (
              <Card className="p-4">
                <p className="text-sm text-slate-500">
                  Selecione um expositor nas listas para editar estande, área, categoria e
                  score.
                </p>
              </Card>
            )}

            <Card className="p-4">
              <h3 className="mb-2 text-sm font-semibold text-slate-900">
                Posicionados ({placed.length})
              </h3>
              <div className="flex max-h-60 flex-col gap-1 overflow-y-auto">
                {placed.map((e) => (
                  <button
                    key={e.id}
                    onClick={() => setSelectedId(e.id)}
                    className={`flex items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${
                      e.id === selectedId
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}>
                    <span className="truncate">{e.company || 'Sem nome'}</span>
                    {e.stand ? <Badge>{e.stand}</Badge> : null}
                  </button>
                ))}
                {placed.length === 0 && (
                  <p className="text-xs text-slate-400">Nenhum estande posicionado ainda.</p>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

function PlacementEditor({
  exhibitor,
  onLocate,
}: {
  exhibitor: Exhibitor;
  onLocate: (mode: 'SELECT_STAND' | 'ROUTE_TO_STAND') => void;
}) {
  const [stand, setStand] = useState(exhibitor.stand);
  const [area, setArea] = useState(exhibitor.area);
  const [category, setCategory] = useState(exhibitor.category);
  const [fit, setFit] = useState(String(exhibitor.fit ?? 0));
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [logoUrl, setLogoUrl] = useState(exhibitor.logoUrl ?? '');

  async function handleSave() {
    setBusy(true);
    try {
      await updateExhibitorPlacement(exhibitor.id, {
        stand: stand.trim(),
        area: area.trim(),
        category,
        fit: Number(fit) || 0,
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadExhibitorLogo(exhibitor.id, file);
      await updateExhibitorPlacement(exhibitor.id, { logoUrl: url });
      setLogoUrl(url);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  return (
    <Card className="p-4">
      <h3 className="text-sm font-semibold text-slate-900">{exhibitor.company || 'Expositor'}</h3>
      <p className="mb-3 text-xs text-slate-400">
        {exhibitor.industry || 'Setor não informado'}
        {hasPlacement(exhibitor)
          ? ` · ${(exhibitor.point.x * 100).toFixed(0)}%, ${(exhibitor.point.y * 100).toFixed(0)}%`
          : ' · sem posição'}
      </p>
      <div className="flex flex-col gap-3">
        <Field label="Logo (imagem)" hint="PNG/JPG até 5 MB — exibido no app">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="logo" className="h-full w-full object-contain" />
              ) : (
                <span className="text-[10px] font-bold text-slate-400">{exhibitor.logo || '—'}</span>
              )}
            </div>
            <label className="cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              {uploading ? 'Enviando…' : logoUrl ? 'Trocar logo' : 'Enviar logo'}
              <input type="file" accept="image/*" className="hidden" onChange={handleLogo} disabled={uploading} />
            </label>
          </div>
        </Field>
        <Field label="Estande">
          <Input value={stand} onChange={(e) => setStand(e.target.value)} placeholder="Estande 86" />
        </Field>
        <Field label="Área">
          <Input value={area} onChange={(e) => setArea(e.target.value)} placeholder="12 m²" />
        </Field>
        <Field label="Categoria">
          <Select value={category} onChange={(e) => setCategory(e.target.value as typeof category)}>
            {BOOTH_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Score de compatibilidade (fit %)">
          <Input
            type="number"
            min={0}
            max={100}
            value={fit}
            onChange={(e) => setFit(e.target.value)}
          />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Button type="button" variant="secondary" onClick={() => onLocate('SELECT_STAND')} disabled={!standNumber(stand)}>
            Ver no mapa
          </Button>
          <Button type="button" variant="secondary" onClick={() => onLocate('ROUTE_TO_STAND')} disabled={!standNumber(stand)}>
            Traçar rota
          </Button>
        </div>
        <Button onClick={handleSave} disabled={busy}>
          {busy ? 'Salvando…' : 'Salvar dados do estande'}
        </Button>
      </div>
    </Card>
  );
}
