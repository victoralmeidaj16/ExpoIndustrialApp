'use client';

/**
 * Autenticação por email/senha (Firebase Auth) para o painel.
 * Espelha `ExpoIndustrialApp/src/features/auth/use-auth.tsx`.
 */
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  type User,
} from 'firebase/auth';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { auth, isFirebaseConfigured } from '@/lib/firebase';

type AuthContextValue = {
  user: User | null;
  initializing: boolean;
  configured: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const NOT_CONFIGURED = new Error('Firebase não configurado. Preencha o .env.local e reinicie.');

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(isFirebaseConfigured);

  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setInitializing(false);
    });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      initializing,
      configured: isFirebaseConfigured,
      async signIn(email, password) {
        if (!auth) throw NOT_CONFIGURED;
        await signInWithEmailAndPassword(auth, email.trim(), password);
      },
      async signOut() {
        if (!auth) throw NOT_CONFIGURED;
        await fbSignOut(auth);
      },
    }),
    [user, initializing],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>.');
  return ctx;
}

/** Traduz códigos do Firebase Auth para mensagens em português. */
export function authErrorMessage(err: unknown): string {
  const code = (err as { code?: string })?.code ?? '';
  switch (code) {
    case 'auth/invalid-email':
      return 'Email inválido.';
    case 'auth/missing-password':
      return 'Informe a senha.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Email ou senha incorretos.';
    case 'auth/too-many-requests':
      return 'Muitas tentativas. Tente novamente em instantes.';
    case 'auth/network-request-failed':
      return 'Falha de conexão. Verifique sua internet.';
    default:
      return (err as Error)?.message ?? 'Não foi possível entrar. Tente novamente.';
  }
}
