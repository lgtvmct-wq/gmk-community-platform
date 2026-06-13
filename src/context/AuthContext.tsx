import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  signOut, 
  sendPasswordResetEmail, 
  sendEmailVerification, 
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  setDoc
} from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../firebase';
import { UserProfile, ResidentProfile, FamilyProfile, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  resident: ResidentProfile | null;
  family: FamilyProfile | null;
  loading: boolean;
  error: string | null;
  isDemo: boolean;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  triggerEmailVerification: () => Promise<void>;
  setError: (err: string | null) => void;
  updateResidentAndFamily: (updatedResident: ResidentProfile, updatedFamily: FamilyProfile) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [resident, setResident] = useState<ResidentProfile | null>(null);
  const [family, setFamily] = useState<FamilyProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const isDemo = false;

  // Helper to fetch custom profile details from Firestore
  const fetchUserProfile = async (firebaseUser: User) => {
    try {
      const userRefPath = `users/${firebaseUser.uid}`;
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data() as UserProfile;
        setProfile({ ...userData, uid: firebaseUser.uid });

        // Load Resident Profile in sequence
        if (userData.residentRef) {
          const residentDocRef = doc(db, 'residents', userData.residentRef);
          const residentDocSnap = await getDoc(residentDocRef);
          if (residentDocSnap.exists()) {
            const resData = residentDocSnap.data() as ResidentProfile;
            setResident({ ...resData, id: userData.residentRef });

            // Load Family Details in sequence
            if (resData.familyRef) {
              const familyDocRef = doc(db, 'families', resData.familyRef);
              const familyDocSnap = await getDoc(familyDocRef);
              if (familyDocSnap.exists()) {
                const famData = familyDocSnap.data() as FamilyProfile;
                setFamily({ ...famData, id: resData.familyRef });
              }
            }
          }
        }
      } else {
        // If user logged in via external provider (Google) but database user mapping doesn't exist yet, we set a temporary active resident profile
        const tempProfile: UserProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          roles: ['resident'],
          isActive: true,
          createdAt: new Date().toISOString()
        };
        setProfile(tempProfile);
      }
    } catch (err) {
      console.warn("Could not load user data from Firestore, system might be in initial offline boot configuration.", err);
    }
  };

  useEffect(() => {
    // Subscribe to Firebase OnAuthStateChanged
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      setError(null);
      if (firebaseUser) {
        setUser(firebaseUser);
        await fetchUserProfile(firebaseUser);
      } else {
        setUser(null);
        setProfile(null);
        setResident(null);
        setFamily(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 1. Email Login
  const loginWithEmail = async (email: string, password: string) => {
    setError(null);
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setError(err.message || 'Email authentication failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 2. Google Sign-In with auto-popup
  const loginWithGoogle = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      setError(err.message || 'Google authentication failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 4. Reset Password
  const resetPassword = async (email: string) => {
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err: any) {
      setError(err.message || 'Password reset request failed');
      throw err;
    }
  };

  // 5. Trigger email verification
  const triggerEmailVerification = async () => {
    setError(null);
    if (!auth.currentUser) {
      throw new Error('No user currently authenticated.');
    }
    try {
      await sendEmailVerification(auth.currentUser);
    } catch (err: any) {
      setError(err.message || 'Failed to send verification email.');
      throw err;
    }
  };

  // 6. Sign Out
  const logout = async () => {
    setError(null);
    setLoading(true);
    try {
      localStorage.removeItem('gmk_auth_demo_active');
      localStorage.removeItem('gmk_auth_demo_user');
      await signOut(auth);
    } catch (err: any) {
      setError(err.message || 'Logout failed');
    } finally {
      setLoading(false);
    }
  };

  const updateResidentAndFamily = async (updatedResident: ResidentProfile, updatedFamily: FamilyProfile) => {
    setError(null);
    setResident(updatedResident);
    setFamily(updatedFamily);

    try {
      if (updatedResident.id) {
        const resRef = doc(db, 'residents', updatedResident.id);
        await setDoc(resRef, updatedResident, { merge: true });
      }
      if (updatedFamily.id) {
        const famRef = doc(db, 'families', updatedFamily.id);
        await setDoc(famRef, updatedFamily, { merge: true });
      }
    } catch (err: any) {
      console.error("Failed to sync profile updates to Firestore:", err);
      setError("Synchronisation with cloud database failed: " + err.message);
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      resident,
      family,
      loading,
      error,
      isDemo,
      loginWithEmail,
      loginWithGoogle,
      logout,
      resetPassword,
      triggerEmailVerification,
      setError,
      updateResidentAndFamily
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used inside an AuthProvider component');
  }
  return context;
}
