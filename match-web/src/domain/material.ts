/**
 * Domínio "Material" — arquivos/PDFs que o organizador disponibiliza para os
 * visitantes baixarem na home do app. Coleção `materials` (NOVO).
 */
import {
  type FirestoreDataConverter,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';

export const MATERIALS_COLLECTION = 'materials';

export type Material = {
  id: string;
  title: string;
  description: string;
  fileUrl: string;
  /** Caminho no Storage (`materials/{uid}/{id}`) — usado para excluir o arquivo. */
  storagePath: string;
  fileName: string;
  contentType: string;
  size: number;
  order: number;
  createdAt: number;
};

export function sortMaterials(items: Material[]): Material[] {
  return [...items].sort((a, b) => a.order - b.order || b.createdAt - a.createdAt);
}

export const materialConverter: FirestoreDataConverter<Material> = {
  toFirestore(material: Material) {
    const { id: _omit, ...data } = material;
    return data;
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): Material {
    const data = snapshot.data();
    return {
      id: snapshot.id,
      title: data.title ?? '',
      description: data.description ?? '',
      fileUrl: data.fileUrl ?? '',
      storagePath: data.storagePath ?? '',
      fileName: data.fileName ?? '',
      contentType: data.contentType ?? '',
      size: typeof data.size === 'number' ? data.size : 0,
      order: typeof data.order === 'number' ? data.order : 0,
      createdAt: typeof data.createdAt === 'number' ? data.createdAt : 0,
    };
  },
};
