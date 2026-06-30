import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
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

const EMAIL = 'apple.review@expoindustrialsul.com';
const PASSWORD = 'AppleReview2026!';

async function createReviewer() {
  console.log(`Criando conta do revisor Apple: ${EMAIL}...`);
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, EMAIL, PASSWORD);
    const uid = userCredential.user.uid;

    await setDoc(doc(db, 'visitors', uid), {
      name: 'Apple Reviewer',
      role: 'Reviewer',
      company: 'Apple Inc.',
      phone: '47999999999',
      email: EMAIL,
      roleType: 'Decisor',
      sector: ['Automação'],
      marketRole: 'Comprador',
      objectives: ['Encontrar novos fornecedores'],
      interests: ['IoT'],
      budget: 'Até R$ 50k',
      discoverable: true,
      shareContact: true,
      onboardingCompleted: true,
      onboardingSkipped: false,
    });

    console.log('Conta do revisor Apple e perfil no Firestore criados com sucesso!');
  } catch (err: any) {
    if (err.code === 'auth/email-already-in-use') {
      console.log('A conta do revisor já existe.');
    } else {
      throw err;
    }
  }
}

createReviewer().catch(console.error);
