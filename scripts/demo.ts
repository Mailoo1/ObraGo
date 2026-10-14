/**
 * DEMO DEL BACKEND SIN INTERFAZ (ideal para la sustentacion).
 * Ejecuta el flujo completo usando los MISMOS servicios que usara la app,
 * con usuarios reales de Firebase Auth y pasando por las reglas de seguridad.
 *
 *   npm run demo
 */
import { signOut } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../src/config/firebase';
import {
  createOrder, createReview, getStore, listStoreProducts, login, searchMaterial, updateOrderStatus,
  getOrder, upsertStoreProduct,
} from '../src/services';
import { DEMO_PASSWORD, DEMO_STORES, DEMO_USERS } from './seedData';

const title = (t: string) => console.log(`\n=== ${t} ===`);
const ok = (t: string) => console.log(`  ✅ ${t}`);
const money = (n: number) => '$' + n.toLocaleString('es-CO');

async function expectDenied(label: string, fn: () => Promise<unknown>) {
  try {
    await fn();
    console.log(`  ❌ ERROR: "${label}" debió ser bloqueado`);
  } catch (e: any) {
    ok(`Bloqueado: ${label} (${e.code ?? e.message})`);
  }
}

async function main() {
  title('1. El CLIENTE inicia sesión');
  const client = await login(DEMO_USERS.client.email, DEMO_PASSWORD);
  ok(`${client.name} (rol: ${client.role})`);

  title('2. Busca "cemento" y compara ferreterías (ordenado por precio)');
  const myLocation = { latitude: 6.2476, longitude: -75.5658 }; // centro de Medellín
  const results = await searchMaterial({ text: 'cemento', userLocation: myLocation, sortBy: 'price' });
  results.forEach((r) =>
    console.log(`  - ${r.store.name.padEnd(28)} ${money(r.product.price).padStart(9)}  ${r.distanceKm} km  ⭐${r.store.ratingAvg}  ` +
      `${r.store.offersDelivery ? 'domicilio' : ''}${r.store.offersDelivery && r.store.offersPickup ? '+' : ''}${r.store.offersPickup ? 'recogida' : ''}`));
  const best = results[0];

  title('3. Crea el pedido a la ferretería más barata');
  const orderId = await createOrder({
    clientId: client.uid, clientName: client.name, clientPhone: client.phone,
    storeId: best.store.id,
    items: [{ catalogId: best.product.catalogId, quantity: 20 }],
    deliveryMethod: best.store.offersDelivery ? 'delivery' : 'pickup',
    deliveryAddress: 'Obra Torres del Parque, Cra 43A #1-50',
    notes: 'Descargar por el portón trasero',
  });
  let order = await getOrder(orderId);
  ok(`Pedido ${orderId} creado. Estado: ${order?.status}. Total: ${money(order!.subtotal)}`);

  title('4. Intentos de TRAMPA (deben fallar)');
  await expectDenied('el cliente intenta aceptar su propio pedido', () =>
    updateDoc(doc(db, 'orders', orderId), { status: 'accepted' }));
  await expectDenied('el cliente intenta publicar un producto', () =>
    upsertStoreProduct(client.uid, { name: 'Cemento regalado', category: 'construccion', unit: 'bulto', price: 1 }));
  await expectDenied('el cliente intenta calificar un pedido NO finalizado', () =>
    createReview(orderId, client.uid, 5, 'Excelente'));
  await signOut(auth);

  title('5. La FERRETERÍA recibe el pedido y lo atiende');
  const storeCfg = DEMO_STORES.find((s) => s.name === best.store.name)!;
  const storeUser = await login(storeCfg.email, DEMO_PASSWORD);
  ok(`Sesión como ${storeUser.name} (rol: ${storeUser.role}) - ${best.store.name}`);

  await expectDenied('saltarse un estado (pending -> completed)', () =>
    updateDoc(doc(db, 'orders', orderId), { status: 'completed' }));

  const flow = order!.deliveryMethod === 'delivery'
    ? (['accepted', 'preparing', 'dispatched', 'completed'] as const)
    : (['accepted', 'preparing', 'ready_for_pickup', 'completed'] as const);
  for (const status of flow) {
    await updateOrderStatus(orderId, status, storeUser.uid);
    ok(`Estado actualizado -> ${status}`);
  }
  await signOut(auth);

  title('6. El CLIENTE califica la ferretería');
  await login(DEMO_USERS.client.email, DEMO_PASSWORD);
  await createReview(orderId, client.uid, 5, 'Llegó rápido y completo.');
  const store = await getStore(best.store.id);
  ok(`Calificación de ${store!.name}: ⭐${store!.ratingAvg} (${store!.ratingCount} reseña)`);
  await expectDenied('calificar dos veces el mismo pedido', () =>
    createReview(orderId, client.uid, 1, 'Spam'));

  title('7. Historial del pedido');
  order = await getOrder(orderId);
  order!.statusHistory.forEach((h) => console.log(`  ${h.at.toDate().toLocaleTimeString()}  ${h.status}`));

  const prods = await listStoreProducts(best.store.id);
  console.log(`\n(La ferretería tiene ${prods.length} productos publicados)`);
  console.log('\n🎉 Flujo completo OK');
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
