/**
 * Leads / contatos captados pelo usuário logado (ex.: scan de QR do crachá no
 * estande). A fonte da verdade é o Firestore: coleção raiz `leads`, cada doc
 * com `ownerUid` apontando para quem captou — assim o contato sincroniza entre
 * aparelhos e fica disponível no perfil.
 *
 * Sem Firebase configurado OU sem ninguém logado, cai num armazenamento local
 * (AsyncStorage) com dados de exemplo, para o app seguir demonstrável.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  where,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';

import { auth, db, isFirebaseConfigured } from '@/lib/firebase';
import { sha256Hex } from '@/lib/sha256';

export type SavedLead = {
  id: string;
  ownerUid?: string;
  name: string;
  role: string;
  company: string;
  source: string;
  email: string;
  phone?: string;
  exhibitorId?: string;
  exhibitorName?: string;
  stand?: string;
  /** Epoch ms da captação — usado para ordenar (mais recentes primeiro). */
  createdAt?: number;
};

export const LEADS_COLLECTION = 'leads';
const LEADS_KEY = '@expoindustrial:leads';

const MOCK_LEADS: SavedLead[] = [
  {
    id: 'l-1',
    name: 'Amanda Costa',
    role: 'Gerente de Supply Chain',
    company: 'WEG Automação',
    source: 'Rodada de Negócios PPCP',
    email: 'amanda.costa@weg.net',
    phone: '(47) 98888-1111',
  },
  {
    id: 'l-2',
    name: 'Roberto Oliveira',
    role: 'VP de Sustentabilidade',
    company: 'Bosch Brasil',
    source: 'Palestra ESG na Prática',
    email: 'roberto.oliveira@br.bosch.com',
    phone: '(11) 97777-2222',
  },
  {
    id: 'l-3',
    name: 'Marcos Silva',
    role: 'Diretor de P&D',
    company: 'Siemens Digital Industries',
    source: 'Matchmaking por IA',
    email: 'marcos.silva@siemens.com',
    phone: '(11) 96666-3333',
  },
];

/** `true` quando dá pra usar o Firestore: configurado e com usuário logado. */
function canUseFirestore(): boolean {
  return isFirebaseConfigured && Boolean(db) && Boolean(auth?.currentUser);
}

function fromDoc(snap: QueryDocumentSnapshot): SavedLead {
  const data = snap.data();
  return {
    id: snap.id,
    name: (data.name as string) ?? '',
    role: (data.role as string) ?? '',
    company: (data.company as string) ?? '',
    source: (data.source as string) ?? '',
    email: (data.email as string) ?? '',
    ownerUid: data.ownerUid as string | undefined,
    phone: data.phone as string | undefined,
    exhibitorId: data.exhibitorId as string | undefined,
    exhibitorName: data.exhibitorName as string | undefined,
    stand: data.stand as string | undefined,
    createdAt: typeof data.createdAt === 'number' ? data.createdAt : undefined,
  };
}

/** Mais recentes primeiro; leads sem `createdAt` (legados) vão pro fim. */
function byNewest(a: SavedLead, b: SavedLead): number {
  return (b.createdAt ?? 0) - (a.createdAt ?? 0);
}

/**
 * Chave de deduplicação do contato: e-mail, senão telefone, senão nome+empresa.
 * Vazia quando o crachá não trouxe nada identificável — aí não dá pra deduplicar
 * e cada leitura vira um contato novo.
 */
function leadDedupKey(lead: Pick<SavedLead, 'name' | 'company' | 'email' | 'phone'>): string {
  const email = lead.email?.trim().toLowerCase();
  if (email) return `email:${email}`;

  const phone = lead.phone?.replace(/\D/g, '');
  if (phone) return `phone:${phone}`;

  const name = lead.name?.trim().toLowerCase().replace(/\s+/g, ' ');
  if (name) return `name:${name}|${lead.company?.trim().toLowerCase() ?? ''}`;

  return '';
}

/**
 * Id determinístico do doc de lead: `<uid do captador>_<sha256 da chave>`.
 * Com ele a deduplicação vira uma propriedade do id — a captura é 1 escrita
 * (`setDoc` com merge), sem baixar o acervo de leads a cada crachá lido. O uid
 * entra no id porque dois expositores que leem o mesmo visitante precisam de
 * documentos separados. Retorna `null` quando não há como deduplicar.
 */
function leadDocId(uid: string, lead: Pick<SavedLead, 'name' | 'company' | 'email' | 'phone'>): string | null {
  const key = leadDedupKey(lead);
  return key ? `${uid}_${sha256Hex(key)}` : null;
}

// ─── Armazenamento local (modo demo / sem login) ──────────────────────────────

