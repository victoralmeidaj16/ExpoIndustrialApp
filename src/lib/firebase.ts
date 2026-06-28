/**
 * Inicialização do Firebase (SDK JS modular).
 *
 * As chaves "web" do Firebase NÃO são segredos — elas identificam o projeto no
 * cliente. A proteção real vem das Security Rules do Firestore/Storage.
 *
 * Configure copiando `.env.example` para `.env` e colando os valores do console:
 *   Firebase Console → ⚙️ Configurações do projeto → Seus apps → Web → Config.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  type Auth,
  getAuth,
  initializeAuth,
  // getReactNativePersistence existe no build React Native do firebase/auth
  // (index.rn), que o Metro resolve no nativo; os tipos default não o expõem.
  // @ts-expect-error — exportado apenas na variante RN
  getReactNativePersistence,
} from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';

import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

/** `true` quando as chaves foram preenchidas no `.env`. */
export const isFirebaseConfigured = Boolean(firebaseConfig.projectId && firebaseConfig.apiKey);

const app = isFirebaseConfigured ? (getApps().length ? getApp() : initializeApp(firebaseConfig)) : null;

/**
 * Instância do Firestore — `null` enquanto o Firebase não estiver configurado.
 * Na web, o WebChannel padrão falha em algumas redes/proxies, então deixamos o
 * SDK auto-detectar e cair para long-polling. No nativo o transporte padrão já
 * é confiável.
 */
export const db = app
  ? Platform.OS === 'web'
    ? initializeFirestore(app, { experimentalAutoDetectLongPolling: true })
    : getFirestore(app)
  : null;

/** Instância do Firebase Storage — `null` enquanto o Firebase não estiver configurado. */
export const storage = app ? getStorage(app) : null;

/**
 * Auth — no nativo persiste a sessão no AsyncStorage; na web usa o padrão
 * (localStorage). `null` enquanto o Firebase não estiver configurado.
 */
export const auth: Auth | null = app
  ? Platform.OS === 'web'
    ? getAuth(app)
    : initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) })
  : null;
