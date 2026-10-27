import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';

export const firebaseConfig = {
  apiKey: "AIzaSyCELRyno2Oa7j-ZaPL9A-kRLnsqGv9bqbc",
  authDomain: "newmusic-5625b.firebaseapp.com",
  databaseURL: "https://newmusic-5625b-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "newmusic-5625b",
  storageBucket: "newmusic-5625b.firebasestorage.app",
  messagingSenderId: "148356016124",
  appId: "1:148356016124:web:16f827c0c7fc1261e3f479"
};

// Initialize Firebase safely
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
export const rtdb = getDatabase(app);
export const auth = getAuth(app);
