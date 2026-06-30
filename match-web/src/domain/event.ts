/**
 * Domínio "Configuração do evento" — coleção `event`, doc único `config`.
 * NOVO no ecossistema (regra de leitura pública / escrita admin a publicar).
 */
import {
  type FirestoreDataConverter,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';

export const EVENT_COLLECTION = 'event';
export const EVENT_CONFIG_ID = 'config';

export type EventConfig = {
  name: string;
  tagline: string;
  dateLabel: string;
  startDate: string;
  endDate: string;
  venueName: string;
  venueAddress: string;
};

export function emptyEventConfig(): EventConfig {
  return {
    name: '',
    tagline: '',
    dateLabel: '',
    startDate: '',
    endDate: '',
    venueName: '',
    venueAddress: '',
  };
}

export const eventConfigConverter: FirestoreDataConverter<EventConfig> = {
  toFirestore(config: EventConfig) {
    return { ...config };
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): EventConfig {
    const data = snapshot.data();
    return {
      name: data.name ?? '',
      tagline: data.tagline ?? '',
      dateLabel: data.dateLabel ?? '',
      startDate: data.startDate ?? '',
      endDate: data.endDate ?? '',
      venueName: data.venueName ?? '',
      venueAddress: data.venueAddress ?? '',
    };
  },
};
