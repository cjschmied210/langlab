import React, { useState } from 'react';
import { X, Loader2, Search, CheckCircle, AlertCircle } from 'lucide-react';
import { collection, query, where, getDocs, updateDoc, doc, arrayUnion } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useAuth } from '../../../contexts/AuthContext';

interface JoinClassModalProps {
    onClose: () => void;
    onClassJoined: () => void;
}

export const JoinClassModal: React.FC<JoinClassModalProps> = ({ onClose, onClassJoined }) => {
    const { user } = useAuth();
    const [joinCode, setJoinCode] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !joinCode.trim()) return;

        setIsSubmitting(true);
        setError(null);

        try {
            // 1. Find the class with this code
            const q = query(collection(db, 'classes'), where('joinCode', '==', joinCode.toUpperCase().trim()));
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                setError("Invalid join code. Please check and try again.");
                setIsSubmitting(false);
                return;
            }

            const classDoc = snapshot.docs[0];
            const classData = classDoc.data();

            // 2. Check if already enrolled
            if (classData.studentIds && classData.studentIds.includes(user.uid)) {
                setError("You are already enrolled in this class.");
                setIsSubmitting(false);
                return;
            }

            // 3. Add student to the class
            const classRef = doc(db, 'classes', classDoc.id);
            await updateDoc(classRef, {
                studentIds: arrayUnion(user.uid)
            });

            setSuccess(true);
            setTimeout(() => {
                onClassJoined();
                onClose();
            }, 1500);

        } catch (err) {
            console.error("Error joining class:", err);
            setError("Failed to join class. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-md">
            <div className="card max-w-md w-full p-xl relative animate-in fade-in zoom-in duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-md right-md text-muted hover:text-primary transition-colors"
                >
                    <X size={20} />
                </button>

                <h2 className="text-2xl font-bold text-primary mb-lg">Join a Class</h2>

                {success ? (
                    <div className="text-center py-lg">
                        <div className="w-16 h-16 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto mb-md">
                            <CheckCircle size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-success mb-sm">Successfully Joined!</h3>
                        <p className="text-muted">Redirecting you to the dashboard...</p>
                    </div>
                ) : (
                    <form onSubmit={handleJoin} className="flex flex-col gap-md">
                        <div>
                            <label className="block text-sm font-semibold text-muted mb-xs">Class Code</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={joinCode}
                                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                    placeholder="e.g. X7K9P2"
                                    className="w-full p-sm pl-xl border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono tracking-wider uppercase"
                                    maxLength={6}
                                    autoFocus
                                    required
                                />
                                <Search size={18} className="absolute left-sm top-1/2 -translate-y-1/2 text-muted" />
                            </div>
                            <p className="text-xs text-muted mt-xs">Ask your teacher for the 6-character join code.</p>
                        </div>

                        {error && (
                            <div className="p-sm bg-error/10 text-error rounded-md flex items-center gap-sm text-sm">
                                <AlertCircle size={16} />
                                {error}
                            </div>
                        )}

                        <div className="flex justify-end gap-sm mt-md">
                            <button type="button" onClick={onClose} className="btn btn-ghost" disabled={isSubmitting}>
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-primary" disabled={isSubmitting || joinCode.length < 6}>
                                {isSubmitting ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin mr-sm" />
                                        Joining...
                                    </>
                                ) : (
                                    'Join Class'
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};
