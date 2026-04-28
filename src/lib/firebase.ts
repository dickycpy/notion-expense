import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    throw error;
  }
};

export const logout = () => signOut(auth);

export interface UserConfig {
  notionApiKey: string;
  notionDatabaseId: string;
  updatedAt: any;
}

export const getUserConfig = async (uid: string): Promise<UserConfig | null> => {
  const docRef = doc(db, 'users', uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data() as UserConfig;
  }
  return null;
};

export const saveUserConfig = async (uid: string, config: Omit<UserConfig, 'updatedAt'>) => {
  const docRef = doc(db, 'users', uid);
  await setDoc(docRef, {
    ...config,
    updatedAt: serverTimestamp(),
  });
};
