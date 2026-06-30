import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getFirestore, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const ACCOUNTS = {
  admin: {
    email: 'admin@expoindustrialsul.com',
    password: 'AdminExpo2026!',
    name: 'André Bastos (Diretor)',
    role: 'admin',
  },
  exhibitor: {
    email: 'expositor@expoindustrialsul.com',
    password: 'ExpositorExpo2026!',
    name: 'Expositor Teste (Metalúrgica Sul)',
    role: 'exhibitor',
    boothId: 'premium-86',
  },
  visitor: {
    email: 'visitante@expoindustrialsul.com',
    password: 'VisitanteExpo2026!',
    name: 'Visitante Teste',
    role: 'visitor',
  },
};

async function ensureUser(email: string, pass: string) {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    return cred.user.uid;
  } catch (err: any) {
    if (err.code === 'auth/email-already-in-use') {
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      return cred.user.uid;
    }
    throw err;
  }
}

async function run() {
  console.log('--- Criando contas de teste ---');

  // 1. Criar conta do Admin
  const adminUid = await ensureUser(ACCOUNTS.admin.email, ACCOUNTS.admin.password);
  await setDoc(doc(db, 'admins', adminUid), {
    name: ACCOUNTS.admin.name,
    email: ACCOUNTS.admin.email,
    createdAt: new Date().toISOString(),
  });
  console.log(`✓ Conta Admin criada/verificada: ${ACCOUNTS.admin.email} (UID: ${adminUid})`);

  // 2. Criar conta do Expositor
  const exhibitorUid = await ensureUser(ACCOUNTS.exhibitor.email, ACCOUNTS.exhibitor.password);
  await setDoc(doc(db, 'exhibitors', ACCOUNTS.exhibitor.boothId), {
    ownerUid: exhibitorUid,
    company: 'Metalúrgica Sul',
    stand: '86',
    area: '50 m²',
    category: 'premium',
    industry: 'Metalurgia e Usinagem',
    about: 'Líder em fundição sob pressão e componentes usinados de alta precisão para a indústria automobilística.',
    products: ['Blocos de Motor', 'Engrenagens Cônicas', 'Eixos de Transmissão'],
    fit: 94,
    point: { x: 520, y: 550 },
    logo: 'MS',
  }, { merge: true });
  console.log(`✓ Conta Expositor criada/verificada: ${ACCOUNTS.exhibitor.email} (Viculado ao Estande 86)`);

  // 3. Criar conta do Visitante
  const visitorUid = await ensureUser(ACCOUNTS.visitor.email, ACCOUNTS.visitor.password);
  await setDoc(doc(db, 'visitors', visitorUid), {
    name: ACCOUNTS.visitor.name,
    role: 'Diretor de Operações',
    company: 'Indústria Metalúrgica Catarinense',
    phone: '47988888888',
    email: ACCOUNTS.visitor.email,
    roleType: 'Decisor',
    sector: ['Metalurgia', 'Automação'],
    marketRole: 'Comprador',
    objectives: ['Encontrar novos fornecedores', 'Parcerias estratégicas'],
    interests: ['Usinagem', 'IoT'],
    budget: 'Acima de R$ 100k',
    discoverable: true,
    shareContact: true,
    onboardingCompleted: true,
    onboardingSkipped: false,
  });
  console.log(`✓ Conta Visitante criada/verificada: ${ACCOUNTS.visitor.email}`);

  console.log('--- Concluído com sucesso! ---');
  process.exit(0);
}

run().catch((err) => {
  console.error('Erro na criação de contas:', err);
  process.exit(1);
});