async function getLocalLeads(): Promise<SavedLead[]> {
  try {
    const raw = await AsyncStorage.getItem(LEADS_KEY);
    if (!raw) {
      await AsyncStorage.setItem(LEADS_KEY, JSON.stringify(MOCK_LEADS));
      return MOCK_LEADS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Erro ao ler leads locais:', err);
    return MOCK_LEADS;
  }
}

async function addLocalLead(lead: Omit<SavedLead, 'id' | 'createdAt'>): Promise<SavedLead> {
  const leads = await getLocalLeads();
  const key = leadDedupKey(lead);
  const existing = key ? leads.find((l) => leadDedupKey(l) === key) : undefined;

  // Espelha o upsert do Firestore: relê o mesmo crachá atualiza o contato.
  const upserted: SavedLead = {
    ...lead,
    id: existing?.id ?? `l-${Date.now()}`,
    createdAt: Date.now(),
  };
  const rest = existing ? leads.filter((l) => l.id !== existing.id) : leads;
  await AsyncStorage.setItem(LEADS_KEY, JSON.stringify([upserted, ...rest]));
  return upserted;
}

// ─── API pública ──────────────────────────────────────────────────────────────

/** Lê os leads uma vez (Firestore quando logado, senão local). */
export async function getSavedLeads(): Promise<SavedLead[]> {
  if (!canUseFirestore()) return getLocalLeads();

  const uid = auth!.currentUser!.uid;
  // Só filtro de igualdade por `ownerUid` (índice de campo único, automático);
  // a ordenação é feita no cliente para não exigir índice composto.
  const snap = await getDocs(query(collection(db!, LEADS_COLLECTION), where('ownerUid', '==', uid)));
  return snap.docs.map(fromDoc).sort(byNewest);
}

/**
 * Captura um lead, deduplicando dentro do mesmo dono (ver `leadDocId`).
 *
 * É uma única escrita: o id do doc já carrega a deduplicação, então não há
 * leitura prévia da coleção — o que mantinha a câmera do leitor de crachá lenta
 * e gastava centenas de leituras por bip num estande com muitos leads. Reler o
 * mesmo crachá atualiza o contato (o visitante pode ter corrigido o perfil) e
 * renova `createdAt` para a captação mais recente, em vez de ser ignorado.
 */
export async function addSavedLead(lead: Omit<SavedLead, 'id' | 'createdAt'>): Promise<SavedLead> {
  if (!canUseFirestore()) return addLocalLead(lead);

  const uid = auth!.currentUser!.uid;
  const createdAt = Date.now();
  const payload = { ...lead, ownerUid: uid, createdAt };

  const id = leadDocId(uid, lead);
  if (!id) {
    // Crachá sem e-mail, telefone nem nome: sem chave de deduplicação possível.
    const created = await addDoc(collection(db!, LEADS_COLLECTION), payload);
    return { ...payload, id: created.id };
  }

  await setDoc(doc(db!, LEADS_COLLECTION, id), payload, { merge: true });
  return { ...payload, id };
}

/** Remove um lead do dono logado (no Firestore) ou do armazenamento local. */
export async function removeSavedLead(id: string): Promise<void> {
  if (!canUseFirestore()) {
    const leads = await getLocalLeads();
    await AsyncStorage.setItem(LEADS_KEY, JSON.stringify(leads.filter((l) => l.id !== id)));
    return;
  }
  await deleteDoc(doc(db!, LEADS_COLLECTION, id));
}

/**
 * Assina os leads do usuário logado em tempo real (Firestore). Em modo
 * demo/local lê uma vez do AsyncStorage. Use no perfil para refletir capturas
 * recém-feitas sem precisar recarregar a tela.
 */
export function useSavedLeads(): { leads: SavedLead[]; loading: boolean } {
  const [leads, setLeads] = useState<SavedLead[]>([]);
  const [loading, setLoading] = useState(true);

  const uid = auth?.currentUser?.uid;

  useEffect(() => {
    if (!isFirebaseConfigured || !db || !uid) {
      let active = true;
      getLocalLeads().then((l) => {
        if (active) {
          setLeads(l);
          setLoading(false);
        }
      });
      return () => {
        active = false;
      };
    }

    const q = query(collection(db, LEADS_COLLECTION), where('ownerUid', '==', uid));
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setLeads(snap.docs.map(fromDoc).sort(byNewest));
        setLoading(false);
      },
      (err) => {
        console.error('Erro ao assinar leads:', err);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [uid]);

  return { leads, loading };
}

/**
 * Assina todos os leads em tempo real para o organizador/admin. As rules só
 * liberam essa leitura quando o usuário atual existe em `admins/{uid}`.
 */
export function useAllLeads(enabled: boolean): { leads: SavedLead[]; loading: boolean } {
  const [leads, setLeads] = useState<SavedLead[]>([]);
  const [loading, setLoading] = useState(enabled);

  useEffect(() => {
    if (!enabled || !isFirebaseConfigured || !db) {
      let active = true;
      queueMicrotask(() => {
        if (!active) return;
        setLeads([]);
        setLoading(false);
      });
      return () => {
        active = false;
      };
    }

    const unsubscribe = onSnapshot(
      collection(db, LEADS_COLLECTION),
      (snap) => {
        setLeads(snap.docs.map(fromDoc).sort(byNewest));
        setLoading(false);
      },
      (err) => {
        console.error('Erro ao assinar todos os leads:', err);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [enabled]);

  return { leads, loading };
}

// ─── Ações sobre um lead (mensagem / exportar) ────────────────────────────────

/**
 * Canal de mensagem para o contato: WhatsApp quando há telefone (assume DDI 55
 * se não vier), senão e-mail. Use com `Linking.openURL`.
 */
export function leadMessageUrl(lead: SavedLead): string {
  if (lead.phone) {
    const digits = lead.phone.replace(/\D/g, '');
    const intl = digits.startsWith('55') ? digits : `55${digits}`;
    return `https://wa.me/${intl}`;
  }
  return `mailto:${lead.email}`;
}

/** Escapa os caracteres especiais do vCard (vírgula, ponto-e-vírgula, barra). */
function escapeVCard(value: string): string {
  return value.replace(/([,;\\])/g, '\\$1');
}

function buildVCard(lead: SavedLead): string {
  return [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${escapeVCard(lead.name)}`,
    lead.company ? `ORG:${escapeVCard(lead.company)}` : '',
    lead.role ? `TITLE:${escapeVCard(lead.role)}` : '',
    lead.email ? `EMAIL;TYPE=WORK:${lead.email}` : '',
    lead.phone ? `TEL;TYPE=CELL:${lead.phone}` : '',
    lead.source ? `NOTE:${escapeVCard(`Captado em: ${lead.source}`)}` : '',
    'END:VCARD',
  ]
    .filter(Boolean)
    .join('\r\n');
}

/**
 * Gera um arquivo `.vcf` (vCard 3.0) do contato e abre o menu de
 * compartilhamento do sistema — daí o usuário salva nos Contatos ou envia ao
 * CRM. Lança erro se o compartilhamento não estiver disponível (ex.: web).
 */
export async function exportLeadVCard(lead: SavedLead): Promise<void> {
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Compartilhamento indisponível neste dispositivo.');
  }
  const slug = (lead.name || 'contato').normalize('NFD').replace(/[^a-z0-9]+/gi, '-').toLowerCase();
  const file = new File(Paths.cache, `${slug || 'contato'}.vcf`);
  if (file.exists) file.delete();
  file.create();
  file.write(buildVCard(lead));
  await Sharing.shareAsync(file.uri, {
    mimeType: 'text/vcard',
    UTI: 'public.vcard',
    dialogTitle: `Exportar ${lead.name}`,
  });
}

function escapeCsv(value: unknown): string {
  const text = String(value ?? '');
  return `"${text.replace(/"/g, '""')}"`;
}

function formatCsvDate(value?: number): string {
  if (!value) return '';
  return new Date(value).toLocaleString('pt-BR');
}

function buildLeadsCsv(leads: SavedLead[]): string {
  const header = [
    'Nome',
    'Cargo',
    'Empresa',
    'Email',
    'Telefone',
    'Origem',
    'Expositor',
    'Estande',
    'UID do captador',
    'Data de captacao',
  ];
  const rows = leads.map((lead) => [
    lead.name,
    lead.role,
    lead.company,
    lead.email,
    lead.phone ?? '',
    lead.source,
    lead.exhibitorName ?? '',
    lead.stand ?? '',
    lead.ownerUid ?? '',
    formatCsvDate(lead.createdAt),
  ]);
  return [header, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\r\n');
}

function csvFilename(prefix: string) {
  const stamp = new Date().toISOString().slice(0, 10);
  return `${prefix}-${stamp}.csv`;
}

/**
 * Exporta a lista detalhada em CSV. No web baixa o arquivo diretamente; no app
 * nativo abre o compartilhamento do sistema.
 */
export async function exportLeadsCsv(leads: SavedLead[], filenamePrefix = 'leads'): Promise<void> {
  const filename = csvFilename(filenamePrefix);
  const csv = `\uFEFF${buildLeadsCsv(leads)}`;

  if (typeof document !== 'undefined' && typeof URL !== 'undefined' && typeof Blob !== 'undefined') {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    return;
  }

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Compartilhamento indisponível neste dispositivo.');
  }

  const file = new File(Paths.cache, filename);
  if (file.exists) file.delete();
  file.create();
  file.write(csv);
  await Sharing.shareAsync(file.uri, {
    mimeType: 'text/csv',
    UTI: 'public.comma-separated-values-text',
    dialogTitle: 'Exportar leads em CSV',
  });
}
