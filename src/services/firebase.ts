import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getDatabase, ref, get } from 'firebase/database';
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

// Test connectivity to Firestore & Realtime Database
export async function testFirebaseConnection(): Promise<{ firestore: boolean; rtdb: boolean; message: string }> {
  let firestoreOk = false;
  let rtdbOk = false;
  const messages: string[] = [];

  // Check Firestore
  try {
    await getDocFromServer(doc(db, 'system', 'ping'));
    firestoreOk = true;
    messages.push('Firestore: Đã kết nối');
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    if (errorMsg.includes('permission-denied') || errorMsg.includes('not-found') || errorMsg.includes('Missing or insufficient permissions')) {
      // Server responded with permission check, connection is live!
      firestoreOk = true;
      messages.push('Firestore: Hoạt động (Có phản hồi)');
    } else {
      messages.push(`Firestore: ${errorMsg}`);
    }
  }

  // Check RTDB
  try {
    await get(ref(rtdb, '.info/connected'));
    rtdbOk = true;
    messages.push('Realtime Database: Đã kết nối');
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    messages.push(`RTDB: ${errorMsg}`);
  }

  return {
    firestore: firestoreOk,
    rtdb: rtdbOk,
    message: messages.join(' | ')
  };
}
