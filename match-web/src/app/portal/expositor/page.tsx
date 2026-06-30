'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import { useAuth } from '@/features/auth/auth-context';
import { getExhibitorByOwner, getExhibitorLeads, type ExhibitorLead } from '@/lib/services/exhibitors';
import { type Exhibitor } from '@/domain/exhibitor';
import { ExhibitorPageHeader } from '@/features/exhibitor-portal/exhibitor-shell';
import { Spinner } from '@/components/ui';

export default function ExpositorDashboardPage() {
  const { user } = useAuth();
  const [exhibitor, setExhibitor] = useState<Exhibitor | null>(null);
  const [leads, setLeads] = useState<ExhibitorLead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      try {
        const ex = await getExhibitorByOwner(user.uid);
        setExhibitor(ex);
        if (ex) {
          const l = await getExhibitorLeads(user.uid);
          setLeads(l);
        }
      } catch (err) {
        console.error('Erro ao carregar dados do painel:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

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
        <p className="text-slate-400">Nenhum expositor associado a esta conta.</p>
      </div>
    );
  }

  // Gera o QR Code que representa o estande do expositor para os visitantes escanearem
  // O link aponta para a URI do expositor usada pelo app para abrir a tela
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
    `expoindustrialsul://exhibitor/${exhibitor.id}`
  )}`;

  return (
    <div className="space-y-8">
      <ExhibitorPageHeader
        title={`Painel da Empresa`}
        description={`Bem-vindo, ${exhibitor.company}. Acompanhe seu desempenho no evento.`}
      />

      {/* Grid de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Leads Coletados
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-slate-100">{leads.length}</span>
            <span className="text-xs font-bold text-amber-400 uppercase">Profissionais</span>
          </div>
          <p className="mt-2 text-xs text-slate-400">Escaneados ou contatados no evento.</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Status do Perfil
          </div>
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${exhibitor.status === 'published' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            <span className="text-xl font-bold text-slate-200 capitalize">
              {exhibitor.status === 'published' ? 'Publicado' : 'Rascunho'}
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-400">Visibilidade ativa no app dos visitantes.</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Localização física
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-slate-200">Estande {exhibitor.stand}</span>
          </div>
          <p className="mt-2 text-xs text-slate-400">Categoria: {exhibitor.category || 'Standard'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Card do QR Code para Impressão */}
        <div className="lg:col-span-1 rounded-xl border border-slate-800 bg-slate-900 p-6 flex flex-col items-center justify-between text-center shadow-md gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-100">QR Code do Estande</h3>
            <p className="text-xs text-slate-400 mt-1">
              Imprima e deixe visível no seu estande para que os visitantes escaneiem e salvem o contato.
            </p>
          </div>

          <div className="my-4 bg-white p-3 rounded-lg border-2 border-amber-500/20">
            <img src={qrCodeUrl} alt="Estande QR Code" className="h-44 w-44 object-contain" />
          </div>

          <a
            href={qrCodeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full text-center bg-slate-950 border border-slate-800 hover:border-amber-500/50 text-amber-400 font-bold uppercase py-3 text-xs tracking-wider rounded-lg transition"
          >
            Visualizar e Imprimir
          </a>
        </div>

        {/* Últimos Leads Coletados */}
        <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <h3 className="text-lg font-bold text-slate-100">Últimos Leads Coletados</h3>
              <Link
                href="/portal/expositor/leads"
                className="text-xs font-bold text-amber-400 hover:underline uppercase"
              >
                Ver todos
              </Link>
            </div>

            {leads.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-500 text-center gap-2">
                <span className="text-3xl">👥</span>
                <p className="text-sm font-medium">Nenhum visitante escaneou seu estande ainda.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800">
                {leads.slice(0, 4).map((lead) => (
                  <div key={lead.id} className="py-3 flex justify-between items-center first:pt-0 last:pb-0">
                    <div>
                      <p className="font-bold text-slate-100">{lead.name}</p>
                      <p className="text-xs text-slate-400">
                        {lead.role} · <span className="text-amber-400/80">{lead.company}</span>
                      </p>
                    </div>
                    {lead.createdAt && (
                      <span className="text-[11px] text-slate-500">
                        {new Date(lead.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {leads.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-800 text-center">
              <p className="text-xs text-slate-400">
                Os contatos acima são integrados em tempo real a partir dos escaneamentos na feira.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
