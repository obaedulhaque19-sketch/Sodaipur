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

export interface ConnectedPersona {
  type: 'customer' | 'store';
  name: string;
  avatarUrl?: string;
  email: string;
  roleLabel: string;
  storeId?: string;
}

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  persona: ConnectedPersona | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInEmail: (email: string, pass: string) => Promise<void>;
  signUpEmail: (email: string, pass: string, name: string, role?: UserRole, avatarUrl?: string) => Promise<void>;
  logout: () => Promise<void>;
  switchDemoRole: (role: UserRole) => Promise<void>;
  updateProfileData: (updates: Partial<UserProfile>) => Promise<void>;
  switchStore: (storeId: string, storeName?: string, logoUrl?: string) => Promise<void>;
  switchAccount: (accountId: 'customer' | string, storeName?: string, logoUrl?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync profile from Firestore or initialize default
  const syncProfile = async (uid: string, email: string, displayName?: string | null, photoURL?: string | null) => {
    try {
      const userRef = doc(db, 'users', uid);
      const snap = await getDoc(userRef);

      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        // If user logged in with Google and doesn't have an avatarUrl yet, save photoURL
        if (!data.avatarUrl && photoURL) {
          data.avatarUrl = photoURL;
          updateDoc(userRef, { avatarUrl: photoURL }).catch(() => {});
        }
        setUserProfile(data);
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

        if (photoURL) {
          initialProfile.avatarUrl = photoURL;
        }

        // Only add storeId if it is actually defined, avoiding Firestore undefined value crash
        if (isDefaultOwner) {
          initialProfile.storeId = 'store_tts_fashion';
          initialProfile.storeIds = ['store_tts_fashion'];
          initialProfile.storeId_1 = 'store_tts_fashion';
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
        await syncProfile(user.uid, user.email || '', user.displayName, user.photoURL);
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
        name: 'Tariqul Islam',
        email: 'seller@tts.com',
        role: 'owner',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500',
        storeId: 'store_tts_fashion',
        storeIds: ['store_tts_fashion'],
        storeId_1: 'store_tts_fashion',
        activeStoreId: 'store_tts_fashion',
        activeAccountId: 'store_tts_fashion',
        activeStoreName: 'TTS Fashion',
        activeStoreLogo: 'https://images.unsplash.com/photo-1544441893-675973e31985?w=500',
        createdAt: new Date().toISOString()
      });
    } else {
      setUserProfile({
        uid: 'demo_customer_uid',
        name: 'Arif Rahman',
        email: 'arif@gmail.com',
        role: 'customer',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500',
        address: 'House 42, Road 7, Dhanmondi, Dhaka',
        phone: '+8801712345678',
        activeAccountId: 'customer',
        activeStoreId: null,
        createdAt: new Date().toISOString()
      });
    }
  };

  const signInWithGoogle = async () => {
    try {
      const res = await signInWithPopup(auth, googleProvider);
      if (res.user) {
        localStorage.removeItem('sodaipur_demo_role');
        await syncProfile(res.user.uid, res.user.email || '', res.user.displayName, res.user.photoURL);
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
        await syncProfile(res.user.uid, res.user.email || '', res.user.displayName, res.user.photoURL);
      }
    } catch (e) {
      console.error('Email Sign In Error:', e);
      throw e;
    }
  };

  const signUpEmail = async (email: string, pass: string, name: string, role: UserRole = 'customer', avatarUrl?: string) => {
    try {
      const res = await createUserWithEmailAndPassword(auth, email, pass);
      if (res.user) {
        localStorage.removeItem('sodaipur_demo_role');
        const newProfile: UserProfile = {
          uid: res.user.uid,
          name,
          email,
          role,
          avatarUrl: avatarUrl || undefined,
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

  const switchAccount = async (accountId: 'customer' | string, storeName?: string, logoUrl?: string) => {
    if (!userProfile) return;
    if (accountId === 'customer') {
      await updateProfileData({
        activeAccountId: 'customer',
        activeStoreId: null,
        activeStoreName: undefined,
        activeStoreLogo: undefined
      });
    } else {
      await updateProfileData({
        activeAccountId: accountId,
        activeStoreId: accountId,
        storeId: accountId,
        activeStoreName: storeName || userProfile.activeStoreName,
        activeStoreLogo: logoUrl || userProfile.activeStoreLogo
      });
    }
  };

  const switchStore = async (storeId: string, storeName?: string, logoUrl?: string) => {
    await switchAccount(storeId, storeName, logoUrl);
  };

  // Connected Persona (Customer account vs Store account)
  const isStoreConnected = !!userProfile?.activeAccountId && userProfile.activeAccountId !== 'customer';
  const persona: ConnectedPersona | null = userProfile ? {
    type: isStoreConnected ? 'store' : 'customer',
    name: isStoreConnected ? (userProfile.activeStoreName || userProfile.name) : userProfile.name,
    avatarUrl: isStoreConnected ? (userProfile.activeStoreLogo || userProfile.avatarUrl) : userProfile.avatarUrl,
    email: userProfile.email,
    roleLabel: isStoreConnected ? 'Store' : 'Customer',
    storeId: isStoreConnected ? (userProfile.activeAccountId || userProfile.storeId) : undefined
  } : null;

  return (
    <AuthContext.Provider value={{
      currentUser,
      userProfile,
      persona,
      loading,
      signInWithGoogle,
      signInEmail,
      signUpEmail,
      logout,
      switchDemoRole,
      updateProfileData,
      switchStore,
      switchAccount
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
