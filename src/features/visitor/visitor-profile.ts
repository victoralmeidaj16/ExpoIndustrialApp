/**
 * Perfil do visitante (auto-serviço, autenticado).
 *
 * Cada visitante logado é dono do documento `visitors/{uid}`: dados do crachá
 * (nome/cargo/empresa) e as preferências que alimentam o matchmaking
 * (área, budget, gargalos). A leitura/escrita é restrita ao próprio dono.
 */
import { doc, getDoc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';

import { auth, db, isFirebaseConfigured } from '@/lib/firebase';

export const VISITORS_COLLECTION = 'visitors';

export type VisitorProfile = {
  name: string;
  role: string;
  company: string;
  /** Área industrial de atuação (texto livre). */
  area: string;
  /** Faixa de investimento. */
  budget: string;
  /** Gargalos operacionais selecionados. */
  bottlenecks: string[];
  phone?: string;
  email?: string;
  linkedin?: string;
  website?: string;

  // Novos campos
  roleType?: 'Diretor/Decisor Final' | 'Gestor/Formador de Opinião' | 'Técnico/Operação' | 'Comercial' | 'Acadêmico' | '';
  sector?: string[];
  marketRole?: 'Comprador' | 'Fornecedor' | 'Serviço' | 'Ambos' | '';
  objectives?: string[];
  interests?: string[];
  lookingFor?: string;
  offering?: string;
  photoUrl?: string;
  discoverable?: boolean;
  shareContact?: boolean;
  onboardingCompleted?: boolean;
  onboardingSkipped?: boolean;
};

export const EMPTY_VISITOR_PROFILE: VisitorProfile = {
  name: '',
  role: '',
  company: '',
  area: '',
  budget: '',
  bottlenecks: [],
  phone: '',
  email: '',
  linkedin: '',
  website: '',
  roleType: '',
  sector: [],
  marketRole: '',
  objectives: [],
  interests: [],
  lookingFor: '',
  offering: '',
  photoUrl: '',
  discoverable: false,
  shareContact: false,
  onboardingCompleted: false,
  onboardingSkipped: false,
};

/** Perfil de exemplo usado enquanto o Firebase não está configurado (modo demo). */
export const DEMO_VISITOR_PROFILE: VisitorProfile = {
  name: 'Victor Almeida',
  role: 'Diretor de Operações',
  company: 'Sul Metalúrgica',
  area: 'Metalurgia e produtos de metal',
  budget: 'R$ 100k - R$ 500k',
  bottlenecks: ['OEE baixo', 'PPCP ineficiente'],
  phone: '(47) 98888-1111',
  email: 'victor.almeida@sulmetalurgica.com.br',
  linkedin: 'https://linkedin.com/in/victor-almeida-sul',
  website: 'https://sulmetalurgica.com.br',
  roleType: 'Diretor/Decisor Final',
  sector: ['Metalurgia e produtos de metal'],
  marketRole: 'Comprador',
  objectives: ['Encontrar fornecedores', 'Networking'],
  interests: ['Automação Industrial', 'PPCP', 'S&OP / S&OE / IBP'],
  lookingFor: 'Fornecedores de braços robóticos e sistemas MES',
  offering: 'Peças estampadas sob medida e serviços de usinagem',
  photoUrl: '',
  discoverable: true,
  shareContact: true,
  onboardingCompleted: true,
  onboardingSkipped: false,
};

export const BUDGET_OPTIONS = [
  'Até R$ 100k',
  'R$ 100k - R$ 500k',
  'R$ 500k - R$ 2M',
  'Acima de R$ 2M',
] as const;

/** Máximo de gargalos que o participante pode marcar. */
export const MAX_BOTTLENECKS = 5;
/** Máximo de áreas de interesse que o participante pode marcar. */
export const MAX_INTERESTS = 3;

export const BOTTLENECK_OPTIONS = [
  'Baixa produtividade',
  'OEE baixo',
  'Paradas não planejadas',
  'Manutenção corretiva elevada',
  'Baixa confiabilidade dos equipamentos',
  'Tempo de setup alto',
  'Desorganização e desperdícios (5S)',
  'Baixa maturidade em Excelência Operacional',
  'Problemas na Gestão da Qualidade',
  'Não conformidades, refugos e retrabalho',
  'Baixo nível de automação industrial',
  'Dificuldade na transformação digital',
  'Dificuldade na adoção de Inteligência Artificial',
  'Baixa digitalização dos processos',
  'Falta de integração entre ERP, MES, APS e chão de fábrica',
  'PPCP ineficiente',
  'S&OP / S&OE pouco estruturado',
  'Baixa acuracidade das previsões de demanda',
  'Problemas na cadeia de suprimentos (Supply Chain)',
  'Baixa rastreabilidade dos processos',
  'Falta de indicadores em tempo real',
  'Alto consumo de energia',
  'Desafios na agenda ESG',
  'Baixa segurança operacional',
  'Escassez de mão de obra qualificada',
  'Alto custo operacional',
  'Baixa capacidade de inovação',
  'Dificuldade na gestão de projetos de melhoria',
  'Baixo engajamento das equipes',
  'Outros',
] as const;

export const ROLE_TYPES = [
  'Diretor/Decisor Final',
  'Gestor/Formador de Opinião',
  'Técnico/Operação',
  'Comercial',
  'Acadêmico',
] as const;

export const MARKET_ROLES = [
  'Comprador',
  'Fornecedor',
  'Serviço',
  'Ambos',
] as const;

export const OBJECTIVES = [
  'Encontrar fornecedores',
  'Gerar leads',
  'Networking',
  'Tendências',
  'Recrutar',
  'Parcerias/investimento',
  'Expor soluções',
  'Realizar benchmark',
  'Palestras técnicas',
  'Cases reais',
  'Conhecimento geral',
] as const;

export const INTERESTS = [
  'PPCP',
  'S&OP / S&OE / IBP',
  'Supply Chain e Logística',
  'Indústria 4.0',
  'Automação Industrial',
  'Inteligência Artificial (IA)',
  'Transformação Digital',
  'Manutenção e Confiabilidade',
  'Programa 5S',
  'Lean Manufacturing',
  'Excelência Operacional',
  'Gestão da Qualidade',
  'Energia e Eficiência Energética',
  'ESG e Sustentabilidade',
  'Robótica Industrial',
  'IoT Industrial',
  'Tecnologias e Softwares Industriais',
  'Gestão de Processos',
  'Engenharia Industrial',
  'Cibersegurança Industrial',
] as const;

export const SECTORS = [
  'Alimentos e bebidas',
  'Têxtil e vestuário',
  'Couro e calçados',
  'Madeira, papel e celulose',
  'Química (inclui farmacêutica, higiene/limpeza, tintas etc.)',
  'Borracha e plásticos',
  'Metalurgia e produtos de metal',
  'Máquinas e equipamentos',
  'Material elétrico e eletrônico (inclui TI/eletroeletrônicos)',
  'Automotiva e outros transportes',
  'Móveis e outros produtos diversos',
  'Outros tipos de indústria',
  'Serviços (treinamento, consultoria, assessoria, diagnósticos, etc)',
] as const;

function fromDoc(data: Record<string, unknown>): VisitorProfile {
  return {
    name: (data.name as string) ?? '',
    role: (data.role as string) ?? '',
    company: (data.company as string) ?? '',
    area: (data.area as string) ?? '',
    budget: (data.budget as string) ?? '',
    bottlenecks: Array.isArray(data.bottlenecks) ? (data.bottlenecks as string[]) : [],
    phone: (data.phone as string) ?? '',
    email: (data.email as string) ?? '',
    linkedin: (data.linkedin as string) ?? '',
    website: (data.website as string) ?? '',
    roleType: (data.roleType as VisitorProfile['roleType']) ?? '',
    sector: Array.isArray(data.sector) ? (data.sector as string[]) : [],
    marketRole: (data.marketRole as VisitorProfile['marketRole']) ?? '',
    objectives: Array.isArray(data.objectives) ? (data.objectives as string[]) : [],
    interests: Array.isArray(data.interests) ? (data.interests as string[]) : [],
    lookingFor: (data.lookingFor as string) ?? '',
    offering: (data.offering as string) ?? '',
    photoUrl: (data.photoUrl as string) ?? '',
    discoverable: (data.discoverable as boolean) ?? false,
    shareContact: (data.shareContact as boolean) ?? false,
    onboardingCompleted: (data.onboardingCompleted as boolean) ?? false,
    onboardingSkipped: (data.onboardingSkipped as boolean) ?? false,
  };
}

export type UseVisitorProfileResult = {
  profile: VisitorProfile | null;
  loading: boolean;
  error: Error | null;
};

/** Assina o documento do visitante logado em tempo real. */
export function useVisitorProfile(): UseVisitorProfileResult {
  const [profile, setProfile] = useState<VisitorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const uid = auth?.currentUser?.uid;

  useEffect(() => {
    if (!isFirebaseConfigured || !db || !uid) {
      setLoading(false);
      return;
    }

    const ref = doc(db, VISITORS_COLLECTION, uid);
    const unsubscribe = onSnapshot(
      ref,
      (snap) => {
        setProfile(snap.exists() ? fromDoc(snap.data()) : null);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [uid]);

  return { profile, loading, error };
}

/**
 * Dados mínimos de contato exigidos de TODO usuário no cadastro — captação de
 * lead pedida pela organização (nome, WhatsApp, e-mail, empresa e cargo), mesmo
 * de quem só baixa o app por curiosidade e não se inscreve no evento.
 */
export type LeadCapture = {
  name: string;
  company: string;
  role: string;
  phone: string;
  email: string;
};

/**
 * Grava os dados de lead captados no momento do cadastro em `visitors/{uid}`
 * (visível ao organizador no painel match-web). Faz `merge`, então não sobrescreve
 * o que o onboarding preencher depois. Best-effort: nunca deve bloquear o login.
 */
export async function captureLeadProfile(lead: LeadCapture): Promise<void> {
  if (!db || !auth?.currentUser) return;
  const uid = auth.currentUser.uid;
  await setDoc(
    doc(db, VISITORS_COLLECTION, uid),
    {
      name: lead.name.trim(),
      company: lead.company.trim(),
      role: lead.role.trim(),
      phone: lead.phone.trim(),
      email: lead.email.trim().toLowerCase(),
      ownerUid: uid,
      leadCapturedAt: serverTimestamp(),
      leadSource: 'signup',
      onboardingSkipped: true,
    },
    { merge: true },
  );
}

/** Cria/atualiza o perfil do visitante logado. */
export async function saveVisitorProfile(data: VisitorProfile): Promise<void> {
  if (!db || !auth?.currentUser) {
    throw new Error('É preciso estar autenticado para salvar o perfil.');
  }
  const uid = auth.currentUser.uid;
  const ref = doc(db, VISITORS_COLLECTION, uid);
  await setDoc(
    ref,
    {
      ...data,
      bottlenecks: data.bottlenecks.filter((b) => b.trim().length > 0),
      ownerUid: uid,
    },
    { merge: true },
  );
}

/** Lê o perfil uma única vez (sem assinar) — útil fora de componentes. */
export async function getVisitorProfileOnce(): Promise<VisitorProfile | null> {
  if (!db || !auth?.currentUser) return null;
  const snap = await getDoc(doc(db, VISITORS_COLLECTION, auth.currentUser.uid));
  return snap.exists() ? fromDoc(snap.data()) : null;
}

/** Lê o perfil de qualquer visitante pelo seu UID (uma única vez). */
export async function getVisitorProfileByUid(uid: string): Promise<VisitorProfile | null> {
  if (!db || !auth?.currentUser) return null;
  const snap = await getDoc(doc(db, VISITORS_COLLECTION, uid));
  return snap.exists() ? fromDoc(snap.data()) : null;
}
