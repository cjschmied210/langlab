import React, { useState } from 'react';
import { X, Loader2, Copy, Check } from 'lucide-react';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useAuth } from '../../../contexts/AuthContext';

interface CreateClassModalProps {
    onClose: () => void;
    onClassCreated: () => void;
}

export const CreateClassModal: React.FC<CreateClassModalProps> = ({ onClose, onClassCreated }) => {
    const { user } = useAuth();
    const [className, setClassName] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [createdCode, setCreatedCode] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const generateJoinCode = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed ambiguous chars like I, 1, O, 0
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !className.trim()) return;

        setIsSubmitting(true);

        try {
            // Generate a unique code (simple check)
            let code = generateJoinCode();
            let isUnique = false;

            // Safety check loop (max 3 tries)
            for (let i = 0; i < 3; i++) {
                const q = query(collection(db, 'classes'), where('joinCode', '==', code));
                const snapshot = await getDocs(q);
                if (snapshot.empty) {
                    isUnique = true;
                    break;
                }
                code = generateJoinCode();
            }

            if (!isUnique) {
                throw new Error("Failed to generate a unique code. Please try again.");
            }

            await addDoc(collection(db, 'classes'), {
                name: className,
                description: description,
                teacherId: user.uid,
                teacherName: user.displayName,
                joinCode: code,
                studentIds: [],
                createdAt: serverTimestamp()
            });

            setCreatedCode(code);
            onClassCreated();
        } catch (error) {
            console.error("Error creating class:", error);
            alert("Failed to create class. Please try again.");
            setIsSubmitting(false);
        }
    };

    const copyToClipboard = () => {
        if (createdCode) {
            navigator.clipboard.writeText(createdCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (createdCode) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-md">
                <div className="card max-w-md w-full p-xl animate-in fade-in zoom-in duration-200">
                    <div className="text-center mb-lg">
                        <div className="w-16 h-16 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto mb-md">
                            <Check size={32} />
                        </div>
                        <h2 className="text-2xl font-bold text-primary">Class Created!</h2>
                        <p className="text-muted">Share this code with your students so they can join.</p>
                    </div>

                    <div className="bg-background p-lg rounded-lg border-2 border-dashed border-primary/30 flex items-center justify-between mb-xl">
                        <span className="text-3xl font-mono font-bold tracking-wider text-primary">{createdCode}</span>
                        <button onClick={copyToClipboard} className="btn btn-ghost p-sm hover:bg-primary/10 rounded-md transition-colors">
                            {copied ? <Check size={20} className="text-success" /> : <Copy size={20} className="text-primary" />}
                        </button>
                    </div>

                    <button onClick={onClose} className="btn btn-primary w-full">
                        Done
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-md">
            <div className="card max-w-md w-full p-xl relative animate-in fade-in zoom-in duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-md right-md text-muted hover:text-primary transition-colors"
                >
                    <X size={20} />
                </button>

                <h2 className="text-2xl font-bold text-primary mb-lg">Create New Class</h2>

                <form onSubmit={handleSubmit} className="flex flex-col gap-md">
                    <div>
                        <label className="block text-sm font-semibold text-muted mb-xs">Class Name</label>
                        <input
                            type="text"
                            value={className}
                            onChange={(e) => setClassName(e.target.value)}
                            placeholder="e.g. AP Lang Period 1"
                            className="w-full p-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                            autoFocus
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-muted mb-xs">Description (Optional)</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Fall 2025 Semester..."
                            className="w-full p-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none h-24"
                        />
                    </div>

                    <div className="flex justify-end gap-sm mt-md">
                        <button type="button" onClick={onClose} className="btn btn-ghost" disabled={isSubmitting}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={isSubmitting || !className.trim()}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 size={18} className="animate-spin mr-sm" />
                                    Creating...
                                </>
                            ) : (
                                'Create Class'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
