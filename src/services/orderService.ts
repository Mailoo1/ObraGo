/**
 * PEDIDOS
 * - El CLIENTE crea el pedido (siempre nace 'pending').
 * - La FERRETERIA lo acepta/rechaza y lo avanza por los estados.
 * - Los precios NO se toman de la pantalla: se leen de Firestore al crear el pedido.
 */
import {
  Timestamp, arrayUnion, addDoc, collection, doc, getDoc, getDocs, onSnapshot,
  orderBy, query, serverTimestamp, updateDoc, where,
} from 'firebase/firestore';
import { DeliveryMethod, OrderStatus, canTransition } from '../constants/orderStatus';
import { db } from '../config/firebase';
import { Order, OrderItem, StoreProduct } from '../types';
import { getStore } from './storeService';
import { storeProductId } from './productService';

export interface CreateOrderInput {
  clientId: string;
  clientName: string;
  clientPhone: string;
  storeId: string;
  items: { catalogId: string; quantity: number }[];
  deliveryMethod: DeliveryMethod;
  deliveryAddress?: string;
  notes?: string;
  obraId?: string; // para la futura integracion con Control Obra
  obraName?: string;
}

export async function createOrder(input: CreateOrderInput): Promise<string> {
  if (input.items.length === 0) throw new Error('El pedido no tiene productos.');
  if (input.items.some((i) => !(i.quantity > 0))) throw new Error('Las cantidades deben ser mayores que 0.');
  if (input.deliveryMethod === 'delivery' && !input.deliveryAddress?.trim()) {
    throw new Error('Debes indicar la dirección de entrega.');
  }

  // 1) Validar la ferreteria
  const store = await getStore(input.storeId);
  if (!store || store.status !== 'approved') throw new Error('La ferretería no está disponible.');
  if (!store.isOpen) throw new Error('La ferretería está cerrada en este momento.');
  if (input.deliveryMethod === 'delivery' && !store.offersDelivery) throw new Error('Esta ferretería no ofrece domicilio.');
  if (input.deliveryMethod === 'pickup' && !store.offersPickup) throw new Error('Esta ferretería no ofrece recogida en tienda.');

  // 2) Leer precios REALES desde Firestore y armar la "foto" del pedido
  const items: OrderItem[] = await Promise.all(
    input.items.map(async (line) => {
      const snap = await getDoc(doc(db, 'storeProducts', storeProductId(input.storeId, line.catalogId)));
      if (!snap.exists() || !(snap.data() as StoreProduct).active) {
        throw new Error(`El producto "${line.catalogId}" ya no está disponible en esta ferretería.`);
      }
      const p = snap.data() as StoreProduct;
      return {
        catalogId: line.catalogId,
        name: p.name,
        unit: p.unit,
        unitPrice: p.price,
        quantity: line.quantity,
        lineTotal: p.price * line.quantity,
      };
    }),
  );
  const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0);

  // 3) Guardar el pedido
  const ref = await addDoc(collection(db, 'orders'), {
    clientId: input.clientId,
    clientName: input.clientName,
    clientPhone: input.clientPhone,
    storeId: store.id,
    storeName: store.name,
    items,
    subtotal,
    deliveryMethod: input.deliveryMethod,
    deliveryAddress: input.deliveryMethod === 'delivery' ? input.deliveryAddress!.trim() : null,
    notes: input.notes?.trim() || null,
    status: 'pending',
    statusHistory: [{ status: 'pending', at: Timestamp.now(), by: input.clientId }],
    rejectionReason: null,
    obraId: input.obraId ?? null,
    obraName: input.obraName ?? null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getOrder(orderId: string): Promise<Order | null> {
  const snap = await getDoc(doc(db, 'orders', orderId));
  return snap.exists() ? ({ ...snap.data(), id: snap.id } as Order) : null;
}

/** Historial del cliente (mas recientes primero). */
export async function listClientOrders(clientId: string): Promise<Order[]> {
  const snap = await getDocs(
    query(collection(db, 'orders'), where('clientId', '==', clientId), orderBy('createdAt', 'desc')),
  );
  return snap.docs.map((d) => ({ ...d.data(), id: d.id }) as Order);
}

/** Pedidos recibidos por la ferreteria (opcionalmente filtrados por estado). */
export async function listStoreOrders(storeId: string, status?: OrderStatus): Promise<Order[]> {
  const constraints = [where('storeId', '==', storeId)];
  if (status) constraints.push(where('status', '==', status));
  const snap = await getDocs(query(collection(db, 'orders'), ...constraints, orderBy('createdAt', 'desc')));
  return snap.docs.map((d) => ({ ...d.data(), id: d.id }) as Order);
}

/** TIEMPO REAL: el cliente ve cambiar el estado sin recargar. Devuelve la funcion para cancelar la suscripcion. */
export function subscribeToOrder(orderId: string, onChange: (order: Order | null) => void) {
  return onSnapshot(doc(db, 'orders', orderId), (snap) =>
    onChange(snap.exists() ? ({ ...snap.data(), id: snap.id } as Order) : null),
  );
}

/** TIEMPO REAL: la ferreteria recibe pedidos nuevos al instante. */
export function subscribeToStoreOrders(storeId: string, onChange: (orders: Order[]) => void) {
  return onSnapshot(
    query(collection(db, 'orders'), where('storeId', '==', storeId), orderBy('createdAt', 'desc')),
    (snap) => onChange(snap.docs.map((d) => ({ ...d.data(), id: d.id }) as Order)),
  );
}

/** La ferreteria cambia el estado (aceptar, rechazar, preparar, despachar, finalizar). */
export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
  actorId: string,
  rejectionReason?: string,
): Promise<void> {
  const order = await getOrder(orderId);
  if (!order) throw new Error('Pedido no encontrado.');
  if (order.storeId !== actorId) throw new Error('Este pedido no pertenece a tu ferretería.');
  if (!canTransition(order.status, newStatus, order.deliveryMethod)) {
    throw new Error(`No se puede pasar de "${order.status}" a "${newStatus}".`);
  }
  if (newStatus === 'rejected' && !rejectionReason?.trim()) {
    throw new Error('Indica el motivo del rechazo.');
  }

  await updateDoc(doc(db, 'orders', orderId), {
    status: newStatus,
    statusHistory: arrayUnion({ status: newStatus, at: Timestamp.now(), by: actorId }),
    updatedAt: serverTimestamp(),
    ...(newStatus === 'rejected' ? { rejectionReason: rejectionReason!.trim() } : {}),
  });
}
