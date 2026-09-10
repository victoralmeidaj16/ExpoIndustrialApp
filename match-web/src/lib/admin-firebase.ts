import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

function ensureAdminApp() {
  if (getApps().length === 0) {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (!serviceAccountJson) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON nao configurada');
    }
    initializeApp({ credential: cert(JSON.parse(serviceAccountJson)) });
  }
}

export function getAdminDb(): Firestore {
  ensureAdminApp();
  return getFirestore();
}

export function getAdminAuth(): Auth {
  ensureAdminApp();
  return getAuth();
}

/**
 * Valida o header `Authorization: Bearer <idToken>` da requisição e devolve o
 * usuário autenticado. Lança se o token estiver ausente/inválido/expirado.
 */
export async function requireAuthUser(
  request: Request,
): Promise<{ uid: string; email: string; emailVerified: boolean }> {
  const header = request.headers.get('authorization') ?? '';
  const idToken = header.startsWith('Bearer ') ? header.slice('Bearer '.length).trim() : '';
  if (!idToken) {
    throw Object.assign(new Error('Token de autenticação ausente.'), { status: 401 });
  }

  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken);
    return {
      uid: decoded.uid,
      email: (decoded.email ?? '').trim().toLowerCase(),
      emailVerified: decoded.email_verified === true,
    };
  } catch {
    throw Object.assign(new Error('Sessão inválida ou expirada. Entre novamente.'), { status: 401 });
  }
}
