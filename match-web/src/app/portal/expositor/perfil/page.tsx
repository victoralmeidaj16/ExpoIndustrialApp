'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/features/auth/auth-context';
import { getExhibitorByOwner, updateExhibitor } from '@/lib/services/exhibitors';
import { uploadExhibitorLogo } from '@/lib/uploads';
import { type Exhibitor } from '@/domain/exhibitor';
import { ExhibitorPageHeader } from '@/features/exhibitor-portal/exhibitor-shell';
import { Button, Input, Spinner } from '@/components/ui';

export default function ExpositorPerfilPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [exhibitor, setExhibitor] = useState<Exhibitor | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Campos do formulário
  const [company, setCompany] = useState('');
  const [about, setAbout] = useState('');
  const [industry, setIndustry] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactRole, setContactRole] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [instagram, setInstagram] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    async function loadExhibitor() {
      if (!user) return;
      try {
        const ex = await getExhibitorByOwner(user.uid);
        if (ex) {
          setExhibitor(ex);
          setCompany(ex.company);
          setAbout(ex.about ?? '');
          setIndustry(ex.industry ?? '');
          setContactName(ex.contactName ?? '');
          setContactRole(ex.contactRole ?? '');
          setContactEmail(ex.contactEmail ?? '');
          setContactPhone(ex.contactPhone ?? '');
          setWebsite(ex.website ?? '');
          setInstagram(ex.instagram ?? '');
          setLinkedin(ex.linkedin ?? '');
          setLogoUrl(ex.logoUrl ?? ex.logo ?? '');
        }
      } catch (err) {
        console.error('Erro ao carregar perfil:', err);
      } finally {
        setLoading(false);
      }
    }
    loadExhibitor();
  }, [user]);

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!exhibitor) return;

    setMessage(null);
    setSaving(true);

    try {
      let finalLogoUrl = logoUrl;

      // 1. Faz upload do logotipo se houver novo arquivo
      if (logoFile) {
        finalLogoUrl = await uploadExhibitorLogo(exhibitor.id, logoFile);
        setLogoUrl(finalLogoUrl);
        setLogoFile(null);
      }

      // 2. Atualiza dados no Firestore
      const updatedData: Partial<Exhibitor> = {
        company,
        about,
        industry,
        contactName,
        contactRole,
        contactEmail,
        contactPhone,
        website,
        instagram,
        linkedin,
        logoUrl: finalLogoUrl,
        logo: finalLogoUrl, // Compatibilidade retrógrada com o app
      };

      await updateExhibitor(exhibitor.id, updatedData);
      setMessage({ type: 'success', text: 'Perfil da empresa atualizado com sucesso!' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setMessage({ type: 'error', text: (err as Error).message });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-60 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!exhibitor) {
    return (
      <div className="text-center py-10 bg-slate-900 border border-slate-800 rounded-xl p-8">
        <p className="text-slate-400">Nenhum perfil de expositor encontrado para esta conta.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ExhibitorPageHeader
        title="Perfil do Expositor"
        description="Atualize as informações da sua marca e contatos exibidos para os visitantes da feira."
      />

      {message && (
        <div
          className={`p-4 rounded-xl border font-semibold text-sm ${
            message.type === 'success'
              ? 'bg-emerald-950/15 border-emerald-800/50 text-emerald-400'
              : 'bg-rose-950/15 border-rose-800/50 text-rose-400'
          }`}
        >
          {message.type === 'success' ? '✅' : '⚠️'} {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Bloco 1: Estande e Logotipo */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-md space-y-6">
          <h2 className="text-lg font-bold text-slate-100 border-b border-slate-800 pb-3">
            Estande & Marca
          </h2>

          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Upload de Logotipo */}
            <div className="flex flex-col items-center gap-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Logotipo da Empresa
              </label>
              <div className="relative h-32 w-32 rounded-xl bg-slate-950 border-2 border-dashed border-slate-800 flex items-center justify-center overflow-hidden group">
                {logoPreview || logoUrl ? (
                  <img
                    src={logoPreview || logoUrl}
                    alt="Logo Preview"
                    className="h-full w-full object-contain p-2"
                  />
                ) : (
                  <span className="text-3xl text-slate-700">🏢</span>
                )}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition cursor-pointer">
                  <span className="text-xs font-bold text-white uppercase">Alterar</span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
              <p className="text-[10px] text-slate-500 text-center">Formatos: PNG, JPG ou SVG</p>
            </div>

            {/* Identificação de Estande */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Nome Fantasia da Empresa
                </label>
                <Input
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  required
                  className="bg-slate-950 border-slate-800 focus:border-amber-500 text-slate-100 focus:ring-amber-500/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Setor / Indústria de Atuação
                </label>
                <Input
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="Ex: Robótica Industrial, Máquinas Especiais"
                  required
                  className="bg-slate-950 border-slate-800 focus:border-amber-500 text-slate-100 focus:ring-amber-500/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Número do Estande
                </label>
                <Input
                  value={exhibitor.stand}
                  disabled
                  className="bg-slate-950/50 border-slate-850 text-slate-500 font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Categoria de Patrocínio
                </label>
                <Input
                  value={exhibitor.category}
                  disabled
                  className="bg-slate-950/50 border-slate-850 text-slate-500 font-bold"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Descrição da Empresa (Sobre)
            </label>
            <textarea
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              placeholder="Descreva a empresa, diferenciais e atuação no mercado."
              required
              rows={4}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-3 text-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 outline-none text-sm"
            />
          </div>
        </div>

        {/* Bloco 2: Contatos Comerciais */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-md space-y-6">
          <h2 className="text-lg font-bold text-slate-100 border-b border-slate-800 pb-3">
            Contatos Comerciais (Visualizados ao fechar Match)
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Nome do Responsável
              </label>
              <Input
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Ex: João da Silva"
                className="bg-slate-950 border-slate-800 focus:border-amber-500 text-slate-100 focus:ring-amber-500/20"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Cargo do Responsável
              </label>
              <Input
                value={contactRole}
                onChange={(e) => setContactRole(e.target.value)}
                placeholder="Ex: Gerente Comercial"
                className="bg-slate-950 border-slate-800 focus:border-amber-500 text-slate-100 focus:ring-amber-500/20"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                WhatsApp Comercial
              </label>
              <Input
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="DDD + Número (ex: 47999998888)"
                className="bg-slate-950 border-slate-800 focus:border-amber-500 text-slate-100 focus:ring-amber-500/20"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                E-mail Comercial
              </label>
              <Input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="vendas@empresa.com"
                className="bg-slate-950 border-slate-800 focus:border-amber-500 text-slate-100 focus:ring-amber-500/20"
              />
            </div>
          </div>
        </div>

        {/* Bloco 3: Links e Mídias */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-md space-y-6">
          <h2 className="text-lg font-bold text-slate-100 border-b border-slate-800 pb-3">
            Links Corporativos
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Website
              </label>
              <Input
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://www.suaempresa.com"
                className="bg-slate-950 border-slate-800 focus:border-amber-500 text-slate-100 focus:ring-amber-500/20"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Instagram
              </label>
              <Input
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="https://instagram.com/suaempresa"
                className="bg-slate-950 border-slate-800 focus:border-amber-500 text-slate-100 focus:ring-amber-500/20"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                LinkedIn
              </label>
              <Input
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
                placeholder="https://linkedin.com/company/suaempresa"
                className="bg-slate-950 border-slate-800 focus:border-amber-500 text-slate-100 focus:ring-amber-500/20"
              />
            </div>
          </div>
        </div>

        <Button
          type="submit"
          disabled={saving}
          className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-black uppercase py-6 text-[15px] tracking-wide rounded-xl shadow-lg shadow-amber-500/10 cursor-pointer"
        >
          {saving ? <Spinner className="w-5 h-5 text-slate-950" /> : 'Salvar Alterações do Perfil'}
        </Button>
      </form>
    </div>
  );
}
