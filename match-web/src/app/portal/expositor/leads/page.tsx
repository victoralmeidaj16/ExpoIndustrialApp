'use client';

import { useEffect, useState } from 'react';

import { useAuth } from '@/features/auth/auth-context';
import { getExhibitorLeads, type ExhibitorLead } from '@/lib/services/exhibitors';
import { ExhibitorPageHeader } from '@/features/exhibitor-portal/exhibitor-shell';
import { Button, Spinner } from '@/components/ui';

export default function ExpositorLeadsPage() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<ExhibitorLead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLeads() {
      if (!user) return;
      try {
        const l = await getExhibitorLeads(user.uid);
        setLeads(l);
      } catch (err) {
        console.error('Erro ao carregar leads:', err);
      } finally {
        setLoading(false);
      }
    }
    loadLeads();
  }, [user]);

  function handleExportCSV() {
    if (leads.length === 0) return;

    const headers = ['Nome', 'Cargo', 'Empresa', 'E-mail', 'Telefone', 'Origem', 'Data/Hora'];
    const rows = leads.map((l) => [
      l.name,
      l.role,
      l.company,
      l.email,
      l.phone ?? '',
      l.source ?? 'Estande QR Code',
      l.createdAt ? new Date(l.createdAt).toLocaleString('pt-BR') : '',
    ]);

    // UTF-8 BOM para garantir acentos corretos no Excel
    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [
        headers.join(','),
        ...rows.map((row) => row.map((val) => `"${val.replace(/"/g, '""')}"`).join(',')),
      ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `leads_feira_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function getWhatsAppUrl(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    const intl = digits.startsWith('55') ? digits : `55${digits}`;
    return `https://wa.me/${intl}`;
  }

  if (loading) {
    return (
      <div className="flex h-60 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex-1">
          <h1 className="text-3xl font-black text-slate-100 uppercase tracking-tight bg-gradient-to-r from-slate-100 to-slate-400 bg-clip-text text-transparent">
            Leads Comerciais
          </h1>
          <p className="mt-1.5 text-base text-slate-400 font-medium">
            Gerencie os contatos coletados em tempo real por meio da leitura do QR Code do seu estande.
          </p>
        </div>

        {leads.length > 0 && (
          <Button
            onClick={handleExportCSV}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black uppercase text-xs tracking-wider py-4 px-6 rounded-lg cursor-pointer"
          >
            📥 Exportar Leads (CSV)
          </Button>
        )}
      </div>

      {leads.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-slate-900 border border-slate-800 rounded-2xl text-center p-8 gap-4 shadow-sm">
          <span className="text-5xl">👥</span>
          <div>
            <h3 className="text-lg font-bold text-slate-200">Nenhum Lead Coletado</h3>
            <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
              Quando os visitantes aproximarem e escanearem o QR Code do seu estande no aplicativo do evento, os dados deles aparecerão listados aqui automaticamente.
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden shadow-md">
          {/* Tabela Web */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/60 border-b border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-4 px-6">Nome / Empresa</th>
                  <th className="py-4 px-6">Cargo</th>
                  <th className="py-4 px-6">Contatos</th>
                  <th className="py-4 px-6">Origem</th>
                  <th className="py-4 px-6 text-right">Data/Hora</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-sm text-slate-300">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-950/20 transition">
                    <td className="py-4 px-6">
                      <p className="font-bold text-slate-100">{lead.name}</p>
                      <p className="text-xs text-slate-500">{lead.company}</p>
                    </td>
                    <td className="py-4 px-6 font-medium text-slate-400">{lead.role}</td>
                    <td className="py-4 px-6 space-y-1">
                      <p className="text-xs">{lead.email}</p>
                      {lead.phone && (
                        <a
                          href={getWhatsAppUrl(lead.phone)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 hover:underline"
                        >
                          🟢 {lead.phone}
                        </a>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-block rounded-full bg-slate-950 px-2.5 py-1 text-xs font-bold text-slate-400 border border-slate-800">
                        {lead.source ?? 'Estande QR Code'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right text-xs text-slate-500">
                      {lead.createdAt
                        ? new Date(lead.createdAt).toLocaleString('pt-BR', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })
                        : '--'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Grid responsivo Mobile */}
          <div className="md:hidden divide-y divide-slate-800">
            {leads.map((lead) => (
              <div key={lead.id} className="p-5 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-slate-100">{lead.name}</h4>
                    <p className="text-xs text-slate-400">
                      {lead.role} · <span className="text-amber-400">{lead.company}</span>
                    </p>
                  </div>
                  {lead.createdAt && (
                    <span className="text-[10px] text-slate-500">
                      {new Date(lead.createdAt).toLocaleDateString([], { month: 'numeric', day: 'numeric' })}
                    </span>
                  )}
                </div>

                <div className="text-xs text-slate-300 space-y-1 bg-slate-950/40 p-2.5 rounded-lg border border-slate-850">
                  <p>📧 {lead.email}</p>
                  {lead.phone && <p>📞 {lead.phone}</p>}
                </div>

                <div className="flex gap-2.5">
                  {lead.phone && (
                    <a
                      href={getWhatsAppUrl(lead.phone)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 text-center bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold uppercase py-2 text-[10px] tracking-wider rounded"
                    >
                      WhatsApp
                    </a>
                  )}
                  <a
                    href={`mailto:${lead.email}`}
                    className="flex-1 text-center bg-slate-950 border border-slate-800 text-slate-400 font-bold uppercase py-2 text-[10px] tracking-wider rounded"
                  >
                    E-mail
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
