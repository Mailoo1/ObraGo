/**
 * AUTENTICACION Y PERFIL DE USUARIO
 * - Firebase Authentication guarda email + contrasena (seguro, no lo manejamos nosotros).
 * - Firestore (users/{uid}) guarda los datos del perfil y el ROL.
 */
import {
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { UserProfile, UserRole } from '../types';

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
  phone: string;
  role: Exclude<UserRole, 'admin'>; // 'admin' solo se asigna manualmente
}

export async function registerUser(input: RegisterInput): Promise<UserProfile> {
  const cred = await createUserWithEmailAndPassword(auth, input.email.trim(), input.password);
  await updateProfile(cred.user, { displayName: input.name });

  await setDoc(doc(db, 'users', cred.user.uid), {
    uid: cred.user.uid,
    role: input.role,
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    phone: input.phone.trim(),
    createdAt: serverTimestamp(),
  });

  return (await getUserProfile(cred.user.uid)) as UserProfile;
}

export async function login(email: string, password: string): Promise<UserProfile> {
  const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
  const profile = await getUserProfile(cred.user.uid);
  if (!profile) throw new Error('El usuario no tiene perfil en la base de datos.');
  return profile;
}

export function logout(): Promise<void> {
  return signOut(auth);
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? ({ ...snap.data(), uid: snap.id } as UserProfile) : null;
}

/** El usuario puede editar nombre y telefono (no su rol: lo bloquean las reglas). */
export async function updateUserProfile(uid: string, data: Partial<Pick<UserProfile, 'name' | 'phone'>>) {
  await updateDoc(doc(db, 'users', uid), data);
}

/** Escucha cambios de sesion (login / logout). Devuelve la funcion para dejar de escuchar. */
export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}
