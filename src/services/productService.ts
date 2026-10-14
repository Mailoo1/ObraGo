/**
 * PRODUCTOS Y PRECIOS DE LA FERRETERIA
 * Dos colecciones:
 *  - catalog:       catalogo maestro ("Cemento Argos" existe UNA vez) -> permite comparar precios
 *  - storeProducts: lo que vende cada ferreteria y a que precio (SIN inventario, segun el MVP)
 */
import {
  collection, deleteDoc, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where,
} from 'firebase/firestore';
import { CategoryId } from '../constants/categories';
import { db } from '../config/firebase';
import { StoreProduct } from '../types';
import { buildKeywords, slugify } from '../utils/text';

export interface ProductInput {
  name: string;
  category: CategoryId;
  unit: string; // bulto, unidad, m3, galon...
  price: number;
}

/** id del documento: {storeId}_{catalogId} -> una ferreteria no puede tener el mismo producto duplicado */
export const storeProductId = (storeId: string, catalogId: string) => `${storeId}_${catalogId}`;

/** Publica (o actualiza) un producto de la ferreteria. Si no existe en el catalogo, lo crea. */
export async function upsertStoreProduct(storeId: string, input: ProductInput): Promise<string> {
  if (!(input.price > 0)) throw new Error('El precio debe ser mayor que 0.');

  const catalogId = slugify(input.name);
  const keywords = buildKeywords(input.name, input.category);

  // 1) catalogo maestro (solo se crea si no existe; editarlo es cosa del admin)
  const catalogRef = doc(db, 'catalog', catalogId);
  if (!(await getDoc(catalogRef)).exists()) {
    await setDoc(catalogRef, {
      name: input.name.trim(),
      category: input.category,
      unit: input.unit,
      keywords,
      createdAt: serverTimestamp(),
    });
  }

  // 2) producto de la ferreteria con su precio
  const id = storeProductId(storeId, catalogId);
  await setDoc(doc(db, 'storeProducts', id), {
    storeId,
    catalogId,
    name: input.name.trim(),
    category: input.category,
    unit: input.unit,
    price: input.price,
    active: true,
    keywords,
    updatedAt: serverTimestamp(),
  });
  return id;
}

export async function listStoreProducts(storeId: string): Promise<StoreProduct[]> {
  const snap = await getDocs(query(collection(db, 'storeProducts'), where('storeId', '==', storeId)));
  return snap.docs
    .map((d) => ({ ...d.data(), id: d.id }) as StoreProduct)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function updateProductPrice(storeId: string, catalogId: string, price: number): Promise<void> {
  if (!(price > 0)) throw new Error('El precio debe ser mayor que 0.');
  await updateDoc(doc(db, 'storeProducts', storeProductId(storeId, catalogId)), {
    price,
    updatedAt: serverTimestamp(),
  });
}

/** "Lo tengo / no lo tengo hoy" sin manejar cantidades. */
export async function setProductActive(storeId: string, catalogId: string, active: boolean): Promise<void> {
  await updateDoc(doc(db, 'storeProducts', storeProductId(storeId, catalogId)), {
    active,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteStoreProduct(storeId: string, catalogId: string): Promise<void> {
  await deleteDoc(doc(db, 'storeProducts', storeProductId(storeId, catalogId)));
}
