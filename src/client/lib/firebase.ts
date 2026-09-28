import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, type User } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCDZA6VO-BPkXJQEFNGOnjp6hN0YzNDdRk",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "dark-a89d7.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "dark-a89d7",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "dark-a89d7.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "877632433872",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:877632433872:web:68a12987c418478999f8d5",
};

// Initialize Firebase once
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const storage = getStorage(app);

// Configure Google provider prompts
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

export interface GoogleAuthResult {
  user: User;
  idToken: string;
}

/**
 * Initiates Google OAuth Popup via Firebase Auth
 */
export async function signInWithGooglePopup(): Promise<GoogleAuthResult> {
  const result = await signInWithPopup(auth, googleProvider);
  const idToken = await result.user.getIdToken();
  return {
    user: result.user,
    idToken,
  };
}

/**
 * Sign out from Firebase Auth
 */
export async function logoutFirebase(): Promise<void> {
  await signOut(auth);
}
