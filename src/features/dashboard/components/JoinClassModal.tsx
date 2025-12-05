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
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent dark overlay
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            backdropFilter: 'blur(2px)'
        }}>
            <div className="card" style={{
                width: '100%',
                maxWidth: '480px',
                padding: '2rem',
                position: 'relative',
                animation: 'fade-in 0.2s ease-out'
            }}>
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '1rem',
                        right: '1rem',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--color-text-muted)'
                    }}
                >
                    <X size={20} />
                </button>

                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '1.5rem', marginTop: 0 }}>
                    Join a Class
                </h2>

                {success ? (
                    <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                        <div style={{ width: '64px', height: '64px', backgroundColor: '#ecfdf5', color: '#10b981', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                            <CheckCircle size={32} />
                        </div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#10b981', margin: '0 0 0.5rem 0' }}>Successfully Joined!</h3>
                        <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>Redirecting you to the dashboard...</p>
                    </div>
                ) : (
                    <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                                Class Code
                            </label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="text"
                                    value={joinCode}
                                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                    placeholder="e.g. X7K9P2"
                                    maxLength={6}
                                    autoFocus
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem 1rem 0.75rem 2.5rem',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: 'var(--radius-md)',
                                        fontSize: '1.2rem',
                                        fontFamily: 'monospace',
                                        letterSpacing: '0.1em',
                                        textTransform: 'uppercase',
                                        outline: 'none',
                                        boxSizing: 'border-box'
                                    }}
                                />
                                <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                            </div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
                                Ask your teacher for the 6-character join code.
                            </p>
                        </div>

                        {error && (
                            <div style={{ padding: '0.75rem', backgroundColor: '#fef2f2', color: 'var(--color-error)', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid #fee2e2' }}>
                                <AlertCircle size={16} />
                                {error}
                            </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                            <button
                                type="button"
                                onClick={onClose}
                                className="btn btn-ghost"
                                disabled={isSubmitting}
                                style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={isSubmitting || joinCode.length < 6}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: (isSubmitting || joinCode.length < 6) ? 0.7 : 1 }}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
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
