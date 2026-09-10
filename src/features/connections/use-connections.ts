import { useEffect, useState } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
  setDoc,
  updateDoc,
} from 'firebase/firestore';

import { auth, db, isFirebaseConfigured } from '@/lib/firebase';
import {
  type VisitorProfile,
  DEMO_VISITOR_PROFILE,
  VISITOR_CONTACT_CARDS_COLLECTION,
  visitorProfileFromData,
} from '@/features/visitor/visitor-profile';
import { type Connection, connectionConverter } from './connection';

const VISITORS_COLLECTION = 'visitors';
const CONNECTIONS_COLLECTION = 'connections';

export type DiscoverableVisitor = {
  uid: string;
  profile: VisitorProfile;
};

export type SharedVisitorContact = Pick<VisitorProfile, 'email' | 'phone' | 'linkedin' | 'website'>;

/** Conexões fake do modo demo (sem Firebase / sem login): dado estático. */
const DEMO_CONNECTIONS: Connection[] = [
  {
    id: 'demo-user_demo-visitor-2',
    fromUid: 'demo-user',
    toUid: 'demo-visitor-2',
    status: 'pending',
    createdAt: new Date(),
    fromName: 'Victor Almeida',
    toName: 'Ana Silva',
  },
];

/** Visitantes fake do modo demo (sem Firebase): dado estático, não estado. */
const DEMO_DISCOVERABLE_VISITORS: DiscoverableVisitor[] = [
  {
    uid: 'demo-visitor-2',
    profile: {
      ...DEMO_VISITOR_PROFILE,
      name: 'Ana Silva',
      role: 'Gerente de PPCP',
      company: 'Tech Componentes',
      marketRole: 'Fornecedor',
      objectives: ['Gerar leads', 'Networking'],
      interests: ['Robótica Industrial', 'S&OP / S&OE / IBP', 'IoT Industrial'],
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
];

export function useDiscoverableVisitors() {
  const uid = auth?.currentUser?.uid;
  const canSubscribe = isFirebaseConfigured && Boolean(db);

  const [state, setState] = useState<{
    visitors: DiscoverableVisitor[];
    loading: boolean;
    error: Error | null;
  }>({ visitors: [], loading: true, error: null });

  useEffect(() => {
    if (!canSubscribe || !db) return;

    const q = query(collection(db, VISITORS_COLLECTION), where('discoverable', '==', true));
    return onSnapshot(
      q,
      (snap) => {
        const list: DiscoverableVisitor[] = [];
        snap.forEach((doc) => {
          if (doc.id !== uid) {
            list.push({ uid: doc.id, profile: visitorProfileFromData(doc.data()) });
          }
        });
        setState({ visitors: list, loading: false, error: null });
      },
      (err) => {
        console.error('Error fetching discoverable visitors:', err);
        setState({ visitors: [], loading: false, error: err });
      },
    );
  }, [canSubscribe, uid]);

  // Modo demo é derivado, não empurrado por efeito: sem Firebase o retorno já
  // sai pronto no primeiro render, sem o setState em cascata.
  if (!canSubscribe) return { visitors: DEMO_DISCOVERABLE_VISITORS, loading: false, error: null };
  return state;
}

/**
 * Assina somente os cartões de contatos de conexões aceitas. As Security Rules
 * fazem a autorização real; a lista de UIDs serve apenas para limitar leituras.
 */
export function useSharedVisitorContacts(visitorUids: string[]) {
  const uid = auth?.currentUser?.uid;
  const idsKey = [...new Set(visitorUids)].sort().join('|');
  const [state, setState] = useState<{
    key: string;
    contacts: Record<string, SharedVisitorContact>;
  }>({ key: '', contacts: {} });

  useEffect(() => {
    if (!isFirebaseConfigured || !db || !uid || !idsKey) return;
    const ids = idsKey.split('|');
    const removeContact = (visitorUid: string) => {
      setState((previous) => {
        if (previous.key !== idsKey) return { key: idsKey, contacts: {} };
        const contacts = { ...previous.contacts };
        delete contacts[visitorUid];
        return { key: idsKey, contacts };
      });
    };
    const unsubscribers = ids.map((visitorUid) =>
      onSnapshot(
        doc(db!, VISITOR_CONTACT_CARDS_COLLECTION, visitorUid),
        (snap) => {
          if (!snap.exists()) {
            removeContact(visitorUid);
            return;
          }
          setState((previous) => ({
            key: idsKey,
            contacts: {
              ...(previous.key === idsKey ? previous.contacts : {}),
              [visitorUid]: snap.data() as SharedVisitorContact,
            },
          }));
        },
        // Ausência de consentimento resulta em permission-denied e deve ser
        // exibida como contato fechado, não como falha da tela de networking.
        () => removeContact(visitorUid),
      ),
    );

    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, [idsKey, uid]);

  return state.key === idsKey ? state.contacts : {};
}

export function useConnections() {
  const uid = auth?.currentUser?.uid;
  const canSubscribe = isFirebaseConfigured && Boolean(db) && Boolean(uid);

  // O uid acompanha o dado: ao trocar de conta o retorno volta a `loading` em
  // vez de mostrar por um instante as conexões da conta anterior.
  const [state, setState] = useState<{
    uid?: string;
    connections: Connection[];
    error: Error | null;
  }>({ connections: [], error: null });

  const setConnections = (connections: Connection[]) =>
    setState((prev) => ({ ...prev, uid, connections }));
  // Carimba o uid também no erro: uma falha de permissão encerra o `loading`
  // em vez de deixar a tela girando pra sempre.
  const setError = (error: Error) => setState((prev) => ({ ...prev, uid, error }));

  useEffect(() => {
    if (!canSubscribe || !db || !uid) return;

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
  }, [canSubscribe, uid]);

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

  // Modo demo derivado, não empurrado por efeito; e enquanto o snapshot da conta
  // atual não chega, a lista fica vazia em vez de repetir a da conta anterior.
  const connections = !canSubscribe
    ? DEMO_CONNECTIONS
    : state.uid === uid
      ? state.connections
      : [];
  const loading = canSubscribe && state.uid !== uid;
  const error = canSubscribe ? state.error : null;

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
