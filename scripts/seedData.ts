/** Datos de prueba compartidos por seed.ts y demo.ts */
import { CategoryId } from '../src/constants/categories';

export const DEMO_PASSWORD = 'ObraGo123!';

export const DEMO_USERS = {
  admin: { email: 'admin@obrago.test', name: 'Admin ObraGo', phone: '3000000000' },
  client: { email: 'cliente@obrago.test', name: 'Carlos Constructor', phone: '3001112233' },
};

export const CATALOG: { name: string; category: CategoryId; unit: string; base: number }[] = [
  { name: 'Cemento Argos gris 50 kg', category: 'construccion', unit: 'bulto', base: 38000 },
  { name: 'Arena de río', category: 'construccion', unit: 'm³', base: 85000 },
  { name: 'Grava', category: 'construccion', unit: 'm³', base: 95000 },
  { name: 'Ladrillo tolete', category: 'construccion', unit: 'unidad', base: 900 },
  { name: 'Bloque No 5', category: 'construccion', unit: 'unidad', base: 2200 },
  { name: 'Varilla #4', category: 'acero', unit: 'unidad', base: 29000 },
  { name: 'Alambre negro', category: 'acero', unit: 'kg', base: 6500 },
  { name: 'Malla electrosoldada', category: 'acero', unit: 'unidad', base: 210000 },
  { name: 'Tubo PVC 2 pulgadas', category: 'plomeria', unit: 'unidad', base: 18000 },
  { name: 'Codo PVC 2 pulgadas', category: 'plomeria', unit: 'unidad', base: 2500 },
  { name: 'Válvula de paso 1/2', category: 'plomeria', unit: 'unidad', base: 14000 },
  { name: 'Cable eléctrico #12', category: 'electricos', unit: 'metro', base: 2800 },
  { name: 'Toma doble', category: 'electricos', unit: 'unidad', base: 7500 },
  { name: 'Martillo', category: 'herramientas', unit: 'unidad', base: 28000 },
  { name: 'Taladro percutor', category: 'herramientas', unit: 'unidad', base: 189000 },
  { name: 'Pintura vinilo blanco', category: 'pinturas', unit: 'galón', base: 55000 },
  { name: 'Impermeabilizante', category: 'pinturas', unit: 'galón', base: 78000 },
  { name: 'Tornillo drywall', category: 'otros', unit: 'caja', base: 12000 },
];

export const DEMO_STORES = [
  {
    email: 'tienda1@obrago.test', ownerName: 'Luis Gómez', phone: '3101111111',
    name: 'Ferretería El Constructor', description: 'Todo para tu obra en Laureles',
    address: 'Cra 70 #44-20', city: 'Medellín',
    location: { latitude: 6.2442, longitude: -75.5902 },
    offersDelivery: true, offersPickup: true, priceFactor: 1.0, skip: ['Taladro percutor'],
  },
  {
    email: 'tienda2@obrago.test', ownerName: 'María Ruiz', phone: '3102222222',
    name: 'Ferrecentro El Poblado', description: 'Materiales y herramientas',
    address: 'Cl 10 #38-15', city: 'Medellín',
    location: { latitude: 6.2086, longitude: -75.5695 },
    offersDelivery: true, offersPickup: true, priceFactor: 1.08, skip: ['Grava'],
  },
  {
    email: 'tienda3@obrago.test', ownerName: 'Pedro Ortiz', phone: '3103333333',
    name: 'Depósito La Obra', description: 'Precios de mayorista (solo recogida)',
    address: 'Cl 37 Sur #43-10', city: 'Envigado',
    location: { latitude: 6.1759, longitude: -75.5917 },
    offersDelivery: false, offersPickup: true, priceFactor: 0.94, skip: ['Pintura vinilo blanco', 'Impermeabilizante'],
  },
];
