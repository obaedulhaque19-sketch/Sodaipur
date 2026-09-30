import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  fbSignOut, 
  onAuthStateChanged,
  type FirebaseUser 
} from '../lib/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import type { UserProfile, UserRole } from '../types';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInEmail: (email: string, pass: string) => Promise<void>;
  signUpEmail: (email: string, pass: string, name: string, role?: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  switchDemoRole: (role: UserRole) => Promise<void>;
  updateProfileData: (updates: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync profile from Firestore or initialize default
  const syncProfile = async (uid: string, email: string, displayName?: string | null) => {
    try {
      const userRef = doc(db, 'users', uid);
      const snap = await getDoc(userRef);

      if (snap.exists()) {
        setUserProfile(snap.data() as UserProfile);
      } else {
        // Create initial profile in Firestore
        const isDefaultAdmin = email === 'admin@sodaipur.com' || email.includes('admin');
        const isDefaultOwner = email === 'seller@tts.com' || email.includes('seller');
        
        const initialProfile: UserProfile = {
          uid,
          name: displayName || email.split('@')[0] || 'User',
          email,
          role: isDefaultAdmin ? 'admin' : (isDefaultOwner ? 'owner' : 'customer'),
          createdAt: new Date().toISOString()
        };

        // Only add storeId if it is actually defined, avoiding Firestore undefined value crash
        if (isDefaultOwner) {
          initialProfile.storeId = 'store_tts_fashion';
        }

        await setDoc(userRef, initialProfile);
        setUserProfile(initialProfile);
      }
    } catch (err) {
      console.error('Profile sync failed, using fallback:', err);
      // Fallback local profile without passing any undefined fields
      const fallbackProfile: UserProfile = {
        uid,
        name: displayName || email.split('@')[0] || 'User',
        email,
        role: email.includes('admin') ? 'admin' : (email.includes('seller') ? 'owner' : 'customer'),
        createdAt: new Date().toISOString()
      };
      if (email.includes('seller')) {
        fallbackProfile.storeId = 'store_tts_fashion';
      }
      setUserProfile(fallbackProfile);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await syncProfile(user.uid, user.email || '', user.displayName);
      } else {
        // If not logged in, check if user saved demo profile or start as customer
        const demoRole = (localStorage.getItem('sodaipur_demo_role') as UserRole) || null;
        if (demoRole) {
          setupDemoProfile(demoRole);
        } else {
          setUserProfile(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const setupDemoProfile = (role: UserRole) => {
    if (role === 'admin') {
      setUserProfile({
        uid: 'demo_admin_uid',
        name: 'Super Admin (Sodaipur)',
        email: 'admin@sodaipur.com',
        role: 'admin',
        createdAt: new Date().toISOString()
      });
    } else if (role === 'owner') {
      setUserProfile({
        uid: 'owner_tts_user',
        name: 'Tariqul Islam (TTS Fashion)',
        email: 'seller@tts.com',
        role: 'owner',
        storeId: 'store_tts_fashion',
        createdAt: new Date().toISOString()
      });
    } else {
      setUserProfile({
        uid: 'demo_customer_uid',
        name: 'Arif Rahman',
        email: 'arif@gmail.com',
        role: 'customer',
        address: 'House 42, Road 7, Dhanmondi, Dhaka',
        phone: '+8801712345678',
        createdAt: new Date().toISOString()
      });
    }
  };

  const signInWithGoogle = async () => {
    try {
      const res = await signInWithPopup(auth, googleProvider);
      if (res.user) {
        localStorage.removeItem('sodaipur_demo_role');
        await syncProfile(res.user.uid, res.user.email || '', res.user.displayName);
      }
    } catch (e) {
      console.error('Google Sign In Error:', e);
      throw e;
    }
  };

  const signInEmail = async (email: string, pass: string) => {
    try {
      const res = await signInWithEmailAndPassword(auth, email, pass);
      if (res.user) {
        localStorage.removeItem('sodaipur_demo_role');
        await syncProfile(res.user.uid, res.user.email || '', res.user.displayName);
      }
    } catch (e) {
      console.error('Email Sign In Error:', e);
      throw e;
    }
  };

  const signUpEmail = async (email: string, pass: string, name: string, role: UserRole = 'customer') => {
    try {
      const res = await createUserWithEmailAndPassword(auth, email, pass);
      if (res.user) {
        localStorage.removeItem('sodaipur_demo_role');
        const newProfile: UserProfile = {
          uid: res.user.uid,
          name,
          email,
          role,
          createdAt: new Date().toISOString()
        };
        await setDoc(doc(db, 'users', res.user.uid), newProfile);
        setUserProfile(newProfile);
      }
    } catch (e) {
      console.error('Email Sign Up Error:', e);
      throw e;
    }
  };

  const logout = async () => {
    localStorage.removeItem('sodaipur_demo_role');
    try {
      await fbSignOut(auth);
    } catch (e) {
      console.warn('Sign out warning:', e);
    }
    setCurrentUser(null);
    setUserProfile(null);
  };

  const switchDemoRole = async (role: UserRole) => {
    localStorage.setItem('sodaipur_demo_role', role);
    setupDemoProfile(role);
  };

  const updateProfileData = async (updates: Partial<UserProfile>) => {
    if (!userProfile) return;
    const updated = { ...userProfile, ...updates };
    setUserProfile(updated);
    try {
      if (currentUser) {
        await updateDoc(doc(db, 'users', currentUser.uid), updates);
      }
    } catch (e) {
      console.warn('Update profile remote error:', e);
    }
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      userProfile,
      loading,
      signInWithGoogle,
      signInEmail,
      signUpEmail,
      logout,
      switchDemoRole,
      updateProfileData
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
