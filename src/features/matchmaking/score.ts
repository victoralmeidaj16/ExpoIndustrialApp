/**
 * Motor de matchmaking — calcula a compatibilidade (fit) entre o perfil do
 * visitante e cada expositor, de forma transparente e explicável.
 *
 * O score combina três sinais:
 *   1. Área de atuação do visitante encontrada no texto do expositor.
 *   2. Gargalos operacionais que casam com o domínio do expositor (via mapa
 *      de palavras-chave).
 *   3. Prestígio da categoria do estande (peso menor).
 *
 * Não usa LLM: é determinístico, rápido e roda no cliente. Pode ser substituído
 * por um ranking server-side no futuro sem mudar a interface das telas.
 */
import { type Exhibitor } from '@/features/exhibitors/exhibitor';
import { type BoothCategory } from '@/features/venue/venue';
import { type VisitorProfile } from '@/features/visitor/visitor-profile';

/** Palavras-chave que ligam um gargalo do visitante ao domínio do expositor. */
const BOTTLENECK_KEYWORDS: Record<string, string[]> = {
  'OEE Baixo': ['oee', 'automação', 'mes', 'scada', 'eficiência', 'produtividade', 'digital'],
  'Gestão de S&OP Ineficiente': ['mes', 'planejamento', 's&op', 'ppcp', 'software', 'digital', 'gêmeo'],
  'Tempo de Setup Alto': ['automação', 'robótica', 'servo', 'cobot', 'célula', 'acionamento'],
  'Falta de Sensores (IoT)': ['sensor', 'iot', 'monitoramento', 'scada', 'medição'],
  'Desperdício de Energia': ['energia', 'eficiência', 'inversor', 'esg', 'ecostruxure', 'drives'],
  'Manutenção Corretiva Alta': ['preditiv', 'manutenção', 'monitoramento', 'digital', 'gêmeo', 'iot'],
};

/** Etiqueta curta exibida no card para cada gargalo. */
const BOTTLENECK_TAG: Record<string, string> = {
  'OEE Baixo': 'OEE',
  'Gestão de S&OP Ineficiente': 'PPCP / S&OP',
  'Tempo de Setup Alto': 'Setup',
  'Falta de Sensores (IoT)': 'IoT',
  'Desperdício de Energia': 'Energia',
  'Manutenção Corretiva Alta': 'Manutenção',
};

const CATEGORY_BOOST: Record<BoothCategory, number> = {
  'Super Diamante': 12,
  Diamante: 9,
  Reservado: 5,
  Standard: 2,
};

export type FitResult = {
  /** 0–100. */
  score: number;
  /** Motivos legíveis do match (ex.: "Resolve: OEE, Energia"). */
  reasons: string[];
  /** Tags curtas para o card. */
  tags: string[];
};

function haystack(e: Exhibitor): string {
  return [
    e.industry,
    e.about,
    e.category,
    ...(e.products ?? []),
    ...(e.segments ?? []),
    ...(e.targetAudience ?? []),
    ...(e.lookingFor ?? []),
    ...(e.keywords ?? []),
  ]
    .join(' ')
    .toLowerCase();
}

/** Tokens relevantes (>3 letras) de um texto livre. */
function tokens(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-zà-ú0-9]+/i)
    .filter((t) => t.length > 3);
}

/** Calcula o fit entre o perfil do visitante e um expositor. */
export function computeFit(profile: VisitorProfile | null, exhibitor: Exhibitor): FitResult {
  const text = haystack(exhibitor);
  const reasons: string[] = [];
  const tags: string[] = [];

  // Baseline + prestígio da categoria (sempre presente).
  let score = 52 + (CATEGORY_BOOST[exhibitor.category] ?? 0);

  if (profile) {
    // 1) Área de atuação aparece no texto do expositor.
    const areaTokens = tokens(profile.area);
    if (areaTokens.some((t) => text.includes(t))) {
      score += 14;
      reasons.push(`Atende ${profile.area}`);
    }

    // 2) Gargalos que casam com o domínio do expositor.
    const matched: string[] = [];
    for (const b of profile.bottlenecks) {
      const kws = BOTTLENECK_KEYWORDS[b] ?? [];
      if (kws.some((k) => text.includes(k))) {
        matched.push(BOTTLENECK_TAG[b] ?? b);
        score += 9;
      }
    }
    if (matched.length) {
      reasons.push(`Resolve: ${matched.join(', ')}`);
      tags.push(...matched);
    }
  }

  // Sem tags de gargalo → usa o setor como tag informativa.
  if (!tags.length && exhibitor.industry) tags.push(exhibitor.industry);

  return {
    score: Math.max(40, Math.min(99, Math.round(score))),
    reasons,
    tags: tags.slice(0, 3),
  };
}

