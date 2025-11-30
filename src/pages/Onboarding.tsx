import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { UserRole } from '../types/user';
import { GraduationCap, School, Loader2 } from 'lucide-react';

export const Onboarding: React.FC = () => {
    const { user, refreshProfile } = useAuth();
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleRoleSelect = async (role: UserRole) => {
        if (!user) return;
        setIsSubmitting(true);

        try {
            const userRef = doc(db, 'users', user.uid);
            await setDoc(userRef, {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName || 'User',
                photoURL: user.photoURL,
                role: role,
                createdAt: serverTimestamp()
            });

            await refreshProfile();

            // Redirect based on role
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
                <p className="text-xl text-muted mb-2xl">Tell us how you'll be using the platform.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-xl">
                    {/* Student Card */}
                    <button
                        onClick={() => handleRoleSelect('student')}
                        disabled={isSubmitting}
                        className="card p-2xl flex flex-col items-center hover:border-primary hover:shadow-lg transition-all group text-left"
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
                        disabled={isSubmitting}
                        className="card p-2xl flex flex-col items-center hover:border-primary hover:shadow-lg transition-all group text-left"
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
