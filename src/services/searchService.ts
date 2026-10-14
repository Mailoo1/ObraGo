/**
 * BUSQUEDA Y COMPARACION DE PROVEEDORES
 * Flujo: texto -> productos que coinciden (storeProducts) -> ferreterias de esos productos
 *        -> filtrar (aprobada, abierta, tipo de entrega) -> calcular distancia -> ordenar.
 */
import { collection, getDocs, limit, query, where } from 'firebase/firestore';
import { DeliveryMethod } from '../constants/orderStatus';
import { db } from '../config/firebase';
import { Coordinates, Store, StoreProduct } from '../types';
import { distanceKm } from '../utils/geo';
import { tokenizeQuery } from '../utils/text';
import { getStoresByIds } from './storeService';

export type SortBy = 'price' | 'distance' | 'rating';

export interface SearchParams {
  text: string;
  userLocation?: Coordinates;
  deliveryMethod?: DeliveryMethod;
  sortBy?: SortBy;
}

export interface SearchResult {
  product: StoreProduct;
  store: Store;
  distanceKm: number | null;
}

export async function searchMaterial(params: SearchParams): Promise<SearchResult[]> {
  const tokens = tokenizeQuery(params.text);
  if (tokens.length === 0) return [];

  // Firestore solo permite 1 "array-contains": usamos la palabra mas larga y filtramos el resto aqui.
  const primary = [...tokens].sort((a, b) => b.length - a.length)[0];
  const snap = await getDocs(
    query(collection(db, 'storeProducts'), where('keywords', 'array-contains', primary), limit(200)),
  );

  const products = snap.docs
    .map((d) => ({ ...d.data(), id: d.id }) as StoreProduct)
    .filter((p) => p.active && tokens.every((t) => p.keywords.includes(t)));
  if (products.length === 0) return [];

  const stores = await getStoresByIds(products.map((p) => p.storeId));
  const storeMap = new Map(stores.map((s) => [s.id, s]));

  const results: SearchResult[] = [];
  for (const product of products) {
    const store = storeMap.get(product.storeId);
    if (!store || store.status !== 'approved' || !store.isOpen) continue;
    if (params.deliveryMethod === 'delivery' && !store.offersDelivery) continue;
    if (params.deliveryMethod === 'pickup' && !store.offersPickup) continue;
    results.push({
      product,
      store,
      distanceKm: params.userLocation ? distanceKm(params.userLocation, store.location) : null,
    });
  }

  const sortBy = params.sortBy ?? 'price';
  results.sort((a, b) => {
    if (sortBy === 'distance') return (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity);
    if (sortBy === 'rating') return b.store.ratingAvg - a.store.ratingAvg;
    return a.product.price - b.product.price;
  });
  return results;
}
