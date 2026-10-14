/**
 * CALIFICACIONES Y COMENTARIOS
 * - Solo el cliente de un pedido FINALIZADO puede calificar (lo valida firestore.rules).
 * - id de la resena = id del pedido => maximo 1 resena por pedido.
 * - El promedio de la ferreteria se actualiza en una TRANSACCION (todo o nada).
 */
import {
  collection, doc, getDocs, orderBy, query, runTransaction, serverTimestamp, where,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Order, Review, Store } from '../types';

export async function createReview(orderId: string, clientId: string, rating: number, comment: string) {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new Error('La calificación debe ser de 1 a 5.');

  await runTransaction(db, async (tx) => {
    const orderRef = doc(db, 'orders', orderId);
    const reviewRef = doc(db, 'reviews', orderId);

    const orderSnap = await tx.get(orderRef);
    if (!orderSnap.exists()) throw new Error('Pedido no encontrado.');
    const order = orderSnap.data() as Order;
    if (order.clientId !== clientId) throw new Error('Este pedido no es tuyo.');
    if (order.status !== 'completed') throw new Error('Solo puedes calificar pedidos finalizados.');
    if ((await tx.get(reviewRef)).exists()) throw new Error('Este pedido ya fue calificado.');

    const storeRef = doc(db, 'stores', order.storeId);
    const store = (await tx.get(storeRef)).data() as Store;
    const newCount = store.ratingCount + 1;
    const newAvg = Math.round(((store.ratingAvg * store.ratingCount + rating) / newCount) * 100) / 100;

    tx.set(reviewRef, {
      orderId,
      storeId: order.storeId,
      clientId,
      clientName: order.clientName,
      rating,
      comment: comment.trim(),
      createdAt: serverTimestamp(),
    });
    tx.update(storeRef, { ratingAvg: newAvg, ratingCount: newCount });
  });
}

export async function listStoreReviews(storeId: string): Promise<Review[]> {
  const snap = await getDocs(
    query(collection(db, 'reviews'), where('storeId', '==', storeId), orderBy('createdAt', 'desc')),
  );
  return snap.docs.map((d) => ({ ...d.data(), id: d.id }) as Review);
}
