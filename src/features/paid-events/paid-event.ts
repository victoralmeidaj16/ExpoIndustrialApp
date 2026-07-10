export const PAID_EVENTS_COLLECTION = 'paidEvents';

export type PaidEvent = {
  id: string;
  title: string;
  description: string;
  dateLabel: string;
  location: string;
  higestorEventId?: string;
  paymentUrl?: string;
  order: number;
  createdAt: number;
};

export type PaidEventAccess = {
  status: 'paid' | 'pending' | 'cancelled';
  userEmailLower: string;
  fullName: string;
  cpfLast4?: string;
  source: 'higestor' | 'sympla' | 'manual';
  syncedAt: number;
};

export type PaidEventMaterial = {
  id: string;
  title: string;
  description: string;
  fileUrl: string;
  fileName: string;
  contentType: string;
  order: number;
  createdAt: number;
};

export function normalizeAccessEmail(email: string | null | undefined): string {
  return (email ?? '').trim().toLowerCase();
}
