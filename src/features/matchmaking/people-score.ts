import { type VisitorProfile } from '@/features/visitor/visitor-profile';

export type PeopleFitResult = {
  /** 0–100. */
  score: number;
  /** Motivos legíveis do match (ex.: "Interesses em comum: IoT, Robótica"). */
  reasons: string[];
  /** Tags curtas para o card. */
  tags: string[];
};

/** Auxiliar para quebrar texto em tokens significativos */
function getTokens(text: string): string[] {
  return (text ?? '')
    .toLowerCase()
    .split(/[^a-zà-ú0-9]+/i)
    .filter((t) => t.length > 3);
}

export function computePeopleFit(
  me: VisitorProfile | null,
  other: VisitorProfile
): PeopleFitResult {
  const reasons: string[] = [];
  const tags: string[] = [];

  if (!me) {
    return {
      score: 50,
      reasons: ['Complete seu perfil para ver os motivos do match'],
      tags: other.sector && other.sector.length > 0 ? [other.sector[0]] : ['Visitante'],
    };
  }

  let score = 45;

  // 1) Complementaridade de Market Role
  const meRole = me.marketRole;
  const otherRole = other.marketRole;
  if (
    (meRole === 'Comprador' && otherRole === 'Fornecedor') ||
    (meRole === 'Fornecedor' && otherRole === 'Comprador')
  ) {
    score += 22;
    reasons.push('Parceiro comercial complementar (Comprador ↔ Fornecedor)');
  } else if (meRole === 'Ambos' || otherRole === 'Ambos') {
    score += 15;
    reasons.push('Interesse comercial complementar');
  } else if (meRole === otherRole && meRole !== '') {
    score += 5; // Mesma atuação de mercado, boa para networking direto
  }

  // 2) Setores em comum
  const meSectors = me.sector ?? [];
  const otherSectors = other.sector ?? [];
  const commonSectors = meSectors.filter((s) => otherSectors.includes(s));
  if (commonSectors.length > 0) {
    score += 12;
    reasons.push(`Mesmo setor industrial: ${commonSectors.join(', ')}`);
    tags.push(...commonSectors);
  }

  // 3) Objetivos em comum
  const meObjectives = me.objectives ?? [];
  const otherObjectives = other.objectives ?? [];
  const commonObjectives = meObjectives.filter((o) => otherObjectives.includes(o));
  if (commonObjectives.length > 0) {
    score += Math.min(16, commonObjectives.length * 8);
    reasons.push(`Mesmo objetivo no evento: ${commonObjectives.slice(0, 2).join(' e ')}`);
  }

  // 4) Interesses em comum
  const meInterests = me.interests ?? [];
  const otherInterests = other.interests ?? [];
  const commonInterests = meInterests.filter((i) => otherInterests.includes(i));
  if (commonInterests.length > 0) {
    score += Math.min(18, commonInterests.length * 6);
    tags.push(...commonInterests);
  }

  // 5) Gargalos em comum
  const meBottlenecks = me.bottlenecks ?? [];
  const otherBottlenecks = other.bottlenecks ?? [];
  const commonBottlenecks = meBottlenecks.filter((b) => otherBottlenecks.includes(b));
  if (commonBottlenecks.length > 0) {
    score += Math.min(12, commonBottlenecks.length * 6);
    reasons.push(`Compartilham gargalos: ${commonBottlenecks.slice(0, 2).join(', ')}`);
  }

  // 6) Match textual (lookingFor <-> offering)
  const meLooking = getTokens(me.lookingFor ?? '');
  const otherOffering = getTokens(other.offering ?? '');
  const otherLooking = getTokens(other.lookingFor ?? '');
  const meOffering = getTokens(me.offering ?? '');

  const hasOfferMatch1 = meLooking.some((token) => otherOffering.includes(token));
  const hasOfferMatch2 = otherLooking.some((token) => meOffering.includes(token));

  if (hasOfferMatch1 || hasOfferMatch2) {
    score += 15;
    reasons.push('Oferta ou busca com alta afinidade industrial');
  }

  // Se não tiver nenhuma tag de setor/interesse, usa o marketRole ou setor principal do outro
  if (tags.length === 0) {
    if (other.marketRole) tags.push(other.marketRole);
    if (otherSectors.length > 0) tags.push(otherSectors[0]);
  }

  return {
    score: Math.max(40, Math.min(99, Math.round(score))),
    reasons: reasons.slice(0, 3),
    tags: Array.from(new Set(tags)).slice(0, 3), // remove duplicatas
  };
}

export type RankedVisitor = {
  uid: string;
  profile: VisitorProfile;
  fit: PeopleFitResult;
};

export function rankPeople(me: VisitorProfile | null, others: { uid: string; profile: VisitorProfile }[]): RankedVisitor[] {
  return others
    .map((item) => ({
      uid: item.uid,
      profile: item.profile,
      fit: computePeopleFit(me, item.profile),
    }))
    .sort((a, b) => b.fit.score - a.fit.score);
}
