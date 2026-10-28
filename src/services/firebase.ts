import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDocFromServer, setDoc } from 'firebase/firestore';
import { getDatabase, ref, get, set } from 'firebase/database';
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

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firebase Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test connectivity and actual write/read permissions to Firestore & Realtime Database
export async function testFirebaseConnection(): Promise<{
  firestore: boolean;
  rtdb: boolean;
  rtdbWrite: boolean;
  message: string;
  details: string[];
}> {
  let firestoreOk = false;
  let rtdbOk = false;
  let rtdbWriteOk = false;
  const details: string[] = [];

  // 1. Check RTDB read & write
  try {
    const testRef = ref(rtdb, '_system_ping');
    await set(testRef, {
      ping: true,
      timestamp: Date.now(),
      tester: 'XuanKenMusicApp'
    });
    rtdbOk = true;
    rtdbWriteOk = true;
    details.push('Realtime Database: Cho phép ghi & đọc dữ liệu (Rules OK)');
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    if (errorMsg.toLowerCase().includes('permission_denied') || errorMsg.toLowerCase().includes('permission denied')) {
      rtdbOk = false;
      rtdbWriteOk = false;
      details.push('Realtime Database: ⚠️ LỖI PERMISSION_DENIED - Tab Quy tắc (Rules) trên Firebase Console đang CHẶN GHI!');
    } else {
      details.push(`Realtime Database: ${errorMsg}`);
    }
  }

  // 2. Check Firestore read & write
  try {
    const testDoc = doc(db, 'system', 'connection_test');
    await setDoc(testDoc, { ping: true, timestamp: Date.now() }, { merge: true });
    firestoreOk = true;
    details.push('Cloud Firestore: Cho phép ghi & đọc dữ liệu');
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    if (errorMsg.toLowerCase().includes('permission-denied') || errorMsg.toLowerCase().includes('missing or insufficient permissions')) {
      details.push('Cloud Firestore: ⚠️ LỖI PERMISSION_DENIED (Quy tắc firestore.rules đang chặn ghi)');
    } else {
      details.push(`Cloud Firestore: ${errorMsg}`);
    }
  }

  return {
    firestore: firestoreOk,
    rtdb: rtdbOk,
    rtdbWrite: rtdbWriteOk,
    message: details.join(' • '),
    details,
  };
}
