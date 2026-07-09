"use client";

import Link from "next/link";
import React, { useState } from "react";

// Inline SVG Icon components to avoid external dependencies
const Sparkles = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
);

const MapPin = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
);

const Smartphone = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></svg>
);

const Globe = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
);

const ShieldCheck = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M20 13c0 5-3.5 7.5-7.66 9.7a1 1 0 0 1-.68 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 .76-.97l7-2a1 1 0 0 1 .48 0l7 2A1 1 0 0 1 20 6v7z"/><path d="m9 12 2 2 4-4"/></svg>
);

const Users = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
);

const BarChart3 = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>
);

const ChevronDown = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m6 9 6 6 6-6"/></svg>
);

const Download = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
);

const ArrowRight = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
);

const CheckCircle2 = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
);

const Layers = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m12 3-10 5 10 5 10-5-10-5Z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/></svg>
);

const MapIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" x2="9" y1="3" y2="18"/><line x1="15" x2="15" y1="6" y2="21"/></svg>
);

const UserCheck = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="m16 11 2 2 4-4"/></svg>
);

export default function PresentationPage() {
  const [activeTab, setActiveTab] = useState<"expositor" | "visitante" | "admin">("expositor");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="bg-[#fcfdfd] text-[#0f172a] font-sans antialiased min-h-screen">
      
      {/* Decorative Top Accent */}
      <div className="h-1.5 w-full bg-gradient-to-r from-[#0c1527] via-[#c5a85c] to-[#0c1527]" />

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#0c1527] flex items-center justify-center shadow-md">
              <span className="text-[#c5a85c] font-black text-lg">EI</span>
            </div>
            <div>
              <span className="font-extrabold text-lg text-[#0c1527] block tracking-tight">Expo Industrial Sul</span>
              <span className="text-xs font-bold uppercase tracking-widest text-[#c5a85c]">Ecossistema Digital</span>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-8 font-semibold text-slate-600 text-sm">
            <a href="#ecossistema" className="hover:text-[#0c1527] transition-colors">Visão Geral</a>
            <a href="#jornadas" className="hover:text-[#0c1527] transition-colors">Jornadas</a>
            <a href="#admin" className="hover:text-[#0c1527] transition-colors">Painel Organizador</a>
            <a href="#beneficios" className="hover:text-[#0c1527] transition-colors">Benefícios</a>
            <a href="#faqs" className="hover:text-[#0c1527] transition-colors">Dúvidas</a>
          </nav>
          <div>
            <a 
              href="/portal/expositor/login" 
              className="inline-flex items-center justify-center px-4 py-2 text-xs font-bold uppercase tracking-wider text-white bg-[#0c1527] rounded-lg shadow-sm hover:bg-[#162545] transition-all"
            >
              Portal do Expositor
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-6 bg-gradient-to-b from-white to-slate-50/50">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 border border-[#c5a85c]/20 text-[#c5a85c] text-xs font-bold uppercase tracking-wider mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            Ambiente de apresentação e homologação
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-[#0c1527] leading-[1.1] mb-6">
            O Futuro da Expo Industrial Sul é <span className="bg-gradient-to-r from-[#0c1527] to-[#c5a85c] bg-clip-text text-transparent">Digital & Conectado</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto mb-10">
            Conheça o ecossistema integrado que une o Aplicativo do Evento, o Portal do Expositor e o Painel do Organizador para potencializar a geração de negócios e a coleta estratégica de dados durante a feira.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <a 
              href="#ecossistema" 
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-extrabold text-white bg-[#0c1527] rounded-xl shadow-lg hover:shadow-xl hover:bg-[#162545] transition-all"
            >
              Entenda o Ecossistema <ArrowRight className="h-4 w-4" />
            </a>
            <a 
              href="#faqs" 
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 text-sm font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
            >
              Sanar Dúvidas Frequentes
            </a>
          </div>
        </div>
      </section>

      {/* Visão Geral do Ecossistema */}
      <section id="ecossistema" className="py-20 px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#c5a85c] mb-2">Visão Geral</h2>
          <h3 className="text-3xl font-extrabold text-[#0c1527]">Integração Inteligente de Ponta a Ponta</h3>
          <p className="text-slate-500 mt-4">
            As frentes operacionais compartilham o mesmo banco de dados Firestore. Atualizações de expositores, agenda, patrocinadores e dados do evento são refletidas no app e no painel conectado.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-sm hover:shadow-md hover:border-[#c5a85c]/20 transition-all flex flex-col">
            <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center text-[#0ea5e9] mb-6">
              <Smartphone className="h-6 w-6" />
            </div>
            <h4 className="text-xl font-bold text-[#0c1527] mb-3">1. App do Visitante (Celular)</h4>
            <p className="text-slate-500 text-sm leading-relaxed mb-4">
              O companheiro de bolso do visitante. Oferece navegação por mapas 2D/3D interativos e sugere estandes com IA de matchmaking.
            </p>
            <a 
              href="https://expo-industrial-sul.vercel.app/profile" 
              target="_blank" 
              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 mb-4"
            >
              Acessar o App (Web) <ArrowRight className="h-3 w-3" />
            </a>
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-[11px] font-mono text-slate-500 leading-relaxed mb-6 mt-auto">
              <span className="font-bold text-slate-700 block mb-1 text-[11px]">CREDENCIAIS DE TESTE (App):</span>
              E-mail: <span className="text-slate-800 font-semibold select-all">apple.review@expoindustrialsul.com</span><br />
              Senha: <span className="text-slate-800 font-semibold select-all">AppleReview2026!</span>
            </div>
            <div className="border-t border-slate-50 pt-4 mt-auto">
              <span className="text-xs font-bold text-[#c5a85c] uppercase tracking-wider">Usabilidade do Visitante</span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-sm hover:shadow-md hover:border-[#c5a85c]/20 transition-all flex flex-col">
            <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center text-[#c5a85c] mb-6">
              <Globe className="h-6 w-6" />
            </div>
            <h4 className="text-xl font-bold text-[#0c1527] mb-3">2. Portal do Expositor (Web)</h4>
            <p className="text-slate-500 text-sm leading-relaxed mb-4">
              Acesso exclusivo para as marcas cadastrarem seus perfis, logotipos, contatos comerciais, emitirem o QR Code do estande e acompanharem os leads captados no evento.
            </p>
            <a 
              href="/portal/expositor/perfil" 
              className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 hover:text-amber-700 mb-4"
            >
              Acessar o Portal <ArrowRight className="h-3 w-3" />
            </a>
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-[11px] font-mono text-slate-500 leading-relaxed mb-6 mt-auto">
              <span className="font-bold text-slate-700 block mb-1 text-[11px]">CREDENCIAIS DE TESTE (Portal):</span>
              E-mail: <span className="text-slate-800 font-semibold select-all">expositor@expoindustrialsul.com</span><br />
              Senha: <span className="text-slate-800 font-semibold select-all">ExpositorExpo2026!</span>
            </div>
            <div className="border-t border-slate-50 pt-4 mt-auto">
              <span className="text-xs font-bold text-[#c5a85c] uppercase tracking-wider">Painel do Expositor</span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-sm hover:shadow-md hover:border-[#c5a85c]/20 transition-all flex flex-col">
            <div className="h-12 w-12 rounded-xl bg-[#0c1527]/5 flex items-center justify-center text-[#0c1527] mb-6">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h4 className="text-xl font-bold text-[#0c1527] mb-3">3. Painel do Organizador</h4>
            <p className="text-slate-500 text-sm leading-relaxed mb-4">
              A cabine de controle administrativo da organização. Permite revisar perfis de expositores, acompanhar o preenchimento de estandes, controlar patrocinadores, agenda, visitantes e dados gerais do evento.
            </p>
            <a 
              href="/login" 
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-800 hover:text-slate-900 mb-4"
            >
              Acessar o Painel Admin <ArrowRight className="h-3 w-3" />
            </a>
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-[11px] font-mono text-slate-500 leading-relaxed mb-6 mt-auto">
              <span className="font-bold text-slate-700 block mb-1 text-[11px]">CREDENCIAIS DE TESTE (Admin):</span>
              E-mail: <span className="text-slate-800 font-semibold select-all">admin@expoindustrialsul.com</span><br />
              Senha: <span className="text-slate-800 font-semibold select-all">AdminExpo2026!</span>
            </div>
            <div className="border-t border-slate-50 pt-4 mt-auto">
              <span className="text-xs font-bold text-[#c5a85c] uppercase tracking-wider">Controle Administrativo</span>
            </div>
          </div>
        </div>
      </section>

      {/* Jornadas / Como Funciona */}
      <section id="jornadas" className="py-20 bg-slate-50/50 border-y border-slate-100 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#c5a85c] mb-2">Jornadas Digitais</h2>
            <h3 className="text-3xl font-extrabold text-[#0c1527]">Fluxos e Caminhos Práticos</h3>
            <p className="text-slate-500 mt-2">Veja os caminhos pensados para otimizar a experiência de cada ponta no ecossistema.</p>
          </div>

          {/* Interactive Navigation Tabs */}
          <div className="flex justify-center mb-12">
            <div className="bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm flex gap-2">
              <button 
                onClick={() => setActiveTab("expositor")}
                className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === "expositor" ? "bg-[#0c1527] text-white shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
              >
                O Expositor
              </button>
              <button 
                onClick={() => setActiveTab("visitante")}
                className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === "visitante" ? "bg-[#0c1527] text-white shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
              >
                O Visitante (App)
              </button>
              <button 
                onClick={() => setActiveTab("admin")}
                className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === "admin" ? "bg-[#0c1527] text-white shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
              >
                A Organização
              </button>
            </div>
          </div>

          {/* Tab Contents */}
          <div className="bg-white rounded-2xl border border-slate-100 p-8 md:p-12 shadow-sm">
            {activeTab === "expositor" && (
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <h4 className="text-2xl font-black text-[#0c1527] mb-4">Autocadastro e Captação Inteligente de Leads</h4>
                  <p className="text-slate-600 text-sm leading-relaxed mb-6">
                    O expositor gerencia toda a sua presença no evento através do portal web dedicado. Não é necessário instalar nenhum programa; ele atualiza as informações direto do navegador.
                  </p>
                  
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <div className="h-6 w-6 rounded-full bg-amber-50 text-[#c5a85c] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</div>
                      <div>
                        <h5 className="font-bold text-slate-800 text-sm">Vínculo Seguro do Estande</h5>
                        <p className="text-xs text-slate-500 mt-0.5">Ele seleciona o número de seu estande físico da feira e cria uma conta corporativa para sua marca.</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <div className="h-6 w-6 rounded-full bg-amber-50 text-[#c5a85c] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</div>
                      <div>
                        <h5 className="font-bold text-slate-800 text-sm">Configuração de Perfil Comercial</h5>
                        <p className="text-xs text-slate-500 mt-0.5">Insere nome da empresa, logotipo, descrição institucional, segmento comercial, catálogo de produtos, site corporativo, redes sociais e palavras-chave de interesse para o matchmaking.</p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="h-6 w-6 rounded-full bg-amber-50 text-[#c5a85c] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</div>
                      <div>
                        <h5 className="font-bold text-slate-800 text-sm">Adesão Física ao QR Code</h5>
                        <p className="text-xs text-slate-500 mt-0.5">Se ele quiser, pode imprimir o QR Code exclusivo do estande físico no pavilhão da feira. O código leva o visitante ao perfil da empresa no aplicativo, facilitando consulta, contato e salvamento da marca.</p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="h-6 w-6 rounded-full bg-amber-50 text-[#c5a85c] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">4</div>
                      <div>
                        <h5 className="font-bold text-slate-800 text-sm">Leads do Evento</h5>
                        <p className="text-xs text-slate-500 mt-0.5">Acompanha a lista detalhada de contatos captados pela equipe do estande com opção de exportar tudo para arquivo CSV (Excel).</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-50 rounded-xl p-6 border border-slate-100 flex flex-col gap-4">
                  <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
                    <span className="text-[10px] font-bold text-[#c5a85c] uppercase tracking-wider block mb-1">Estande Reivindicado</span>
                    <span className="font-black text-[#0c1527] text-lg block">Estande 86 · Metalúrgica Sul</span>
                    <span className="text-xs text-slate-400">Setor: Usinagem e Ferramentaria</span>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex justify-between items-center">
                    <div>
                      <span className="text-xs font-bold text-slate-700 block">Total de Leads Coletados</span>
                      <span className="text-2xl font-black text-[#0c1527] mt-1 block">142</span>
                    </div>
                    <button className="h-9 px-3 rounded bg-emerald-50 text-emerald-600 border border-emerald-200 text-xs font-bold flex items-center gap-1.5">
                      <Download className="h-3.5 w-3.5" /> Exportar CSV
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "visitante" && (
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <h4 className="text-2xl font-black text-[#0c1527] mb-4">A Jornada do Visitante Dentro da Feira</h4>
                  <p className="text-slate-600 text-sm leading-relaxed mb-6">
                    O aplicativo atua como o mapa de navegação, credencial digital e assistente comercial do visitante. O cadastro e o uso das ferramentas seguem etapas estruturadas:
                  </p>

                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <div className="h-6 w-6 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</div>
                      <div>
                        <h5 className="font-bold text-slate-800 text-sm">Cadastro de Lead Obrigatório</h5>
                        <p className="text-xs text-slate-500 mt-0.5">Ao abrir o app pela primeira vez, o visitante deve preencher Nome Completo, E-mail, WhatsApp, Empresa e Cargo para acessar as áreas internas da feira.</p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="h-6 w-6 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</div>
                      <div>
                        <h5 className="font-bold text-slate-800 text-sm">Onboarding de Matchmaking B2B</h5>
                        <p className="text-xs text-slate-500 mt-0.5">O app convida o visitante a preencher suas preferências (áreas de interesse, budget e gargalos). A inteligência artificial analisa e gera uma lista recomendada de estandes e pessoas ideais.</p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="h-6 w-6 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</div>
                      <div>
                        <h5 className="font-bold text-slate-800 text-sm">Navegação por Mapas Interativos 2D/3D</h5>
                        <p className="text-xs text-slate-500 mt-0.5">O usuário pode visualizar a planta do pavilhão em 3D ou 2D, tocando nos estandes para ver logotipos, descrições e abrir a página corporativa das empresas.</p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="h-6 w-6 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">4</div>
                      <div>
                        <h5 className="font-bold text-slate-800 text-sm">Coleta e Troca de Contatos</h5>
                        <p className="text-xs text-slate-500 mt-0.5">Ele pode mostrar o QR Code de seu crachá digital para o expositor escanear, escanear crachás de outros visitantes para conexão B2B e acessar perfis de empresas pelo QR Code do estande.</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-50 rounded-xl p-8 border border-slate-100 flex justify-center items-center">
                  {/* CSS Mockup of Smartphone */}
                  <div className="w-56 h-[380px] bg-slate-900 rounded-[32px] p-2.5 shadow-xl border-4 border-slate-800 relative">
                    <div className="w-20 h-4 bg-slate-800 rounded-b-xl absolute top-0 left-1/2 -translate-x-1/2 z-20" />
                    <div className="bg-[#0c1527] w-full h-full rounded-[24px] p-3 text-white overflow-hidden flex flex-col">
                      <div className="flex justify-between items-center mt-2 mb-3">
                        <span className="text-[10px] font-bold text-[#c5a85c]">RECOMENDADO POR IA</span>
                        <Sparkles className="h-3.5 w-3.5 text-[#c5a85c]" />
                      </div>
                      <div className="bg-white/5 p-2 rounded-lg border border-white/10 mb-2">
                        <span className="text-[9px] font-bold text-slate-400 block">Estande 86</span>
                        <span className="text-xs font-extrabold block">Metalúrgica Sul</span>
                        <span className="text-[10px] text-emerald-400 mt-1 block">94% de afinidade industrial</span>
                      </div>
                      <div className="bg-white/5 p-2 rounded-lg border border-white/10 mb-2">
                        <span className="text-[9px] font-bold text-slate-400 block">Estande 102</span>
                        <span className="text-xs font-extrabold block">Automação Sul Ltda.</span>
                        <span className="text-[10px] text-emerald-400 mt-1 block">88% de afinidade industrial</span>
                      </div>
                      <div className="mt-auto bg-[#c5a85c] rounded-lg py-1.5 text-center text-[#0c1527] text-[10px] font-bold">
                        Ver Estandes no Mapa
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "admin" && (
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <h4 className="text-2xl font-black text-[#0c1527] mb-4">Controle Total e Inteligência do Evento</h4>
                  <p className="text-slate-600 text-sm leading-relaxed mb-6">
                    O Painel do Organizador permite monitorar o andamento das adesões, revisar dados de expositores, posicionar estandes no croqui e gerenciar os dados oficiais da feira.
                  </p>

                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <h5 className="font-bold text-slate-800 text-sm">Controle de Croqui e Estandes</h5>
                        <p className="text-xs text-slate-500 mt-0.5">Gestão das localizações, numeração das ruas, categorias de estandes e atualizações visuais do pavilhão.</p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <h5 className="font-bold text-slate-800 text-sm">Informações Completas dos Leads</h5>
                        <p className="text-xs text-slate-500 mt-0.5">Visualização de todos os perfis dos visitantes em tempo real, incluindo nome, cargo, empresa, e-mail, celular e suas respostas completas de matchmaking coletadas no evento.</p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <h5 className="font-bold text-slate-800 text-sm">Moderação de Marcas e Logotipos</h5>
                        <p className="text-xs text-slate-500 mt-0.5">Visualização dos logotipos e informações enviadas pelos expositores no portal, com possibilidade de edição e correção pelo organizador.</p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <h5 className="font-bold text-slate-800 text-sm">Visão Estatística Geral</h5>
                        <p className="text-xs text-slate-500 mt-0.5">Acesso a relatórios demográficos dos visitantes cadastrados e estatísticas agregadas de geração de contatos na feira.</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-50 rounded-xl p-6 border border-slate-100 flex flex-col gap-4">
                  <div className="bg-[#0c1527] text-white p-5 rounded-lg border border-white/5 shadow-md">
                    <span className="text-xs font-bold text-[#c5a85c] block mb-2 uppercase tracking-wider">Painel do Organizador</span>
                    <div className="space-y-2.5">
                      <div className="flex justify-between text-xs border-b border-white/10 pb-1.5">
                        <span className="text-slate-300">Estandes Reivindicados:</span>
                        <span className="font-bold text-white">82%</span>
                      </div>
                      <div className="flex justify-between text-xs border-b border-white/10 pb-1.5">
                        <span className="text-slate-300">Visitantes Cadastrados:</span>
                        <span className="font-bold text-white">2.450 ativos</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-300">Logotipos de Estandes:</span>
                        <span className="font-bold text-emerald-400">Todos Validados</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Funcionalidades do App */}
      <section id="funcionalidades" className="py-20 px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#c5a85c] mb-2">Recursos Práticos</h2>
          <h3 className="text-3xl font-extrabold text-[#0c1527]">O que estará no aplicativo da feira</h3>
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-xs flex flex-col">
            <Layers className="h-8 w-8 text-[#0c1527] mb-4" />
            <h5 className="font-bold text-[#0c1527] text-sm">Crachá Digital</h5>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">Geração automática de QR Code no perfil do usuário, com opção de toque para maximizar a tela e facilitar o escaneamento físico.</p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-xs flex flex-col">
            <MapIcon className="h-8 w-8 text-[#0c1527] mb-4" />
            <h5 className="font-bold text-[#0c1527] text-sm">Mapas 2D e 3D</h5>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">Visualização tridimensional realista do pavilhão para exploração intuitiva do mapa de ruas, categorias e locais de serviços.</p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-xs flex flex-col">
            <Sparkles className="h-8 w-8 text-[#0c1527] mb-4" />
            <h5 className="font-bold text-[#0c1527] text-sm">Recomendações por IA</h5>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">Cruzamento de interesses para sugerir quais expositores o visitante deve conhecer e contatar no evento.</p>
          </div>
        </div>
      </section>

      {/* Relatórios e Controles */}
      <section id="admin" className="py-20 bg-[#0c1527] text-white px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#c5a85c] block mb-2">Relatórios e Controles</span>
            <h3 className="text-3xl md:text-4xl font-black mb-6">Controle Estratégico em Suas Mãos</h3>
            <p className="text-slate-300 text-sm leading-relaxed mb-8">
              O painel permite acompanhar cadastros, revisar expositores, controlar patrocinadores, verificar visitantes cadastrados e identificar pendências antes da publicação no app.
            </p>

            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-lg bg-white/5 text-[#c5a85c] flex items-center justify-center shrink-0">
                  <BarChart3 className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">Relatório Consolidado de Geração de Negócios</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Veja quantos leads totais foram gerados e filtre contatos qualificados por segmento industrial.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-lg bg-white/5 text-[#c5a85c] flex items-center justify-center shrink-0">
                  <Users className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">Dashboard de Demografia do Público</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Identifique a distribuição de cargos e as principais empresas tomadoras de decisão presentes na feira.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-lg bg-white/5 text-[#c5a85c] flex items-center justify-center shrink-0">
                  <MapPin className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">Destaque de Patrocinadores</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Gerencie os logotipos das marcas patrocinadoras nos cabeçalhos e menus do app com efeito imediato.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-lg bg-white/5 text-[#c5a85c] flex items-center justify-center shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">Disparo de Notificações Push</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Dispare comunicados em tempo real, avisos importantes e atualizações da feira diretamente para os smartphones de todos os visitantes que possuem o aplicativo instalado.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/5 rounded-2xl border border-white/10 p-8">
            <h4 className="text-lg font-bold text-[#c5a85c] mb-4">Pré-visualização do Relatório</h4>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Visitantes Cadastrados</span>
                  <span className="text-white font-bold">2.450 / 3.000</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-[#c5a85c] rounded-full" style={{ width: "81%" }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Conexões Comerciais Estabelecidas</span>
                  <span className="text-white font-bold">12.840</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400 rounded-full" style={{ width: "95%" }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Adesão do Croqui (Portal Web)</span>
                  <span className="text-white font-bold">148 expositores</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-400 rounded-full" style={{ width: "74%" }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs Expositor */}
      <section id="faqs" className="py-20 px-6 max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#c5a85c] mb-2">FAQs</h2>
          <h3 className="text-3xl font-extrabold text-[#0c1527]">Dúvidas Frequentes Respondidas</h3>
        </div>

        {/* Expositor FAQs */}
        <div className="mb-12">
          <h4 className="text-lg font-extrabold text-[#0c1527] border-b border-slate-100 pb-3 mb-6">Dúvidas Frequentes dos Expositores</h4>
          
          <div className="space-y-4">
            <div className="bg-white border border-slate-200/60 rounded-xl overflow-hidden shadow-xs">
              <button 
                onClick={() => toggleFaq(1)}
                className="w-full px-6 py-4 text-left font-bold text-slate-800 text-sm md:text-base flex justify-between items-center hover:bg-slate-50 transition-colors"
              >
                <span>Como os visitantes acessam as informações da minha empresa no mapa?</span>
                <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${openFaq === 1 ? "rotate-180" : ""}`} />
              </button>
              {openFaq === 1 && (
                <div className="px-6 pb-4 pt-1 text-slate-600 text-xs md:text-sm leading-relaxed border-t border-slate-100 bg-slate-50/50">
                  O aplicativo possui um motor de busca global integrado. Ao digitar o nome da sua marca, o setor de atuação ou um de seus produtos, o estande correspondente é destacado visualmente na tela, seja no mapa 2D ou 3D.
                </div>
              )}
            </div>

            <div className="bg-white border border-slate-200/60 rounded-xl overflow-hidden shadow-xs">
              <button 
                onClick={() => toggleFaq(2)}
                className="w-full px-6 py-4 text-left font-bold text-slate-800 text-sm md:text-base flex justify-between items-center hover:bg-slate-50 transition-colors"
              >
                <span>Como coletamos os leads no pavilhão da feira?</span>
                <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${openFaq === 2 ? "rotate-180" : ""}`} />
              </button>
              {openFaq === 2 && (
                <div className="px-6 pb-4 pt-1 text-slate-600 text-xs md:text-sm leading-relaxed border-t border-slate-100 bg-slate-50/50">
                  A captação ocorre de forma controlada pelo crachá digital:
                  <br />
                  1. O visitante apresenta o QR Code do seu crachá digital no app.
                  <br />
                  2. O representante comercial abre o perfil do expositor no app e usa o botão &quot;Captar lead&quot; para escanear o crachá do visitante.
                  O contato fica associado ao expositor no Firestore e aparece na área de leads do Portal do Expositor.
                </div>
              )}
            </div>

            <div className="bg-white border border-slate-200/60 rounded-xl overflow-hidden shadow-xs">
              <button 
                onClick={() => toggleFaq(3)}
                className="w-full px-6 py-4 text-left font-bold text-slate-800 text-sm md:text-base flex justify-between items-center hover:bg-slate-50 transition-colors"
              >
                <span>Onde podemos acessar e baixar a planilha de contatos captados?</span>
                <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${openFaq === 3 ? "rotate-180" : ""}`} />
              </button>
              {openFaq === 3 && (
                <div className="px-6 pb-4 pt-1 text-slate-600 text-xs md:text-sm leading-relaxed border-t border-slate-100 bg-slate-50/50">
                  Toda a listagem de contatos coletados fica disponível na aba &quot;Leads&quot; do Portal do Expositor. No final do evento, basta clicar no botão &quot;Exportar Leads&quot; para fazer o download de um arquivo CSV, pronto para importação em ferramentas de e-mail marketing ou sistemas de CRM.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Andre FAQs */}
        <div>
          <h4 className="text-lg font-extrabold text-[#0c1527] border-b border-slate-100 pb-3 mb-6">Dúvidas da Organização</h4>
          
          <div className="space-y-4">
            <div className="bg-white border border-slate-200/60 rounded-xl overflow-hidden shadow-xs">
              <button 
                onClick={() => toggleFaq(4)}
                className="w-full px-6 py-4 text-left font-bold text-slate-800 text-sm md:text-base flex justify-between items-center hover:bg-slate-50 transition-colors"
              >
                <span>Como garantimos que as informações publicadas no app estão corretas?</span>
                <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${openFaq === 4 ? "rotate-180" : ""}`} />
              </button>
              {openFaq === 4 && (
                <div className="px-6 pb-4 pt-1 text-slate-600 text-xs md:text-sm leading-relaxed border-t border-slate-100 bg-slate-50/50">
                  A organização tem controle administrativo através do Painel do Organizador. Você pode monitorar as fichas salvas, editar dados que contenham erros, publicar ou manter expositores em rascunho e ajustar informações do evento sem depender do expositor.
                </div>
              )}
            </div>

            <div className="bg-white border border-slate-200/60 rounded-xl overflow-hidden shadow-xs">
              <button 
                onClick={() => toggleFaq(5)}
                className="w-full px-6 py-4 text-left font-bold text-slate-800 text-sm md:text-base flex justify-between items-center hover:bg-slate-50 transition-colors"
              >
                <span>Se a internet móvel do pavilhão físico cair, o aplicativo para de funcionar?</span>
                <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${openFaq === 5 ? "rotate-180" : ""}`} />
              </button>
              {openFaq === 5 && (
                <div className="px-6 pb-4 pt-1 text-slate-600 text-xs md:text-sm leading-relaxed border-t border-slate-100 bg-slate-50/50">
                  O app tem dados locais de demonstração e mantém preferências simples no dispositivo, mas a operação oficial de expositores, leads, visitantes, agenda e painel depende do Firebase. Para a feira, a recomendação operacional é garantir internet estável no pavilhão para cadastro, atualização e captação de leads.
                </div>
              )}
            </div>

            <div className="bg-white border border-slate-200/60 rounded-xl overflow-hidden shadow-xs">
              <button 
                onClick={() => toggleFaq(6)}
                className="w-full px-6 py-4 text-left font-bold text-slate-800 text-sm md:text-base flex justify-between items-center hover:bg-slate-50 transition-colors"
              >
                <span>Vendedores diferentes de um mesmo expositor podem coletar leads ao mesmo tempo?</span>
                <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${openFaq === 6 ? "rotate-180" : ""}`} />
              </button>
              {openFaq === 6 && (
                <div className="px-6 pb-4 pt-1 text-slate-600 text-xs md:text-sm leading-relaxed border-t border-slate-100 bg-slate-50/50">
                  Sim, desde que os representantes usem a conta do expositor vinculada ao estande. As captações gravadas com esse mesmo vínculo aparecem reunidas na área de leads do expositor.
                </div>
              )}
            </div>

            <div className="bg-white border border-slate-200/60 rounded-xl overflow-hidden shadow-xs">
              <button 
                onClick={() => toggleFaq(7)}
                className="w-full px-6 py-4 text-left font-bold text-slate-800 text-sm md:text-base flex justify-between items-center hover:bg-slate-50 transition-colors"
              >
                <span>Como funciona o compartilhamento seguro e controle de privacidade dos dados do crachá?</span>
                <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${openFaq === 7 ? "rotate-180" : ""}`} />
              </button>
              {openFaq === 7 && (
                <div className="px-6 pb-4 pt-1 text-slate-600 text-xs md:text-sm leading-relaxed border-t border-slate-100 bg-slate-50/50">
                  O escaneamento visa à facilitação de conexões B2B. Apenas os dados de visitantes que concordaram em compartilhar seus perfis durante o onboarding de matchmaking são disponibilizados. Além disso, as informações só são trocadas de forma explícita e controlada pelo portador do crachá, garantindo a autonomia do usuário.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Próximos Passos & CTA final */}
      <section className="bg-slate-50 py-20 px-6 border-t border-slate-100">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-3xl font-extrabold text-[#0c1527] mb-6">Pronto para iniciar os testes práticos?</h3>
          <p className="text-slate-600 text-sm md:text-base max-w-xl mx-auto mb-8">
            As rotas do painel web e o aplicativo estão integrados no ambiente unificado de homologação. Já podemos iniciar o preenchimento de teste das primeiras empresas.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a 
              href="/portal/expositor/login" 
              className="px-6 py-3.5 text-sm font-extrabold text-white bg-[#0c1527] rounded-xl shadow-md hover:bg-[#162545] transition-all"
            >
              Acessar Portal do Expositor
            </a>
            <Link 
              href="/" 
              className="px-6 py-3.5 text-sm font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
            >
              Ver Painel Organizador
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0c1527] text-slate-400 py-12 px-6 border-t border-white/5 text-center text-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-[#c5a85c] font-black text-sm">EI</span>
            <span className="text-white font-bold">Expo Industrial Sul 2026</span>
          </div>
          <div className="flex gap-6">
            <a href="/terms" className="hover:text-white transition-colors">Termos de Uso</a>
            <a href="/privacy" className="hover:text-white transition-colors">Política de Privacidade</a>
          </div>
          <div>
            <span>© 2026 Todos os direitos reservados. Ecossistema digital da Expo Industrial Sul.</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
