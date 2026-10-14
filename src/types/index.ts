/**
 * Modelos de datos de ObraGo (reflejan las colecciones de Firestore).
 * Ver docs/BASE_DE_DATOS.md
 */
import { Timestamp } from 'firebase/firestore';
import { DeliveryMethod, OrderStatus } from '../constants/orderStatus';
import { CategoryId } from '../constants/categories';

export type UserRole = 'client' | 'store' | 'admin';
export type StoreStatus = 'pending' | 'approved' | 'suspended';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

/** Coleccion: users/{uid} */
export interface UserProfile {
  uid: string;
  role: UserRole;
  name: string;
  email: string;
  phone: string;
  createdAt: Timestamp;
}

/** Coleccion: stores/{ownerUid} */
export interface Store {
  id: string; // = uid del dueno
  ownerId: string;
  name: string;
  description: string;
  address: string;
  city: string;
  location: Coordinates;
  phone: string;
  offersDelivery: boolean;
  offersPickup: boolean;
  isOpen: boolean;
  status: StoreStatus;
  ratingAvg: number;
  ratingCount: number;
  createdAt: Timestamp;
}

/** Coleccion: catalog/{slug} - catalogo maestro (un "Cemento Argos" para todas las ferreterias) */
export interface CatalogProduct {
  id: string; // slug del nombre
  name: string;
  category: CategoryId;
  unit: string;
  keywords: string[];
  createdAt: Timestamp;
}

/** Coleccion: storeProducts/{storeId}_{catalogId} - lo que vende cada ferreteria y a que precio */
export interface StoreProduct {
  id: string;
  storeId: string;
  catalogId: string;
  name: string;
  category: CategoryId;
  unit: string;
  price: number; // COP
  active: boolean;
  keywords: string[];
  updatedAt: Timestamp;
}

export interface OrderItem {
  catalogId: string;
  name: string;
  unit: string;
  unitPrice: number; // foto del precio al momento del pedido
  quantity: number;
  lineTotal: number;
}

export interface StatusHistoryEntry {
  status: OrderStatus;
  at: Timestamp;
  by: string; // uid de quien hizo el cambio
}

/** Coleccion: orders/{orderId} */
export interface Order {
  id: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  storeId: string;
  storeName: string;
  items: OrderItem[];
  subtotal: number;
  deliveryMethod: DeliveryMethod;
  deliveryAddress: string | null;
  notes: string | null;
  status: OrderStatus;
  statusHistory: StatusHistoryEntry[];
  rejectionReason: string | null;
  // Preparado para la futura integracion con Control Obra
  obraId: string | null;
  obraName: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/** Coleccion: reviews/{orderId} */
export interface Review {
  id: string; // = id del pedido (garantiza 1 resena por pedido)
  orderId: string;
  storeId: string;
  clientId: string;
  clientName: string;
  rating: number; // 1..5
  comment: string;
  createdAt: Timestamp;
}
