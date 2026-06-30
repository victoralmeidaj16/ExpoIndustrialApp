'use client';

import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';

import { auth, storage } from '@/lib/firebase';

function requireUid(): string {
  const uid = auth?.currentUser?.uid;
  if (!uid) throw new Error('É preciso estar autenticado.');
  return uid;
}

/**
 * Sobe o logo de um expositor para `logos/{adminUid}/{exhibitorId}` (caminho
 * escopado ao próprio usuário) e devolve a URL pública. A URL é gravada no doc
 * do expositor (admin-only), que é o que o app exibe.
 */
export async function uploadExhibitorLogo(exhibitorId: string, file: File): Promise<string> {
  if (!storage) throw new Error('Firebase Storage não configurado.');
  const uid = requireUid();
  const storageRef = ref(storage, `logos/${uid}/${exhibitorId}`);
  await uploadBytes(storageRef, file, { contentType: file.type });
  return getDownloadURL(storageRef);
}

/** Sobe o logo de um patrocinador para `sponsors/${uid}/${sponsorId}` */
export async function uploadSponsorLogo(sponsorId: string, file: File): Promise<string> {
  if (!storage) throw new Error('Firebase Storage não configurado.');
  const uid = requireUid();
  const storageRef = ref(storage, `sponsors/${uid}/${sponsorId}`);
  await uploadBytes(storageRef, file, { contentType: file.type });
  return getDownloadURL(storageRef);
}

/** Sobe um material para `materials/{uid}/{id}`; devolve URL e caminho. */
export async function uploadMaterialFile(
  id: string,
  file: File,
): Promise<{ url: string; path: string }> {
  if (!storage) throw new Error('Firebase Storage não configurado.');
  const uid = requireUid();
  const path = `materials/${uid}/${id}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file, { contentType: file.type });
  return { url: await getDownloadURL(storageRef), path };
}

/** Remove um arquivo de material pelo caminho salvo no doc. */
export async function deleteMaterialFile(path: string): Promise<void> {
  if (!storage || !path) return;
  try {
    await deleteObject(ref(storage, path));
  } catch {
    // arquivo pode não existir ou ter sido enviado por outro admin — não fatal.
  }
}

export function humanFileSize(bytes: number): string {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i ? 1 : 0)} ${units[i]}`;
}
