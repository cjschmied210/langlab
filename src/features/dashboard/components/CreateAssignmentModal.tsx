import React, { useState } from 'react';
import { X, Loader2, Calendar } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

interface CreateAssignmentModalProps {
    classId: string;
    onClose: () => void;
    onAssignmentCreated: () => void;
}

export const CreateAssignmentModal: React.FC<CreateAssignmentModalProps> = ({ classId, onClose, onAssignmentCreated }) => {
    const [title, setTitle] = useState('');
    const [author, setAuthor] = useState(''); // <--- New Author State
    const [content, setContent] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !content.trim() || !dueDate) return;

        setIsSubmitting(true);

        try {
            await addDoc(collection(db, 'assignments'), {
                classId,
                title,
                author: author.trim() || "Unknown Author", // <--- Saving the Author
                content,
                dueDate: new Date(dueDate),
                status: 'active',
                createdAt: serverTimestamp()
            });

            onAssignmentCreated();
            onClose();
        } catch (error) {
            console.error("Error creating assignment:", error);
            alert("Failed to create assignment. Please try again.");
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-md">
            <div className="card max-w-2xl w-full p-xl relative animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                <button
                    onClick={onClose}
                    className="absolute top-md right-md text-muted hover:text-primary transition-colors"
                >
                    <X size={20} />
                </button>

                <h2 className="text-2xl font-bold text-primary mb-lg">Create New Assignment</h2>

                <form onSubmit={handleSubmit} className="flex flex-col gap-md flex-1 overflow-hidden">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                        <div>
                            <label className="block text-sm font-semibold text-muted mb-xs">Assignment Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g. JFK Inaugural Address"
                                className="w-full p-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                                required
                            />
                        </div>

                        {/* NEW AUTHOR INPUT FIELD */}
                        <div>
                            <label className="block text-sm font-semibold text-muted mb-xs">Author / Speaker</label>
                            <input
                                type="text"
                                value={author}
                                onChange={(e) => setAuthor(e.target.value)}
                                placeholder="e.g. John F. Kennedy"
                                className="w-full p-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-muted mb-xs">Due Date</label>
                            <div className="relative">
                                <input
                                    type="date"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    className="w-full p-sm pl-xl border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    required
                                />
                                <Calendar size={18} className="absolute left-sm top-1/2 -translate-y-1/2 text-muted" />
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col min-h-0">
                        <label className="block text-sm font-semibold text-muted mb-xs">Reading Text</label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Paste the text for students to analyze here..."
                            className="w-full p-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none flex-1 font-serif leading-relaxed"
                            style={{ minHeight: '200px' }}
                            required
                        />
                    </div>

                    <div className="flex justify-end gap-sm mt-md pt-md border-t border-border">
                        <button type="button" onClick={onClose} className="btn btn-ghost" disabled={isSubmitting}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 size={18} className="animate-spin mr-sm" />
                                    Creating...
                                </>
                            ) : (
                                'Create Assignment'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
