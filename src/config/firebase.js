import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyCYhUPezDUBdDIJIFdzvoqGRsaPZ_l3Ix0',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'ethereal-vapes.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'ethereal-vapes',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'ethereal-vapes.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '231756576360',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:231756576360:web:a9df736856eaebc5406ddd',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-H5CNBLX7VG',
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar y exportar servicios
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export default app;
