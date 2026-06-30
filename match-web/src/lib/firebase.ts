/**
 * Inicialização do Firebase (SDK JS modular) para o painel do organizador.
 *
 * Mesmo projeto do ExpoIndustrialApp (`movie-app-ddda3`) — as coleções são
 * compartilhadas. As chaves "web" não são segredos; a segurança vem das
 * Security Rules do Firestore. No Next.js o prefixo público é `NEXT_PUBLIC_*`.
 */
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { initializeFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/** `true` quando as chaves foram preenchidas no `.env.local`. */
export const isFirebaseConfigured = Boolean(firebaseConfig.projectId && firebaseConfig.apiKey);

// `getApps()` guard evita reinicializar no Fast Refresh do Next.
const app = isFirebaseConfigured
  ? getApps().length
    ? getApp()
    : initializeApp(firebaseConfig)
  : null;

export const auth: Auth | null = app ? getAuth(app) : null;

// `initializeFirestore` com auto-detecção de long-polling: o WebChannel padrão
// falha em algumas redes corporativas/proxies (e em Chrome headless), então
// deixamos o SDK cair para long-polling automaticamente quando necessário.
export const db: Firestore | null = app
  ? initializeFirestore(app, { experimentalAutoDetectLongPolling: true })
  : null;

export const storage: FirebaseStorage | null = app ? getStorage(app) : null;
