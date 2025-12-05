import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Tenta pegar do import.meta.env (Vite) ou process.env (Fallback)
// Using (import.meta as any) to avoid TypeScript error "Property 'env' does not exist on type 'ImportMeta'"
const metaEnv = (import.meta as any).env || {};

const apiKey = metaEnv.VITE_FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY;
const authDomain = metaEnv.VITE_FIREBASE_AUTH_DOMAIN || process.env.VITE_FIREBASE_AUTH_DOMAIN;
const projectId = metaEnv.VITE_FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
const storageBucket = metaEnv.VITE_FIREBASE_STORAGE_BUCKET || process.env.VITE_FIREBASE_STORAGE_BUCKET;
const messagingSenderId = metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env.VITE_FIREBASE_MESSAGING_SENDER_ID;
const appId = metaEnv.VITE_FIREBASE_APP_ID || process.env.VITE_FIREBASE_APP_ID;

const firebaseConfig = {
  apiKey,
  authDomain,
  projectId,
  storageBucket,
  messagingSenderId,
  appId
};

// Initialize Firebase only if keys are present (avoids crash during build/dev without keys)
const app = apiKey ? initializeApp(firebaseConfig) : null;
export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;

export const isFirebaseConfigured = !!app;