/**
 * FERRETERIAS
 * Cada ferreteria es un documento stores/{uid del dueno}.
 * Nacen en estado 'pending' y el admin las aprueba ('approved').
 */
import {
  collection, doc, documentId, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Coordinates, Store } from '../types';

export interface StoreInput {
  name: string;
  description?: string;
  address: string;
  city: string;
  location: Coordinates;
  phone: string;
  offersDelivery: boolean;
  offersPickup: boolean;
}

export async function createStore(ownerId: string, input: StoreInput): Promise<void> {
  if (!input.offersDelivery && !input.offersPickup) {
    throw new Error('La ferretería debe ofrecer domicilio, recogida o ambas.');
  }
  await setDoc(doc(db, 'stores', ownerId), {
    ownerId,
    name: input.name.trim(),
    description: input.description?.trim() ?? '',
    address: input.address.trim(),
    city: input.city.trim(),
    location: input.location,
    phone: input.phone.trim(),
    offersDelivery: input.offersDelivery,
    offersPickup: input.offersPickup,
    isOpen: true,
    status: 'pending',
    ratingAvg: 0,
    ratingCount: 0,
    createdAt: serverTimestamp(),
  });
}

export async function getStore(storeId: string): Promise<Store | null> {
  const snap = await getDoc(doc(db, 'stores', storeId));
  return snap.exists() ? ({ ...snap.data(), id: snap.id } as Store) : null;
}

/** Trae varias ferreterias a la vez (Firestore limita "in" a 30 ids por consulta). */
export async function getStoresByIds(ids: string[]): Promise<Store[]> {
  const unique = Array.from(new Set(ids));
  const result: Store[] = [];
  for (let i = 0; i < unique.length; i += 30) {
    const chunk = unique.slice(i, i + 30);
    const snap = await getDocs(query(collection(db, 'stores'), where(documentId(), 'in', chunk)));
    snap.forEach((d) => result.push({ ...d.data(), id: d.id } as Store));
  }
  return result;
}

export async function updateStore(storeId: string, data: Partial<StoreInput>): Promise<void> {
  await updateDoc(doc(db, 'stores', storeId), data);
}

/** Abrir / cerrar la ferreteria (si esta cerrada no aparece en las busquedas). */
export async function setStoreOpen(storeId: string, isOpen: boolean): Promise<void> {
  await updateDoc(doc(db, 'stores', storeId), { isOpen });
}

/** Solo admin: aprobar o suspender una ferreteria. */
export async function setStoreStatus(storeId: string, status: 'approved' | 'suspended'): Promise<void> {
  await updateDoc(doc(db, 'stores', storeId), { status });
}

/** Solo admin: ferreterias esperando aprobacion. */
export async function listPendingStores(): Promise<Store[]> {
  const snap = await getDocs(query(collection(db, 'stores'), where('status', '==', 'pending')));
  return snap.docs.map((d) => ({ ...d.data(), id: d.id }) as Store);
}
