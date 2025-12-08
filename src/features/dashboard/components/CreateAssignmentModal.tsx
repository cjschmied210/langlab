import React, { useState } from 'react';
import { X, Loader2, Calendar, Wand2 } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

interface CreateAssignmentModalProps {
    classId: string;
    onClose: () => void;
    onAssignmentCreated: () => void;
}

export const CreateAssignmentModal: React.FC<CreateAssignmentModalProps> = ({ classId, onClose, onAssignmentCreated }) => {
    const [title, setTitle] = useState('');
    const [author, setAuthor] = useState('');
    const [content, setContent] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- MAGIC FORMATTER ---
    const handleAutoFormat = () => {
        if (!content) return;
        let formatted = content.replace(/\r\n/g, '\n'); // Normalize Windows line endings
        formatted = formatted.replace(/\n\s*\n/g, '\n'); // Collapse multiple blanks to single
        formatted = formatted.replace(/\n/g, '\n\n'); // Expand single to double (visual paragraphs)
        setContent(formatted);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !content.trim() || !dueDate) return;

        setIsSubmitting(true);

        try {
            await addDoc(collection(db, 'assignments'), {
                classId,
                title,
                author: author.trim() || "Unknown Author",
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
                                placeholder="e.g. The Braindead Megaphone"
                                className="w-full p-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                                required
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

                        {/* Author Input */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-muted mb-xs">Author / Speaker</label>
                            <input
                                type="text"
                                value={author}
                                onChange={(e) => setAuthor(e.target.value)}
                                placeholder="e.g. George Saunders"
                                className="w-full p-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col min-h-0">
                        <div className="flex justify-between items-end mb-xs">
                            <label className="block text-sm font-semibold text-muted">Reading Text</label>

                            {/* MAGIC BUTTON */}
                            <button
                                type="button"
                                onClick={handleAutoFormat}
                                className="text-xs flex items-center gap-1 text-primary hover:bg-primary/5 px-2 py-1 rounded transition-colors font-medium cursor-pointer"
                                title="Fix spacing issues from copy-paste"
                            >
                                <Wand2 size={12} />
                                Auto-Fix Spacing
                            </button>
                        </div>

                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Paste text here. If it looks cramped, click 'Auto-Fix Spacing'!"
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
