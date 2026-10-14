# Guía para sustentar el backend de ObraGo

> Duración sugerida: 5–8 minutos. No lo leas: ten claras estas ideas y haz la demo.

## 1. Pitch (30 segundos)
"ObraGo es una plataforma de abastecimiento para obras. Cuando el proveedor habitual no tiene un material, el
encargado busca el producto, ve qué ferreterías lo tienen, compara precio, distancia y calificación, y envía el
pedido **solo** a la que elige. Hoy eso se hace con llamadas y WhatsApp. Mi trabajo de hoy es el **backend**."

## 2. Arquitectura en una imagen

```
 App (React Native + Expo: Android / iOS / Web)
        │  usa
        ▼
 CAPA DE SERVICIOS  (src/services)  ← lógica de negocio: validar, calcular, armar pedidos
        │  habla con
        ▼
 FIREBASE  (nube de Google)
   ├─ Authentication  → quién eres (email + contraseña)
   ├─ Firestore       → base de datos NoSQL
   └─ Security Rules  → qué puedes hacer (se ejecutan en el SERVIDOR)
```

**Si el profe pregunta "¿dónde está el backend?"**
Es una arquitectura *serverless* (Backend-as-a-Service): no administro un servidor propio.
El backend lo componen tres piezas: **(1)** Firebase Auth (identidad), **(2)** Firestore (datos) y
**(3)** las **Reglas de seguridad** (`firestore.rules`) que se ejecutan en los servidores de Google y son la
verdadera barrera de seguridad; más **(4)** mi capa de servicios (`src/services`) con la lógica de negocio.

## 3. ¿Dónde está cada cosa?

| Qué | Dónde |
|---|---|
| Conexión a Firebase | `src/config/firebase.ts` |
| Modelos de datos (TypeScript) | `src/types/index.ts` |
| Estados del pedido y flujo permitido | `src/constants/orderStatus.ts` |
| Registro / login / roles | `src/services/authService.ts` |
| Ferreterías | `src/services/storeService.ts` |
| Productos y precios | `src/services/productService.ts` |
| Búsqueda y comparación | `src/services/searchService.ts` |
| Pedidos y estados | `src/services/orderService.ts` |
| Calificaciones | `src/services/reviewService.ts` |
| **Seguridad** | `firestore.rules` |
| Índices | `firestore.indexes.json` |
| Datos de prueba / demo | `scripts/seed.ts`, `scripts/demo.ts` |
| Diseño de la BD | `docs/BASE_DE_DATOS.md` |

## 4. Base de datos: lo que hay que saber
6 colecciones: `users`, `stores`, `catalog`, `storeProducts`, `orders`, `reviews`.
(Diagrama y campos en `BASE_DE_DATOS.md`.) Tres ideas clave:

1. **Catálogo maestro + precio por ferretería** → permite comparar el mismo producto entre ferreterías.
2. **El pedido guarda una "foto" de nombres y precios** → cambios futuros de precio no alteran pedidos viejos.
3. **Sin inventario** (decisión del MVP, sección 7 de la especificación): solo `price` y `active`.

## 5. Roles y seguridad (4 reglas para mencionar)
- **Tres roles:** cliente, ferretería, admin. El rol `admin` no se puede elegir al registrarse.
- Un pedido solo lo ve **el cliente que lo hizo, la ferretería elegida y el admin**.
- **Solo la ferretería** avanza el estado, y solo por el flujo válido
  (`pending → accepted → preparing → ready/dispatched → completed`; no se puede saltar pasos).
- Solo se puede calificar un pedido **finalizado**, **una vez**, y solo el cliente que lo hizo.
- Extra: los **precios del pedido se leen de la base de datos**, no de lo que mande la pantalla.

## 6. Demo en vivo (2 minutos)
```powershell
npm run demo
```
Muestra, en consola: login → búsqueda "cemento" comparando 3 ferreterías → pedido → **intentos de trampa
bloqueados** (aceptar su propio pedido, saltarse estados, publicar productos siendo cliente, calificar dos veces)
→ la ferretería atiende → calificación actualizada.
Respaldo: abre Firebase Console → Firestore y muestra las colecciones y el pedido con su `statusHistory`.

## 7. Preguntas probables y respuestas

**¿Por qué Firebase y no Node + Express + SQL?**
Para entregar un MVP funcional rápido, con autenticación, tiempo real y hosting incluidos. La migración futura
es posible porque toda la lógica está aislada en `src/services`.

**¿Por qué NoSQL?** El acceso principal es "dame los productos que coinciden con X" y "dame los pedidos de Y";
Firestore se diseña por consultas. Los datos se duplican a propósito (nombre/precio en el pedido) para conservar el histórico.

**¿Cómo funciona la búsqueda sin `LIKE`?** Guardo los prefijos de cada palabra (`ce, cem, ceme…`) en un arreglo
`keywords` y consulto con `array-contains`. Luego filtro, calculo distancia (Haversine) y ordeno.

**¿Qué pasa si alguien modifica la app?** Las reglas de seguridad corren en el servidor y vuelven a validar
todo (rol, dueño del pedido, transición de estado, calificación). Lo demuestro con el demo.

**¿Hay tiempo real?** Sí: `subscribeToOrder` y `subscribeToStoreOrders` usan `onSnapshot`; el cliente ve
cambiar el estado sin recargar y la ferretería recibe pedidos al instante.

**¿Es seguro el `apiKey` de Firebase en la app?** Esa llave solo identifica el proyecto; la seguridad real la
dan Auth + Reglas. Los secretos reales (`serviceAccountKey.json`) están fuera de Git.

## 8. Limitaciones (decirlas tú primero suma puntos)
- **El promedio de calificaciones lo actualiza el cliente en una transacción**, restringido por reglas
  (solo puede tocar `ratingAvg/ratingCount` y sumar 1 a `ratingCount`). Lo ideal en producción es una **Cloud Function**.
- **No hay notificaciones push todavía** (FCM): no funcionan en Expo Go y requieren build propio. Hoy se usa tiempo real con listeners.
- **Fotos (Storage)** quedan para la fase 2.
- **Aprobar ferreterías** se hace desde la consola o con `setStoreStatus` (falta pantalla de admin).
- La distancia es **en línea recta**, aproximada (como pide la especificación).
- Validaciones que requieren servidor confiable (ej. recalcular totales) pasarían a **Cloud Functions** (plan Blaze).

## 9. Qué sigue
Pantallas (React Navigation) → fotos (Storage) → notificaciones (FCM + build de desarrollo) → panel admin →
**integración con Control Obra** (campos `obraId/obraName` en `orders` ya reservados; ideal usar el mismo proyecto
Firebase para compartir usuarios).
