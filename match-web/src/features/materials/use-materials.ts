'use client';

import { collection, deleteDoc, doc, onSnapshot, setDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';

import {
  MATERIALS_COLLECTION,
  materialConverter,
  sortMaterials,
  type Material,
} from '@/domain/material';
import { db } from '@/lib/firebase';
import { deleteMaterialFile, uploadMaterialFile } from '@/lib/uploads';

export function useMaterials() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }
    const ref = collection(db, MATERIALS_COLLECTION).withConverter(materialConverter);
    return onSnapshot(
      ref,
      (snap) => {
        setMaterials(sortMaterials(snap.docs.map((d) => d.data())));
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err);
        setLoading(false);
      },
    );
  }, []);

  return { materials, loading, error };
}

/**
 * Cria um material: sobe o arquivo no Storage (`materials/{id}`) e grava o doc.
 * Gera o id no cliente para casar o caminho do Storage com o doc do Firestore.
 */
export async function createMaterial(input: {
  title: string;
  description: string;
  order: number;
  file: File;
}) {
  if (!db) throw new Error('Firebase não configurado.');
  const id = doc(collection(db, MATERIALS_COLLECTION)).id;
  const { url, path } = await uploadMaterialFile(id, input.file);
  const material: Omit<Material, 'id'> = {
    title: input.title.trim(),
    description: input.description.trim(),
    fileUrl: url,
    storagePath: path,
    fileName: input.file.name,
    contentType: input.file.type || 'application/octet-stream',
    size: input.file.size,
    order: input.order,
    createdAt: Date.now(),
  };
  await setDoc(doc(db, MATERIALS_COLLECTION, id), material);
  return id;
}

/** Atualiza metadados (título/descrição/ordem) sem trocar o arquivo. */
export async function updateMaterialMeta(
  id: string,
  meta: { title: string; description: string; order: number },
) {
  if (!db) throw new Error('Firebase não configurado.');
  await setDoc(
    doc(db, MATERIALS_COLLECTION, id),
    { title: meta.title.trim(), description: meta.description.trim(), order: meta.order },
    { merge: true },
  );
}

export async function deleteMaterial(id: string, storagePath: string) {
  if (!db) throw new Error('Firebase não configurado.');
  await deleteMaterialFile(storagePath);
  await deleteDoc(doc(db, MATERIALS_COLLECTION, id));
}
