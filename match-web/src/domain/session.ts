/**
 * Domínio "Sessão" (agenda) — espelha
 * `ExpoIndustrialApp/src/features/agenda/session.ts`.
 */
import {
  type FirestoreDataConverter,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';

export const SESSIONS_COLLECTION = 'sessions';

export type SessionTrack = 'Automação' | 'PPCP' | 'S&OP' | 'ESG' | 'Manutenção';

export const TRACKS: SessionTrack[] = ['Automação', 'PPCP', 'S&OP', 'ESG', 'Manutenção'];

export type Session = {
  id: string;
  title: string;
  speaker: string;
  role: string;
  company: string;
  time: string;
  location: string;
  track: SessionTrack;
  day: number;
  dateLabel: string;
  description: string;
  capacity: number;
  registeredCount: number;
};

export const sessionConverter: FirestoreDataConverter<Session> = {
  toFirestore(session: Session) {
    const { id: _omit, ...data } = session;
    return data;
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): Session {
    const data = snapshot.data();
    return {
      id: snapshot.id,
      title: data.title ?? '',
      speaker: data.speaker ?? '',
      role: data.role ?? '',
      company: data.company ?? '',
      time: data.time ?? '',
      location: data.location ?? '',
      track: (data.track as SessionTrack) ?? 'Automação',
      day: typeof data.day === 'number' ? data.day : 1,
      dateLabel: data.dateLabel ?? '',
      description: data.description ?? '',
      capacity: typeof data.capacity === 'number' ? data.capacity : 0,
      registeredCount: typeof data.registeredCount === 'number' ? data.registeredCount : 0,
    };
  },
};

/** Estado em branco para o formulário de criação. */
export function emptySession(): Omit<Session, 'id'> {
  return {
    title: '',
    speaker: '',
    role: '',
    company: '',
    time: '',
    location: '',
    track: 'Automação',
    day: 1,
    dateLabel: '',
    description: '',
    capacity: 0,
    registeredCount: 0,
  };
}
