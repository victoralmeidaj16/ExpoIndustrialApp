'use client';

import { useState } from 'react';

import { PageHeader } from '@/components/app-shell';
import { Button, Card, Field, Input, Spinner, Textarea } from '@/components/ui';
import { type Material } from '@/domain/material';
import {
  createMaterial,
  deleteMaterial,
  updateMaterialMeta,
  useMaterials,
} from '@/features/materials/use-materials';
import { humanFileSize } from '@/lib/uploads';

export default function MateriaisPage() {
  const { materials, loading } = useMaterials();
  const [editing, setEditing] = useState<Material | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <div>
      <PageHeader
        title="Materiais para download"
        description="PDFs e arquivos que os visitantes baixam na home do app (planta, programação, catálogos…)."
      />

      <div className="mb-4">
        <Button
          onClick={() => {
            setEditing(null);
            setCreating(true);
          }}>
          + Novo material
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : materials.length === 0 ? (
        <Card className="p-8 text-center text-sm text-slate-500">
          Nenhum material enviado ainda.
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {materials.map((m) => (
            <Card key={m.id} className="flex items-center justify-between gap-4 p-4">
              <div className="flex min-w-0 items-center gap-3">
                <span className="text-2xl">📄</span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{m.title}</p>
                  <p className="truncate text-xs text-slate-400">
                    {m.fileName} · {humanFileSize(m.size)} · ordem {m.order}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <a href={m.fileUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="secondary">Abrir</Button>
                </a>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setCreating(false);
                    setEditing(m);
                  }}>
                  Editar
                </Button>
                <Button
                  variant="danger"
                  onClick={() => {
                    if (confirm(`Excluir “${m.title}”?`)) deleteMaterial(m.id, m.storagePath);
                  }}>
                  Excluir
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {creating && <CreateDialog onClose={() => setCreating(false)} />}
      {editing && <EditDialog material={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function CreateDialog({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [order, setOrder] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!file) {
      setError('Selecione um arquivo.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await createMaterial({ title, description, order, file });
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog title="Novo material" onClose={onClose} busy={busy}>
      <Field label="Título">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Planta do evento" />
      </Field>
      <Field label="Descrição">
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
      </Field>
      <Field label="Ordem" hint="menor aparece primeiro">
        <Input type="number" min={0} value={order} onChange={(e) => setOrder(Number(e.target.value) || 0)} />
      </Field>
      <Field label="Arquivo" hint="PDF, imagem ou documento — até 25 MB">
        <input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100"
        />
      </Field>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <DialogActions onClose={onClose} onSave={handleSave} busy={busy} disabled={!title.trim() || !file} />
    </Dialog>
  );
}

function EditDialog({ material, onClose }: { material: Material; onClose: () => void }) {
  const [title, setTitle] = useState(material.title);
  const [description, setDescription] = useState(material.description);
  const [order, setOrder] = useState(material.order);
  const [busy, setBusy] = useState(false);

  async function handleSave() {
    setBusy(true);
    try {
      await updateMaterialMeta(material.id, { title, description, order });
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog title="Editar material" onClose={onClose} busy={busy}>
      <Field label="Título">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      </Field>
      <Field label="Descrição">
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
      </Field>
      <Field label="Ordem">
        <Input type="number" min={0} value={order} onChange={(e) => setOrder(Number(e.target.value) || 0)} />
      </Field>
      <p className="text-xs text-slate-400">
        Arquivo: {material.fileName}. Para trocar o arquivo, exclua e crie de novo.
      </p>
      <DialogActions onClose={onClose} onSave={handleSave} busy={busy} disabled={!title.trim()} />
    </Dialog>
  );
}

function Dialog({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  busy: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <Card className="max-h-[90vh] w-full max-w-lg overflow-y-auto p-6">
        <h2 className="mb-4 text-lg font-bold text-slate-900">{title}</h2>
        <div className="flex flex-col gap-3">{children}</div>
      </Card>
    </div>
  );
}

function DialogActions({
  onClose,
  onSave,
  busy,
  disabled,
}: {
  onClose: () => void;
  onSave: () => void;
  busy: boolean;
  disabled: boolean;
}) {
  return (
    <div className="mt-3 flex justify-end gap-2">
      <Button variant="secondary" onClick={onClose} disabled={busy}>
        Cancelar
      </Button>
      <Button onClick={onSave} disabled={busy || disabled}>
        {busy ? 'Salvando…' : 'Salvar'}
      </Button>
    </div>
  );
}
