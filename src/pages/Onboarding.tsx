import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { UserRole } from '../types/user';
import { GraduationCap, School, Loader2, User } from 'lucide-react';

export const Onboarding: React.FC = () => {
    const { user, refreshProfile } = useAuth();
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    // Initialize with existing name (from Google) or empty (for Email)
    const [displayName, setDisplayName] = useState(user?.displayName || '');

    const handleRoleSelect = async (role: UserRole) => {
        if (!user) return;
        if (!displayName.trim()) {
            alert("Please enter your name.");
            return;
        }
        setIsSubmitting(true);

        try {
            const userRef = doc(db, 'users', user.uid);
            await setDoc(userRef, {
                uid: user.uid,
                email: user.email,
                displayName: displayName.trim(), // <--- Use the input value
                photoURL: user.photoURL,
                role: role,
                createdAt: serverTimestamp()
            });

            await refreshProfile();

            if (role === 'teacher') {
                navigate('/teacher/dashboard');
            } else {
                navigate('/student/dashboard');
            }
        } catch (error) {
            console.error("Error creating profile:", error);
            alert("Failed to create profile. Please try again.");
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-md">
            <div className="max-w-4xl w-full text-center">
                <h1 className="text-4xl font-serif font-bold text-primary mb-lg">Welcome to LangLab</h1>

                {/* NAME INPUT SECTION */}
                <div className="max-w-xs mx-auto mb-xl">
                    <label className="block text-sm font-bold text-muted uppercase mb-2">What should we call you?</label>
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
                        <input
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="e.g. John D."
                            className="w-full pl-10 p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none text-center font-medium"
                            autoFocus
                        />
                    </div>
                </div>

                <p className="text-xl text-muted mb-lg">Select your role to get started:</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-xl">
                    {/* Student Card */}
                    <button
                        onClick={() => handleRoleSelect('student')}
                        disabled={isSubmitting || !displayName.trim()}
                        className="card p-2xl flex flex-col items-center hover:border-primary hover:shadow-lg transition-all group text-left disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <div className="bg-primary/10 p-xl rounded-full mb-lg group-hover:bg-primary/20 transition-colors">
                            <GraduationCap size={48} className="text-primary" />
                        </div>
                        <h2 className="text-2xl font-bold mb-sm">I am a Student</h2>
                        <p className="text-muted text-center">
                            Join classes, complete reading assignments, and track your progress.
                        </p>
                    </button>

                    {/* Teacher Card */}
                    <button
                        onClick={() => handleRoleSelect('teacher')}
                        disabled={isSubmitting || !displayName.trim()}
                        className="card p-2xl flex flex-col items-center hover:border-primary hover:shadow-lg transition-all group text-left disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <div className="bg-primary/10 p-xl rounded-full mb-lg group-hover:bg-primary/20 transition-colors">
                            <School size={48} className="text-primary" />
                        </div>
                        <h2 className="text-2xl font-bold mb-sm">I am a Teacher</h2>
                        <p className="text-muted text-center">
                            Create classes, assign readings, and monitor student performance.
                        </p>
                    </button>
                </div>

                {isSubmitting && (
                    <div className="mt-xl flex justify-center items-center gap-sm text-muted">
                        <Loader2 className="animate-spin" />
                        <span>Setting up your account...</span>
                    </div>
                )}
            </div>
        </div>
    );
};
