'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  signInAnonymously,
  User as FirebaseUser 
} from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from '@/lib/firebase';
import { AppUser } from '@/types/user';

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  isFirebaseAvailable: boolean;
  signInWithGoogle: () => Promise<void>;
  signInAsGuest: () => void;
  signOut: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_GUEST_KEY = 'suji_guest_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // If Firebase Auth is configured and available
    if (isFirebaseConfigured && auth) {
      const unsubscribe = onAuthStateChanged(auth, (fbUser: FirebaseUser | null) => {
        if (fbUser) {
          setUser({
            uid: fbUser.uid,
            email: fbUser.email,
            displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Learner',
            photoURL: fbUser.photoURL,
            isAnonymous: fbUser.isAnonymous,
          });
        } else {
          // Check if there is a local guest session
          const savedGuest = localStorage.getItem(LOCAL_GUEST_KEY);
          if (savedGuest) {
            try {
              setUser(JSON.parse(savedGuest));
            } catch {
              setUser(null);
            }
          } else {
            setUser(null);
          }
        }
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      // Local Guest mode when Firebase config isn't supplied
      const savedGuest = localStorage.getItem(LOCAL_GUEST_KEY);
      if (savedGuest) {
        try {
          setUser(JSON.parse(savedGuest));
        } catch {
          setUser(null);
        }
      } else {
        // Auto-assign local guest user so learner can start immediately!
        const guestUser: AppUser = {
          uid: 'guest-user',
          email: null,
          displayName: 'Guest Scholar',
          isAnonymous: true,
        };
        localStorage.setItem(LOCAL_GUEST_KEY, JSON.stringify(guestUser));
        setUser(guestUser);
      }
      setLoading(false);
    }
  }, []);

  const signInWithGoogle = async () => {
    if (!isFirebaseConfigured || !auth || !googleProvider) {
      throw new Error('Firebase is not configured. Please supply NEXT_PUBLIC_FIREBASE_* keys in your .env.local file.');
    }
    await signInWithPopup(auth, googleProvider);
  };

  const loginWithEmail = async (email: string, pass: string) => {
    if (!isFirebaseConfigured || !auth) {
      throw new Error('Firebase is not configured. Please supply NEXT_PUBLIC_FIREBASE_* keys in your .env.local file.');
    }
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const registerWithEmail = async (email: string, pass: string) => {
    if (!isFirebaseConfigured || !auth) {
      throw new Error('Firebase is not configured. Please supply NEXT_PUBLIC_FIREBASE_* keys in your .env.local file.');
    }
    await createUserWithEmailAndPassword(auth, email, pass);
  };

  const signInAsGuest = () => {
    const guestUser: AppUser = {
      uid: 'guest-' + Math.random().toString(36).substring(2, 9),
      email: null,
      displayName: 'Guest Scholar',
      isAnonymous: true,
    };
    localStorage.setItem(LOCAL_GUEST_KEY, JSON.stringify(guestUser));
    setUser(guestUser);
  };

  const signOut = async () => {
    if (isFirebaseConfigured && auth && user && !user.isAnonymous) {
      await firebaseSignOut(auth);
    }
    localStorage.removeItem(LOCAL_GUEST_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isFirebaseAvailable: isFirebaseConfigured,
        signInWithGoogle,
        signInAsGuest,
        signOut,
        loginWithEmail,
        registerWithEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
