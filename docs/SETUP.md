# ObraGo — Guía de instalación paso a paso (Windows)

## 1. Crear el proyecto Expo (una sola vez)

En PowerShell, en la carpeta donde guardas tus proyectos:

```powershell
npx create-expo-app@latest obrago --template blank-typescript
cd obrago
```

Instalar dependencias:

```powershell
npx expo install react-native-screens react-native-safe-area-context @react-native-async-storage/async-storage expo-location react-native-web react-dom @expo/metro-runtime
npm install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs
npm install firebase
npm install -D firebase-admin tsx @types/node
```

Scripts útiles:

```powershell
npm pkg set scripts.seed="tsx scripts/seed.ts"
npm pkg set scripts.demo="tsx --env-file=.env scripts/demo.ts"
npm pkg set scripts.typecheck="tsc --noEmit"
```

## 2. Copiar los archivos de este paquete

Descomprime `obrago-backend.zip` **encima** de la carpeta `obrago` (respeta las carpetas: `src/`, `scripts/`, `docs/`, y los archivos `firestore.rules`, etc.).

Agrega esto al final de tu `.gitignore` (¡importante, son secretos!):

```
.env
serviceAccountKey.json
```

## 3. Crear el proyecto en Firebase

1. Entra a https://console.firebase.google.com → **Agregar proyecto** → nombre `obrago`.
2. **Compilación → Authentication → Comenzar → Correo electrónico/contraseña → Habilitar.**
3. **Compilación → Firestore Database → Crear base de datos →** modo **producción** → ubicación `southamerica-east1` (São Paulo) o `us-east1`.
4. **Configuración del proyecto (⚙) → Tus apps → icono web `</>` →** registra la app → copia el `firebaseConfig`.
5. Copia `.env.example` a `.env` y pega los valores:

```
EXPO_PUBLIC_FIREBASE_API_KEY=AIza...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=obrago-xxxx.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=obrago-xxxx
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=obrago-xxxx.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123:web:abc
```

> **Storage y FCM:** hoy Firebase suele exigir plan de pago (Blaze) para activar Storage en proyectos nuevos, y las
> notificaciones push no funcionan dentro de Expo Go. Por eso **no se usan hoy**: quedan para la fase 2 (fotos de
> productos y notificaciones). Verifica el requisito vigente en la consola.

## 4. Publicar las reglas de seguridad

**Opción fácil (recomendada para mañana):**
Firebase Console → Firestore Database → pestaña **Reglas** → borra todo, pega el contenido de `firestore.rules` → **Publicar**.

**Opción por consola de comandos:**
```powershell
npx firebase-tools login
npx firebase-tools use --add          # elige tu proyecto
npx firebase-tools deploy --only firestore:rules,firestore:indexes
```
Los índices (`firestore.indexes.json`) son necesarios para las consultas con orden (historial de pedidos y reseñas).
Si prefieres crearlos a mano: la primera vez que una consulta falle, el error trae un **enlace** que crea el índice con un clic.

## 5. Llenar la base de datos con datos de prueba

1. Console → ⚙ **Configuración del proyecto → Cuentas de servicio → Generar nueva clave privada.**
2. Guarda el archivo como `serviceAccountKey.json` en la raíz del proyecto (**no lo subas a GitHub**).
3. Ejecuta:

```powershell
npm run seed
```

Crea: 1 admin, 1 cliente, 3 ferreterías aprobadas, 18 productos en el catálogo y los precios de cada ferretería.
Contraseña de todos: `ObraGo123!` — usuarios: `admin@`, `cliente@`, `tienda1@`, `tienda2@`, `tienda3@` + `obrago.test`.

## 6. Probar el backend (sin pantallas)

```powershell
npm run demo
```

Corre el flujo completo: login → búsqueda → pedido → intentos de trampa bloqueados → ferretería atiende → calificación.

## 7. Probar la app

```powershell
npx expo start            # escanea el QR con Expo Go (Android)
npx expo start --web      # versión web en el navegador
```

## Android, iOS y web: ¿una o varias versiones?

**Un solo código** para las tres. React Native + Expo compila a Android e iOS, y `react-native-web` a navegador.
Para probar en iPhone también sirve Expo Go. Para publicar en tiendas más adelante se usa EAS Build
(Google Play: pago único de ~25 USD; App Store: ~99 USD/año y requiere cuenta de Apple Developer).
