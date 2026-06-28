import { DocumentData, FirestoreDataConverter, QueryDocumentSnapshot } from 'firebase/firestore';

export type ConnectionStatus = 'pending' | 'accepted' | 'declined';

export type Connection = {
  id: string;
  fromUid: string;
  toUid: string;
  status: ConnectionStatus;
  createdAt: Date;
  fromName?: string;
  toName?: string;
};

export const connectionConverter: FirestoreDataConverter<Connection> = {
  toFirestore(conn) {
    return {
      fromUid: conn.fromUid,
      toUid: conn.toUid,
      status: conn.status,
      createdAt: conn.createdAt,
      fromName: conn.fromName ?? '',
      toName: conn.toName ?? '',
    };
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options) {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      fromUid: data.fromUid ?? '',
      toUid: data.toUid ?? '',
      status: (data.status as ConnectionStatus) ?? 'pending',
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
      fromName: data.fromName ?? '',
      toName: data.toName ?? '',
    };
  },
};
