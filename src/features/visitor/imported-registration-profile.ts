import { collection, doc, getDoc, getDocs } from 'firebase/firestore';

import { getSymplaPaidEventId, OFFICIAL_PAID_EVENTS } from '@/features/paid-events/paid-event';
import { auth, db } from '@/lib/firebase';

export type ImportedRegistrationProfile = {
  name: string;
  phone: string;
  company: string;
  role: string;
  source: 'sympla' | 'higestor' | 'manual' | '';
};

type RegistrationData = Record<string, unknown>;

const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

/** Junta inscrições do mesmo e-mail sem trocar um dado preenchido por outro vazio. */
export function mergeImportedRegistrations(rows: RegistrationData[]): ImportedRegistrationProfile {
  const result: ImportedRegistrationProfile = {
    name: '',
    phone: '',
    company: '',
    role: '',
    source: '',
  };

  // Dados mais recentes e cadastros Sympla tendem a ter o formulário profissional
  // mais completo. Ainda assim, qualquer lacuna pode ser preenchida pelo R Gestor.
  const ordered = [...rows].sort((left, right) => {
    const sourceScore = (row: RegistrationData) => (text(row.source) === 'sympla' ? 1 : 0);
    return sourceScore(right) - sourceScore(left)
      || Number(right.syncedAt ?? 0) - Number(left.syncedAt ?? 0);
  });

  for (const row of ordered) {
    result.name ||= text(row.fullName) || text(row.name);
    result.phone ||= text(row.phone);
    result.company ||= text(row.company);
    result.role ||= text(row.role) || text(row.jobRole);
    if (!result.source) {
      const source = text(row.source);
      if (source === 'sympla' || source === 'higestor' || source === 'manual') {
        result.source = source;
      }
    }
  }

  return result;
}

/**
 * Procura inscrições somente depois do login e somente para o e-mail da conta.
 * As regras do Firestore impedem consultar o cadastro de outra pessoa.
 */
export async function getImportedRegistrationProfile(): Promise<ImportedRegistrationProfile | null> {
  const currentEmail = auth?.currentUser?.email?.trim().toLowerCase();
  if (!db || !currentEmail) return null;
  const firestore = db;

  const eventsSnap = await getDocs(collection(firestore, 'paidEvents'));
  const eventIds = new Set([
    getSymplaPaidEventId(),
    ...OFFICIAL_PAID_EVENTS.map((event) => event.id),
    ...eventsSnap.docs.map((event) => event.id),
  ]);
  const snapshots = await Promise.all(
    [...eventIds].map((eventId) =>
      getDoc(doc(firestore, 'paidEvents', eventId, 'attendees', currentEmail)),
    ),
  );
  const rows = snapshots.filter((snap) => snap.exists()).map((snap) => snap.data());
  if (!rows.length) return null;

  return mergeImportedRegistrations(rows);
}
