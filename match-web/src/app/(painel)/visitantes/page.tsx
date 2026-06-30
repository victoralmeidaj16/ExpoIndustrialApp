'use client';

import { useState } from 'react';

import { PageHeader } from '@/components/app-shell';
import { Card, Input, Spinner } from '@/components/ui';
import { useVisitors } from '@/features/visitors/use-visitors';

export default function VisitantesPage() {
  const { visitors, loading } = useVisitors();
  const [search, setSearch] = useState('');

  const filtered = visitors.filter((v) => {
    if (!search) return true;
    const queryStr = search.toLowerCase();
    return (
      (v.name || '').toLowerCase().includes(queryStr) ||
      (v.company || '').toLowerCase().includes(queryStr) ||
      (v.role || '').toLowerCase().includes(queryStr) ||
      (v.marketRole || '').toLowerCase().includes(queryStr) ||
      (v.sector ?? []).some((s) => s.toLowerCase().includes(queryStr))
    );
  });

  const completedCount = visitors.filter((v) => v.onboardingCompleted).length;

  return (
    <div>
      <PageHeader
        title="Visitantes"
        description="Perfis, interesses e respostas de onboarding dos participantes do evento."
      />

      {/* Metrics Cards */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-2xl font-extrabold tracking-tight text-[#071A33]">{visitors.length}</p>
          <p className="mt-0.5 text-xs font-bold uppercase tracking-wide text-slate-400">Total de visitantes</p>
        </Card>
        <Card className="p-4">
          <p className="text-2xl font-extrabold tracking-tight text-[#22C55E]">{completedCount}</p>
          <p className="mt-0.5 text-xs font-bold uppercase tracking-wide text-slate-400">Onboarding concluído</p>
        </Card>
        <Card className="p-4">
          <p className="text-2xl font-extrabold tracking-tight text-[#C9A24C]">{visitors.length - completedCount}</p>
          <p className="mt-0.5 text-xs font-bold uppercase tracking-wide text-slate-400">Pendentes / pulados</p>
        </Card>
      </div>

      <div className="mb-5">
        <Input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome, empresa, cargo, papel de mercado ou setor..."
          className="border-slate-200/80 text-sm focus:border-[#C9A24C] focus:ring-[#C9A24C]"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-8 text-center text-sm font-medium text-slate-500">
          Nenhum visitante correspondente à busca.
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((v) => (
            <Card key={v.uid} className="flex flex-col gap-4 p-5 transition duration-200 hover:shadow-md">
              {/* Header card info */}
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div className="space-y-1">
                  <h3 className="text-base font-bold tracking-tight text-[#071A33]">{v.name || 'Sem nome'}</h3>
                  <p className="text-sm font-medium text-slate-500">
                    {v.role || 'Cargo não informado'} em <span className="font-bold text-[#071A33]">{v.company || 'Empresa não informada'}</span>
                  </p>
                  <p className="text-xs font-semibold tracking-wide text-slate-400">
                    {v.email || 'Sem e-mail'} {v.phone ? ` · ${v.phone}` : ''}
                  </p>
                </div>
                <span className={`inline-flex shrink-0 items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${
                  v.onboardingCompleted
                    ? 'bg-green-50 text-[#22C55E] border border-green-200/60'
                    : 'bg-amber-50 text-[#C9A24C] border border-amber-200/60'
                }`}>
                  {v.onboardingCompleted ? 'Completo' : 'Pendente'}
                </span>
              </div>

              {/* Informações de Matchmaking e Onboarding preenchidas */}
              <div className="space-y-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="bg-white rounded-xl p-3 border border-slate-200/40">
                    <span className="mb-0.5 block text-[11px] font-bold uppercase tracking-wide text-slate-400">Papel de mercado</span>
                    <span className="text-sm font-bold text-[#071A33]">{v.marketRole || 'Não informado'}</span>
                  </div>
                  <div className="bg-white rounded-xl p-3 border border-slate-200/40">
                    <span className="mb-0.5 block text-[11px] font-bold uppercase tracking-wide text-slate-400">Tipo de cargo</span>
                    <span className="text-sm font-bold text-[#071A33]">{v.roleType || 'Não informado'}</span>
                  </div>
                  <div className="bg-white rounded-xl p-3 border border-slate-200/40">
                    <span className="mb-0.5 block text-[11px] font-bold uppercase tracking-wide text-slate-400">Budget</span>
                    <span className="text-sm font-bold text-[#071A33]">{v.budget || 'Não informado'}</span>
                  </div>
                  <div className="bg-white rounded-xl p-3 border border-slate-200/40">
                    <span className="mb-0.5 block text-[11px] font-bold uppercase tracking-wide text-slate-400">Privacidade</span>
                    <span className="text-sm font-bold text-[#071A33]">{v.discoverable ? 'Público no Match' : 'Privado'}</span>
                  </div>
                </div>

                {v.sector && v.sector.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="block text-[11px] font-bold uppercase tracking-wide text-slate-400">Setores de atuação</span>
                    <div className="flex flex-wrap gap-2">
                      {v.sector.map((s) => (
                        <span key={s} className="inline-block rounded-lg bg-[#2F6BFF]/5 border border-[#2F6BFF]/10 px-2.5 py-1 text-xs font-bold text-[#2F6BFF]">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {v.objectives && v.objectives.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="block text-[11px] font-bold uppercase tracking-wide text-slate-400">Objetivos no evento</span>
                    <div className="flex flex-wrap gap-2">
                      {v.objectives.map((o) => (
                        <span key={o} className="inline-block rounded-lg bg-[#C9A24C]/5 border border-[#C9A24C]/10 px-2.5 py-1 text-xs font-bold text-[#C9A24C]">
                          {o}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {v.interests && v.interests.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="block text-[11px] font-bold uppercase tracking-wide text-slate-400">Tecnologias de interesse</span>
                    <div className="flex flex-wrap gap-2">
                      {v.interests.map((i) => (
                        <span key={i} className="inline-block rounded-lg bg-[#00C8FF]/5 border border-[#00C8FF]/10 px-2.5 py-1 text-xs font-bold text-[#00C8FF]">
                          {i}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {v.bottlenecks && v.bottlenecks.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="block text-[11px] font-bold uppercase tracking-wide text-slate-400">Gargalos de operação</span>
                    <div className="flex flex-wrap gap-2">
                      {v.bottlenecks.map((b) => (
                        <span key={b} className="inline-block rounded-lg bg-red-50 border border-red-100 px-2.5 py-1 text-xs font-bold text-red-600">
                          {b}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {v.lookingFor && (
                  <div className="pt-3 border-t border-slate-200/60">
                    <span className="block text-[11px] font-bold uppercase tracking-wide text-slate-400">O que busca na feira</span>
                    <p className="mt-1 rounded-xl border border-slate-100 bg-white p-3 text-sm font-medium italic text-[#071A33]">
                      &ldquo;{v.lookingFor}&rdquo;
                    </p>
                  </div>
                )}

                {v.offering && (
                  <div className="pt-1">
                    <span className="block text-[11px] font-bold uppercase tracking-wide text-slate-400">O que oferece / fornece</span>
                    <p className="mt-1 rounded-xl border border-slate-100 bg-white p-3 text-sm font-medium italic text-[#071A33]">
                      &ldquo;{v.offering}&rdquo;
                    </p>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
