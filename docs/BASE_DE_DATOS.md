# ObraGo — Base de datos (Cloud Firestore, NoSQL)

## Mapa de colecciones

```
users/{uid}                      Perfil + ROL (client | store | admin)
stores/{uid del dueño}           Ferretería (1 por dueño). El id = uid del dueño
catalog/{slug}                   Catálogo maestro de materiales ("cemento-argos-gris-50-kg")
storeProducts/{storeId}_{slug}   Producto que vende una ferretería + su PRECIO
orders/{orderId}                 Pedido (con foto de precios y historial de estados)
reviews/{orderId}                Reseña (id = id del pedido → máximo 1 por pedido)
```

## Relaciones

```
 users ──(rol=store, mismo uid)──▶ stores
                                     │ 1
                                     │
                                     ▼ N
 catalog ──(1)──▶ storeProducts (N) ◀── (cada ferretería publica su precio)
    "Cemento Argos" existe UNA vez; 3 ferreterías = 3 documentos storeProducts
    → por eso se pueden COMPARAR precios

 users(client) ──▶ orders ◀── stores          (un pedido = 1 cliente + 1 ferretería)
 orders ──(completed)──▶ reviews ──▶ actualiza stores.ratingAvg / ratingCount
```

## Campos por colección

### users
| Campo | Tipo | Nota |
|---|---|---|
| uid | string | = id de Firebase Auth |
| role | `client` \| `store` \| `admin` | `admin` solo se asigna a mano |
| name, email, phone | string | |
| createdAt | timestamp | |

### stores
| Campo | Tipo | Nota |
|---|---|---|
| ownerId | string | = id del documento |
| name, description, address, city, phone | string | |
| location | `{latitude, longitude}` | para calcular distancia |
| offersDelivery / offersPickup | boolean | domicilio / recogida |
| isOpen | boolean | si está cerrada no aparece en búsquedas |
| status | `pending` \| `approved` \| `suspended` | el admin aprueba |
| ratingAvg, ratingCount | number | se actualizan al calificar |

### catalog
`name`, `category`, `unit`, `keywords[]` (prefijos para búsqueda), `createdAt`

### storeProducts
`storeId`, `catalogId`, `name`, `category`, `unit`, **`price`**, `active`, `keywords[]`, `updatedAt`
> **Sin inventario** (decisión del MVP): solo existe el campo `active` ("hoy lo vendo / no lo vendo"), no cantidades.

### orders
| Campo | Nota |
|---|---|
| clientId / clientName / clientPhone | quién pide |
| storeId / storeName | a quién se le pide (SOLO esa ferretería lo recibe) |
| items[] | `{catalogId, name, unit, unitPrice, quantity, lineTotal}` — **foto** del precio al momento del pedido |
| subtotal | suma de líneas |
| deliveryMethod | `delivery` \| `pickup` |
| deliveryAddress, notes | opcionales |
| status | `pending → accepted → preparing → ready_for_pickup / dispatched → completed` (o `rejected`) |
| statusHistory[] | `{status, at, by}` — trazabilidad |
| rejectionReason | motivo si fue rechazado |
| obraId, obraName | **reservados para integrar con Control Obra** (hoy null) |

### reviews
`orderId`, `storeId`, `clientId`, `clientName`, `rating (1-5)`, `comment`, `createdAt`

## Decisiones de diseño (para defender)

1. **NoSQL desnormalizado:** el pedido guarda nombre y precio *copiados* (no referencias). Si mañana la ferretería cambia el precio, los pedidos viejos no se alteran. En NoSQL se diseña según las consultas, no según normalización.
2. **Catálogo maestro + precio por ferretería:** evita "Cemento Argos", "cemento argos" y "Cemento ARGOS" como tres productos distintos y hace posible la comparación.
3. **Búsqueda por prefijos (`keywords`):** Firestore no tiene `LIKE`; guardamos los prefijos de cada palabra (`ce, cem, ceme…`) y buscamos con `array-contains`. Funciona mientras el usuario escribe.
4. **ID determinista** (`{storeId}_{catalogId}`, `reviews/{orderId}`): impide duplicados sin necesidad de consultas adicionales.
5. **Un solo proyecto Firebase para ObraGo y Control Obra** (a futuro): mismos usuarios (Auth), colecciones separadas por app, y `orders.obraId` ya reservado para enlazar un pedido con una obra.
