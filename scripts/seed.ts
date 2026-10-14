/**
 * SEED: llena la base de datos con datos de prueba (usuarios, ferreterias, catalogo, precios).
 * Usa firebase-admin (permisos de administrador, se salta las reglas).
 *
 * Requisitos:
 *  1) Descargar la llave: Firebase Console > Configuracion > Cuentas de servicio > "Generar nueva clave privada"
 *  2) Guardarla como ./serviceAccountKey.json en la raiz del proyecto (esta en .gitignore)
 *  3) Ejecutar:  npm run seed
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { cert, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { buildKeywords, slugify } from '../src/utils/text';
import { CATALOG, DEMO_PASSWORD, DEMO_STORES, DEMO_USERS } from './seedData';

const key = JSON.parse(readFileSync(resolve(process.cwd(), 'serviceAccountKey.json'), 'utf8'));
initializeApp({ credential: cert(key) });
const auth = getAuth();
const db = getFirestore();
const now = () => FieldValue.serverTimestamp();

async function ensureUser(email: string, name: string): Promise<string> {
  try {
    return (await auth.getUserByEmail(email)).uid;
  } catch {
    return (await auth.createUser({ email, password: DEMO_PASSWORD, displayName: name })).uid;
  }
}

async function main() {
  // Usuarios base
  const adminUid = await ensureUser(DEMO_USERS.admin.email, DEMO_USERS.admin.name);
  await db.doc(`users/${adminUid}`).set({ uid: adminUid, role: 'admin', ...DEMO_USERS.admin, createdAt: now() });

  const clientUid = await ensureUser(DEMO_USERS.client.email, DEMO_USERS.client.name);
  await db.doc(`users/${clientUid}`).set({ uid: clientUid, role: 'client', ...DEMO_USERS.client, createdAt: now() });

  // Catalogo maestro
  for (const p of CATALOG) {
    await db.doc(`catalog/${slugify(p.name)}`).set({
      name: p.name, category: p.category, unit: p.unit,
      keywords: buildKeywords(p.name, p.category), createdAt: now(),
    });
  }

  // Ferreterias + sus productos con precio
  for (const s of DEMO_STORES) {
    const uid = await ensureUser(s.email, s.ownerName);
    await db.doc(`users/${uid}`).set({
      uid, role: 'store', name: s.ownerName, email: s.email, phone: s.phone, createdAt: now(),
    });
    await db.doc(`stores/${uid}`).set({
      ownerId: uid, name: s.name, description: s.description, address: s.address, city: s.city,
      location: s.location, phone: s.phone, offersDelivery: s.offersDelivery, offersPickup: s.offersPickup,
      isOpen: true, status: 'approved', ratingAvg: 0, ratingCount: 0, createdAt: now(),
    });
    for (const p of CATALOG.filter((c) => !s.skip.includes(c.name))) {
      const catalogId = slugify(p.name);
      await db.doc(`storeProducts/${uid}_${catalogId}`).set({
        storeId: uid, catalogId, name: p.name, category: p.category, unit: p.unit,
        price: Math.round((p.base * s.priceFactor) / 100) * 100,
        active: true, keywords: buildKeywords(p.name, p.category), updatedAt: now(),
      });
    }
    console.log(`✔ ${s.name}`);
  }
  console.log('\nListo. Contraseña de todos los usuarios de prueba:', DEMO_PASSWORD);
  console.log('Admin:', DEMO_USERS.admin.email, '| Cliente:', DEMO_USERS.client.email, '| Tiendas: tienda1..3@obrago.test');
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