export type RankedExhibitor = {
  exhibitor: Exhibitor;
  fit: FitResult;
};

/** Ranqueia expositores por fit (desc). */
export function rankExhibitors(
  profile: VisitorProfile | null,
  exhibitors: Exhibitor[],
): RankedExhibitor[] {
  return exhibitors
    .map((exhibitor) => ({ exhibitor, fit: computeFit(profile, exhibitor) }))
    .sort((a, b) => b.fit.score - a.fit.score);
}

/** `true` se o perfil tem dados suficientes para um match relevante. */
export function isProfileUsable(profile: VisitorProfile | null): boolean {
  return Boolean(profile && (profile.area.trim() || profile.bottlenecks.length));
}

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-2.5-flash';

export async function computeFitWithGemini(
  profile: VisitorProfile | null,
  exhibitor: Exhibitor
): Promise<FitResult> {
  if (!GEMINI_API_KEY || !profile) {
    return computeFit(profile, exhibitor);
  }

  const prompt = `
Você é um motor de matchmaking inteligente da feira industrial Expo Industrial Sul 2026.
Avalie a compatibilidade (fit) entre o perfil do visitante e o expositor.

Dados do Visitante:
- Área de atuação: ${profile.area || 'Não informada'}
- Budget de investimento: ${profile.budget || 'Não informado'}
- Gargalos operacionais: ${profile.bottlenecks.join(', ') || 'Nenhum listado'}

Dados do Expositor:
- Empresa: ${exhibitor.company}
- Setor/indústria: ${exhibitor.industry || 'Não informado'}
- Categoria do estande: ${exhibitor.category}
- Sobre a empresa: ${exhibitor.about || 'Não informado'}
- Produtos/soluções: ${exhibitor.products.join(', ') || 'Nenhum listado'}
- Segmentos atendidos: ${exhibitor.segments?.join(', ') || 'Nenhum listado'}
- Público-alvo: ${exhibitor.targetAudience?.join(', ') || 'Nenhum listado'}
- Busca na feira: ${exhibitor.lookingFor?.join(', ') || 'Não informado'}
- Palavras-chave: ${exhibitor.keywords?.join(', ') || 'Nenhuma listada'}

Retorne um JSON no formato:
{
  "score": (número de 0 a 100),
  "reasons": [(lista com até 3 strings de motivos específicos do porquê esse match é bom ou o que eles podem discutir)],
  "tags": [(lista com 1 a 3 tags curtas sobre as soluções ou interesses)]
}
Responda APENAS com o JSON, sem markdown ou formatações extras.
`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
        },
      }),
    });

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (text) {
      const parsed = JSON.parse(text);
      return {
        score: Math.max(0, Math.min(100, Number(parsed.score || 50))),
        reasons: Array.isArray(parsed.reasons) ? parsed.reasons : [],
        tags: Array.isArray(parsed.tags) ? parsed.tags : [],
      };
    }
  } catch (err) {
    console.error(`Erro ao rodar match por IA para ${exhibitor.company}:`, err);
  }

  return computeFit(profile, exhibitor);
}

export async function rankExhibitorsWithGemini(
  profile: VisitorProfile | null,
  exhibitors: Exhibitor[]
): Promise<RankedExhibitor[]> {
  if (!GEMINI_API_KEY || !profile) {
    return rankExhibitors(profile, exhibitors);
  }

  const promises = exhibitors.map(async (exhibitor) => {
    const fit = await computeFitWithGemini(profile, exhibitor);
    return { exhibitor, fit };
  });

  const results = await Promise.all(promises);
  return results.sort((a, b) => b.fit.score - a.fit.score);
}
