import { useEffect, useState } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
} from 'firebase/firestore';

import { auth, db, isFirebaseConfigured } from '@/lib/firebase';
import { type VisitorProfile, DEMO_VISITOR_PROFILE } from '@/features/visitor/visitor-profile';
import { type Connection, connectionConverter } from './connection';

const VISITORS_COLLECTION = 'visitors';
const CONNECTIONS_COLLECTION = 'connections';

export type DiscoverableVisitor = {
  uid: string;
  profile: VisitorProfile;
};

export function useDiscoverableVisitors() {
  const [visitors, setVisitors] = useState<DiscoverableVisitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const uid = auth?.currentUser?.uid;

  useEffect(() => {
    if (!isFirebaseConfigured || !db) {
      // No modo demo, retornamos um visitante demo fake
      setVisitors([
        {
          uid: 'demo-visitor-2',
          profile: {
            ...DEMO_VISITOR_PROFILE,
            name: 'Ana Silva',
            role: 'Gerente de PPCP',
            company: 'Tech Componentes',
            marketRole: 'Fornecedor',
            objectives: ['Vender/gerar leads', 'Networking'],
            interests: ['Robótica', 'S&OP', 'IoT'],
            lookingFor: 'Parcerias com montadoras de painéis',
            offering: 'CLPs importados e sensores industriais de alta precisão',
            phone: '(47) 99999-2222',
            email: 'ana.silva@techcomponentes.com.br',
            linkedin: 'https://linkedin.com',
            discoverable: true,
            shareContact: true,
          },
        },
        {
          uid: 'demo-visitor-3',
          profile: {
            ...DEMO_VISITOR_PROFILE,
            name: 'Carlos Santos',
            role: 'Supervisor de Manutenção',
            company: 'Fábrica Sul',
            marketRole: 'Comprador',
            objectives: ['Encontrar fornecedores', 'Tendências'],
            interests: ['Manutenção', 'IoT', 'Energia'],
            lookingFor: 'Soluções de monitoramento de vibração preditiva',
            offering: 'Indicação de serviços de calibração metal-mecânica',
            phone: '(47) 97777-3333',
            email: 'carlos@fabricasul.com.br',
            linkedin: 'https://linkedin.com',
            discoverable: true,
            shareContact: true,
          },
        },
      ]);
      setLoading(false);
      return;
    }

    const q = query(collection(db, VISITORS_COLLECTION), where('discoverable', '==', true));
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const list: DiscoverableVisitor[] = [];
        snap.forEach((doc) => {
          if (doc.id !== uid) {
            list.push({
              uid: doc.id,
              profile: doc.data() as VisitorProfile,
            });
          }
        });
        setVisitors(list);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching discoverable visitors:', err);
        setError(err);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [uid]);

  return { visitors, loading, error };
}

export function useConnections() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const uid = auth?.currentUser?.uid;

  useEffect(() => {
    if (!isFirebaseConfigured || !db || !uid) {
      // Modo demo - conexões de teste
      setConnections([
        {
          id: 'demo-user_demo-visitor-2',
          fromUid: 'demo-user',
          toUid: 'demo-visitor-2',
          status: 'pending',
          createdAt: new Date(),
          fromName: 'Victor Almeida',
          toName: 'Ana Silva',
        },
      ]);
      setLoading(false);
      return;
    }

    // Como o Firestore não suporta OR composto de forma simples nas subscrições,
    // assinamos duas queries: conexões enviadas (fromUid == uid) e recebidas (toUid == uid)
    const qSent = query(
      collection(db, CONNECTIONS_COLLECTION).withConverter(connectionConverter),
      where('fromUid', '==', uid)
    );
    const qReceived = query(
      collection(db, CONNECTIONS_COLLECTION).withConverter(connectionConverter),
      where('toUid', '==', uid)
    );

    let sentList: Connection[] = [];
    let receivedList: Connection[] = [];

    const updateState = () => {
      // Combinar as duas listas sem duplicatas (pelo id do documento)
      const merged = [...sentList];
      receivedList.forEach((r) => {
        if (!merged.some((m) => m.id === r.id)) {
          merged.push(r);
        }
      });
      setConnections(merged);
      setLoading(false);
    };

    const unsubSent = onSnapshot(
      qSent,
      (snap) => {
        sentList = snap.docs.map((doc) => doc.data());
        updateState();
      },
      (err) => {
        console.error('Error fetching sent connections:', err);
        setError(err);
      }
    );

    const unsubReceived = onSnapshot(
      qReceived,
      (snap) => {
        receivedList = snap.docs.map((doc) => doc.data());
        updateState();
      },
      (err) => {
        console.error('Error fetching received connections:', err);
        setError(err);
      }
    );

    return () => {
      unsubSent();
      unsubReceived();
    };
  }, [uid]);

  // Ações de conexão
  const requestConnection = async (toUid: string, toName: string, fromName: string) => {
    if (!db || !uid) return;
    // Chave única para evitar duplicidades
    const docId = `${uid}_${toUid}`;
    const ref = doc(db, CONNECTIONS_COLLECTION, docId).withConverter(connectionConverter);
    await setDoc(ref, {
      id: docId,
      fromUid: uid,
      toUid,
      status: 'pending',
      createdAt: new Date(),
      fromName,
      toName,
    });
  };

  const acceptConnection = async (connectionId: string) => {
    if (!db) return;
    const ref = doc(db, CONNECTIONS_COLLECTION, connectionId);
    await updateDoc(ref, { status: 'accepted' });
  };

  const declineConnection = async (connectionId: string) => {
    if (!db) return;
    const ref = doc(db, CONNECTIONS_COLLECTION, connectionId);
    await updateDoc(ref, { status: 'declined' });
  };

  const pendingReceived = connections.filter((c) => c.toUid === uid && c.status === 'pending');
  const pendingSent = connections.filter((c) => c.fromUid === uid && c.status === 'pending');
  const accepted = connections.filter((c) => c.status === 'accepted');

  return {
    connections,
    pendingReceived,
    pendingSent,
    accepted,
    loading,
    error,
    requestConnection,
    acceptConnection,
    declineConnection,
  };
}
