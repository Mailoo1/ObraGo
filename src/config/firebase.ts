/**
 * Conexion con Firebase (se ejecuta una sola vez al iniciar la app).
 * Funciona en Android, iOS, Web y tambien en Node (scripts de prueba).
 * Las llaves vienen del archivo .env (variables EXPO_PUBLIC_*).
 */
import { getApp, getApps, initializeApp } from 'firebase/app';
import { Auth, getAuth, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// En celular (React Native) la sesion se guarda en AsyncStorage para que
// el usuario no tenga que iniciar sesion cada vez que abre la app.
// En web y en Node se usa la persistencia por defecto.
const isReactNative = (globalThis as any).navigator?.product === 'ReactNative';

let auth: Auth;
if (isReactNative) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { getReactNativePersistence } = require('firebase/auth');
  try {
    auth = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
  } catch {
    // Con hot-reload ya puede estar inicializado
    auth = getAuth(app);
  }
} else {
  auth = getAuth(app);
}

const db = getFirestore(app);

export { app, auth, db };
