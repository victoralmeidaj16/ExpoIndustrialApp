export const PAID_EVENTS_COLLECTION = 'paidEvents';

export type PaidEvent = {
  id: string;
  title: string;
  description: string;
  dateLabel: string;
  location: string;
  higestorEventId: string;
  paymentUrl: string;
  order: number;
  createdAt: number;
  updatedAt: number;
};

export type PaidEventFormData = Omit<PaidEvent, 'id' | 'createdAt' | 'updatedAt'>;

export const EMPTY_PAID_EVENT_FORM: PaidEventFormData = {
  title: '',
  description: '',
  dateLabel: '',
  location: '',
  higestorEventId: '',
  paymentUrl: '',
  order: 0,
};

export function paidEventFromDoc(id: string, data: Record<string, unknown>): PaidEvent {
  return {
    id,
    title: (data.title as string) ?? '',
    description: (data.description as string) ?? '',
    dateLabel: (data.dateLabel as string) ?? '',
    location: (data.location as string) ?? '',
    higestorEventId: (data.higestorEventId as string) ?? '',
    paymentUrl: (data.paymentUrl as string) ?? '',
    order: typeof data.order === 'number' ? data.order : 0,
    createdAt: typeof data.createdAt === 'number' ? data.createdAt : 0,
    updatedAt: typeof data.updatedAt === 'number' ? data.updatedAt : 0,
  };
}
