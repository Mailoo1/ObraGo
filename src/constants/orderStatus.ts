/**
 * Estados del pedido y reglas de transicion.
 * (Las MISMAS reglas estan en firestore.rules > validTransition, asi que
 *  aunque alguien se salte la app, el servidor las vuelve a validar.)
 */
export const ORDER_STATUS = {
  PENDING: 'pending', // Pendiente de confirmacion
  ACCEPTED: 'accepted', // Aceptado
  PREPARING: 'preparing', // Preparando pedido
  READY_FOR_PICKUP: 'ready_for_pickup', // Listo para recoger (pickup)
  DISPATCHED: 'dispatched', // Despachado (delivery)
  COMPLETED: 'completed', // Finalizado
  REJECTED: 'rejected', // Rechazado
} as const;

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];
export type DeliveryMethod = 'delivery' | 'pickup';

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'Pendiente de confirmación',
  accepted: 'Aceptado',
  preparing: 'Preparando pedido',
  ready_for_pickup: 'Listo para recoger',
  dispatched: 'Despachado',
  completed: 'Finalizado',
  rejected: 'Rechazado',
};

/** Devuelve true si el cambio de estado esta permitido. */
export function canTransition(from: OrderStatus, to: OrderStatus, method: DeliveryMethod): boolean {
  switch (from) {
    case 'pending':
      return to === 'accepted' || to === 'rejected';
    case 'accepted':
      return to === 'preparing';
    case 'preparing':
      return (to === 'ready_for_pickup' && method === 'pickup') || (to === 'dispatched' && method === 'delivery');
    case 'ready_for_pickup':
    case 'dispatched':
      return to === 'completed';
    default:
      return false; // completed y rejected son estados finales
  }
}

/** Siguiente estado "natural" (para el boton "avanzar" de la ferreteria). */
export function nextStatus(from: OrderStatus, method: DeliveryMethod): OrderStatus | null {
  switch (from) {
    case 'pending': return 'accepted';
    case 'accepted': return 'preparing';
    case 'preparing': return method === 'pickup' ? 'ready_for_pickup' : 'dispatched';
    case 'ready_for_pickup':
    case 'dispatched': return 'completed';
    default: return null;
  }
}
