// Inicialización del cliente Firebase.
// La config se lee de variables NEXT_PUBLIC_* (ver .env.local.example).
// Si no hay config, isConfigured() === false y la app corre en modo DEMO.
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, signInAnonymously, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getFunctions, type Functions } from 'firebase/functions';

// Config del proyecto Firebase "servicios-logidma".
// En una app web la config del cliente es pública (se incluye en el bundle),
// por eso se deja embebida como valor por defecto, con override vía .env.local.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyDQVgqYbKMsIiWDTtTlE2Ks0x3tUkzYMi4',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'servicios-logidma.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'servicios-logidma',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'servicios-logidma.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '21130914024',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:21130914024:web:4ab6236d2213480bb7015d',
};

const FUNCTIONS_REGION = process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_REGION || 'us-central1';

export function isConfigured(): boolean {
  // NEXT_PUBLIC_DEMO=1 fuerza el modo demo (datos de ejemplo, sin backend).
  if (process.env.NEXT_PUBLIC_DEMO === '1') return false;
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
}

let app: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;
let functionsInstance: Functions | null = null;

function getAppInstance(): FirebaseApp {
  if (!app) {
    app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig as any);
  }
  return app;
}

export function getAuthInstance(): Auth {
  if (!authInstance) authInstance = getAuth(getAppInstance());
  return authInstance;
}

export function getDb(): Firestore {
  if (!dbInstance) dbInstance = getFirestore(getAppInstance());
  return dbInstance;
}

export function getFns(): Functions {
  if (!functionsInstance) functionsInstance = getFunctions(getAppInstance(), FUNCTIONS_REGION);
  return functionsInstance;
}

// Sesión base anónima: da un uid para que las Cloud Functions puedan
// identificar el dispositivo. El login "real" es por PIN (ver lib/pin.ts).
export async function ensureAnonSession(): Promise<void> {
  if (!isConfigured()) return;
  const auth = getAuthInstance();
  if (auth.currentUser) return;
  try {
    await signInAnonymously(auth);
  } catch (e) {
    console.warn('No se pudo iniciar sesión anónima:', e);
  }
}
