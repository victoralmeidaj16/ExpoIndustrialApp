/**
 * Materiais para download (PDFs/arquivos) disponibilizados pelo organizador no
 * painel (match-web). Coleção `materials`. Leitura pública em tempo real.
 */
import { collection, onSnapshot, query } from 'firebase/firestore';
import { useEffect, useState } from 'react';

import { db, isFirebaseConfigured } from '@/lib/firebase';

export const MATERIALS_COLLECTION = 'materials';

export type Material = {
  id: string;
  title: string;
  description: string;
  fileUrl: string;
  fileName: string;
  contentType: string;
  size: number;
  order: number;
  createdAt: number;
};

function fromDoc(id: string, data: Record<string, unknown>): Material {
  return {
    id,
    title: (data.title as string) ?? '',
    description: (data.description as string) ?? '',
    fileUrl: (data.fileUrl as string) ?? '',
    fileName: (data.fileName as string) ?? '',
    contentType: (data.contentType as string) ?? '',
    size: typeof data.size === 'number' ? (data.size as number) : 0,
    order: typeof data.order === 'number' ? (data.order as number) : 0,
    createdAt: typeof data.createdAt === 'number' ? (data.createdAt as number) : 0,
  };
}

export function useMaterials(): { materials: Material[]; loading: boolean } {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(isFirebaseConfigured);

  useEffect(() => {
    if (!isFirebaseConfigured || !db) {
      setLoading(false);
      return;
    }
    const q = query(collection(db, MATERIALS_COLLECTION));
    return onSnapshot(
      q,
      (snap) => {
        const docs = snap.docs
          .map((d) => fromDoc(d.id, d.data()))
          .sort((a, b) => a.order - b.order || b.createdAt - a.createdAt);
        setMaterials(docs);
        setLoading(false);
      },
      () => setLoading(false),
    );
  }, []);

  return { materials, loading };
}
