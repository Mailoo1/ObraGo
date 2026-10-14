# ObraGo

Plataforma móvil (Android / iOS / Web) de abastecimiento para construcción: busca un material, compara
ferreterías (precio, distancia, calificación) y envía el pedido a la elegida.

**Stack:** React Native · Expo · TypeScript · Firebase (Auth, Firestore) · React Navigation · Git/GitHub

## Estructura

```
obrago/
├─ docs/
│  ├─ SETUP.md               Instalación paso a paso
│  ├─ BASE_DE_DATOS.md       Diseño de la base de datos
│  └─ GUIA_SUSTENTACION.md   Guion para exponer el backend
├─ scripts/
│  ├─ seedData.ts            Datos de prueba
│  ├─ seed.ts                Llena Firestore (npm run seed)
│  └─ demo.ts                Demo del flujo completo (npm run demo)
├─ src/
│  ├─ config/firebase.ts     Conexión a Firebase
│  ├─ constants/             Estados del pedido, categorías
│  ├─ types/                 Modelos TypeScript
│  ├─ utils/                 Texto/búsqueda y distancia
│  ├─ services/              ← BACKEND (lógica de negocio)
│  ├─ context/AuthContext    Sesión y rol del usuario
│  ├─ navigation/ screens/ components/ hooks/   ← UI (siguiente fase)
├─ firestore.rules           Reglas de seguridad (servidor)
├─ firestore.indexes.json    Índices de consultas
└─ .env.example              Variables de Firebase
```

## Inicio rápido
Ver `docs/SETUP.md`. Resumen: crear proyecto Firebase → `.env` → publicar `firestore.rules` → `npm run seed` → `npm run demo`.

## Roles
`client` (obra/contratista) · `store` (ferretería) · `admin`

## Fuera del MVP
Inventario en tiempo real, domiciliarios propios, IA, pagos, ERP, crédito, integración con Control Obra (campos `obraId/obraName` ya reservados).
