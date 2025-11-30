import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    type User,
    GoogleAuthProvider,
    signInWithPopup,
    signOut,
    onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import type { UserProfile } from '../types/user';

interface AuthContextType {
    user: User | null;
    userProfile: UserProfile | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchUserProfile = async (uid: string) => {
        try {
            const docRef = doc(db, 'users', uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setUserProfile(docSnap.data() as UserProfile);
            } else {
                setUserProfile(null);
            }
        } catch (error) {
            console.error("Error fetching user profile:", error);
            setUserProfile(null);
        }
    };

    useEffect(() => {
        let mounted = true;

        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (mounted) {
                setUser(currentUser);
                if (currentUser) {
                    await fetchUserProfile(currentUser.uid);
                } else {
                    setUserProfile(null);
                }
                setLoading(false);
            }
        });

        // Safety timeout for demo/offline mode
        const timer = setTimeout(() => {
            if (mounted && loading) {
                console.warn("Auth listener timed out (likely due to invalid config), defaulting to signed out.");
                setLoading(false);
            }
        }, 4000); // Increased timeout to account for Firestore fetch

        return () => {
            mounted = false;
            unsubscribe();
            clearTimeout(timer);
        };
    }, []);

    const signInWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
        } catch (error) {
            console.error("Error signing in with Google", error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
            setUserProfile(null);
        } catch (error) {
            console.error("Error signing out", error);
            throw error;
        }
    };

    const refreshProfile = async () => {
        if (user) {
            await fetchUserProfile(user.uid);
        }
    };

    return (
        <AuthContext.Provider value={{ user, userProfile, loading, signInWithGoogle, logout, refreshProfile }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
