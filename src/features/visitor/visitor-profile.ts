/**
 * Perfil do visitante (auto-serviço, autenticado).
 *
 * `visitors/{uid}` guarda somente identidade profissional e preferências de
 * matchmaking. Contatos, tokens e metadados operacionais ficam separados em
 * `visitorPrivateProfiles`, com uma cópia consentida em `visitorContactCards`.
 */
import {
  deleteField,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';

import { auth, db, isFirebaseConfigured } from '@/lib/firebase';

export const VISITORS_COLLECTION = 'visitors';
export const VISITOR_PRIVATE_PROFILES_COLLECTION = 'visitorPrivateProfiles';
export const VISITOR_CONTACT_CARDS_COLLECTION = 'visitorContactCards';

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

export function visitorProfileFromData(
  publicData: Record<string, unknown>,
  privateData: Record<string, unknown> = {},
): VisitorProfile {
  return {
    name: (publicData.name as string) ?? '',
    role: (publicData.role as string) ?? '',
    company: (publicData.company as string) ?? '',
    area: (publicData.area as string) ?? '',
    budget: (publicData.budget as string) ?? '',
    bottlenecks: Array.isArray(publicData.bottlenecks) ? (publicData.bottlenecks as string[]) : [],
    phone: (privateData.phone as string) ?? '',
    email: (privateData.email as string) ?? '',
    linkedin: (privateData.linkedin as string) ?? '',
    website: (privateData.website as string) ?? '',
    roleType: (publicData.roleType as VisitorProfile['roleType']) ?? '',
    sector: Array.isArray(publicData.sector) ? (publicData.sector as string[]) : [],
    marketRole: (publicData.marketRole as VisitorProfile['marketRole']) ?? '',
    objectives: Array.isArray(publicData.objectives) ? (publicData.objectives as string[]) : [],
    interests: Array.isArray(publicData.interests) ? (publicData.interests as string[]) : [],
    lookingFor: (publicData.lookingFor as string) ?? '',
    offering: (publicData.offering as string) ?? '',
    photoUrl: (publicData.photoUrl as string) ?? '',
    discoverable: (publicData.discoverable as boolean) ?? false,
    shareContact: (publicData.shareContact as boolean) ?? false,
    onboardingCompleted: (publicData.onboardingCompleted as boolean) ?? false,
    onboardingSkipped: (publicData.onboardingSkipped as boolean) ?? false,
  };
}

function publicProfilePayload(data: VisitorProfile, uid: string) {
  return {
    name: data.name.trim(),
    role: data.role.trim(),
    company: data.company.trim(),
    area: data.area.trim(),
    budget: data.budget,
    bottlenecks: data.bottlenecks.filter((item) => item.trim().length > 0),
    roleType: data.roleType ?? '',
    sector: data.sector ?? [],
    marketRole: data.marketRole ?? '',
    objectives: data.objectives ?? [],
    interests: data.interests ?? [],
    lookingFor: data.lookingFor ?? '',
    offering: data.offering ?? '',
    photoUrl: data.photoUrl ?? '',
    discoverable: data.discoverable ?? false,
    shareContact: data.shareContact ?? false,
    onboardingCompleted: data.onboardingCompleted ?? false,
    onboardingSkipped: data.onboardingSkipped ?? false,
    ownerUid: uid,
    // Remove os campos legados do documento público durante qualquer salvamento.
    phone: deleteField(),
    email: deleteField(),
    linkedin: deleteField(),
    website: deleteField(),
    pushTokens: deleteField(),
    pushPlatform: deleteField(),
    pushTokenUpdatedAt: deleteField(),
    leadCapturedAt: deleteField(),
    leadSource: deleteField(),
  };
}

function privateProfilePayload(data: VisitorProfile, uid: string) {
  return {
    ownerUid: uid,
    phone: data.phone?.trim() ?? '',
    email: (data.email || auth?.currentUser?.email || '').trim().toLowerCase(),
    linkedin: data.linkedin?.trim() ?? '',
    website: data.website?.trim() ?? '',
    updatedAt: serverTimestamp(),
  };
}

function contactCardPayload(data: VisitorProfile, uid: string) {
  return {
    ...privateProfilePayload(data, uid),
    shareContact: data.shareContact ?? false,
  };
}

export type UseVisitorProfileResult = {
  profile: VisitorProfile | null;
  loading: boolean;
  error: Error | null;
};

/** Assina o documento do visitante logado em tempo real. */
export function useVisitorProfile(): UseVisitorProfileResult {
  const uid = auth?.currentUser?.uid;
  const canSubscribe = isFirebaseConfigured && Boolean(db) && Boolean(uid);

  // O uid é guardado junto do dado: ao trocar de conta o resultado volta a
  // `loading` em vez de exibir por um instante o perfil da conta anterior.
  const [state, setState] = useState<{
    uid?: string;
    publicLoaded: boolean;
    privateLoaded: boolean;
    publicData: Record<string, unknown> | null;
    privateData: Record<string, unknown> | null;
    error: Error | null;
  }>({
    publicLoaded: false,
    privateLoaded: false,
    publicData: null,
    privateData: null,
    error: null,
  });

  useEffect(() => {
    if (!canSubscribe || !db || !uid) return;

    const publicRef = doc(db, VISITORS_COLLECTION, uid);
    const privateRef = doc(db, VISITOR_PRIVATE_PROFILES_COLLECTION, uid);
    const update = (patch: Partial<typeof state>) =>
      setState((previous) => ({
        ...(previous.uid === uid
          ? previous
          : {
              publicLoaded: false,
              privateLoaded: false,
              publicData: null,
              privateData: null,
              error: null,
            }),
        ...patch,
        uid,
      }));

    const unsubscribePublic = onSnapshot(
      publicRef,
      (snap) => update({
        publicLoaded: true,
        publicData: snap.exists() ? snap.data() : null,
        error: null,
      }),
      (err) => update({ publicLoaded: true, publicData: null, error: err }),
    );
    const unsubscribePrivate = onSnapshot(
      privateRef,
      (snap) => update({
        privateLoaded: true,
        privateData: snap.exists() ? snap.data() : null,
        error: null,
      }),
      (err) => update({ privateLoaded: true, privateData: null, error: err }),
    );

    return () => {
      unsubscribePublic();
      unsubscribePrivate();
    };
  }, [canSubscribe, uid]);

  // Sem Firebase ou sem login não há o que assinar — isso é vazio, não
  // "carregando". Derivar aqui evita o efeito que só existia para corrigir o
  // estado inicial depois da montagem.
  if (!canSubscribe) return { profile: null, loading: false, error: null };
  if (state.uid !== uid || !state.publicLoaded || !state.privateLoaded) {
    return { profile: null, loading: true, error: null };
  }
  const profile = state.publicData
    ? visitorProfileFromData(
        state.publicData,
        // Compatibilidade temporária: antes da migração, os contatos ainda
        // podem existir apenas no documento público do próprio usuário.
        state.privateData ?? state.publicData,
      )
    : null;
  return { profile, loading: false, error: state.error };
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
 * Grava identidade no perfil público e contato na coleção privada. O cartão de
 * contato nasce fechado e só será liberado se o visitante ativar `shareContact`.
 */
export async function captureLeadProfile(lead: LeadCapture): Promise<void> {
  if (!db || !auth?.currentUser) return;
  const uid = auth.currentUser.uid;
  const batch = writeBatch(db);
  batch.set(doc(db, VISITORS_COLLECTION, uid), {
    name: lead.name.trim(),
    company: lead.company.trim(),
    role: lead.role.trim(),
    ownerUid: uid,
    onboardingSkipped: true,
    phone: deleteField(),
    email: deleteField(),
  }, { merge: true });
  batch.set(doc(db, VISITOR_PRIVATE_PROFILES_COLLECTION, uid), {
    ownerUid: uid,
    phone: lead.phone.trim(),
    email: lead.email.trim().toLowerCase(),
    leadCapturedAt: serverTimestamp(),
    leadSource: 'signup',
    updatedAt: serverTimestamp(),
  }, { merge: true });
  batch.set(doc(db, VISITOR_CONTACT_CARDS_COLLECTION, uid), {
    ownerUid: uid,
    phone: lead.phone.trim(),
    email: lead.email.trim().toLowerCase(),
    linkedin: '',
    website: '',
    shareContact: false,
    updatedAt: serverTimestamp(),
  }, { merge: true });
  await batch.commit();
}

/**
 * Cadastro por e-mail da inscrição: guarda só o nome digitado e o e-mail da
 * conta. Diferente de `captureLeadProfile`, NÃO marca `onboardingSkipped` —
 * a pessoa segue para o onboarding, que completa empresa, cargo e WhatsApp
 * com o que a Sympla/R Gestor já tem para esse mesmo e-mail.
 */
export async function captureSignupIdentity(identity: { name: string; email: string }): Promise<void> {
  if (!db || !auth?.currentUser) return;
  const uid = auth.currentUser.uid;
  const email = identity.email.trim().toLowerCase();
  const batch = writeBatch(db);
  batch.set(doc(db, VISITORS_COLLECTION, uid), {
    name: identity.name.trim(),
    ownerUid: uid,
  }, { merge: true });
  batch.set(doc(db, VISITOR_PRIVATE_PROFILES_COLLECTION, uid), {
    ownerUid: uid,
    email,
    updatedAt: serverTimestamp(),
  }, { merge: true });
  await batch.commit();
}

/** Cria/atualiza o perfil do visitante logado. */
export async function saveVisitorProfile(data: VisitorProfile): Promise<void> {
  if (!db || !auth?.currentUser) {
    throw new Error('É preciso estar autenticado para salvar o perfil.');
  }
  const uid = auth.currentUser.uid;
  const batch = writeBatch(db);
  batch.set(doc(db, VISITORS_COLLECTION, uid), publicProfilePayload(data, uid), { merge: true });
  batch.set(
    doc(db, VISITOR_PRIVATE_PROFILES_COLLECTION, uid),
    privateProfilePayload(data, uid),
    { merge: true },
  );
  batch.set(
    doc(db, VISITOR_CONTACT_CARDS_COLLECTION, uid),
    contactCardPayload(data, uid),
    { merge: true },
  );
  await batch.commit();
}

/** Lê o perfil uma única vez (sem assinar) — útil fora de componentes. */
export async function getVisitorProfileOnce(): Promise<VisitorProfile | null> {
  if (!db || !auth?.currentUser) return null;
  const uid = auth.currentUser.uid;
  const [publicSnap, privateSnap] = await Promise.all([
    getDoc(doc(db, VISITORS_COLLECTION, uid)),
    getDoc(doc(db, VISITOR_PRIVATE_PROFILES_COLLECTION, uid)),
  ]);
  if (!publicSnap.exists()) return null;
  return visitorProfileFromData(
    publicSnap.data(),
    privateSnap.exists() ? privateSnap.data() : publicSnap.data(),
  );
}

/** Lê o perfil de qualquer visitante pelo seu UID (uma única vez). */
export async function getVisitorProfileByUid(uid: string): Promise<VisitorProfile | null> {
  if (!db || !auth?.currentUser) return null;
  if (uid === auth.currentUser.uid) return getVisitorProfileOnce();
  const snap = await getDoc(doc(db, VISITORS_COLLECTION, uid));
  return snap.exists() ? visitorProfileFromData(snap.data()) : null;
}
