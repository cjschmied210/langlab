import React, { useState } from 'react';
import { X, Loader2, Trash2, Save, AlertTriangle } from 'lucide-react';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import type { Class } from '../../../types/class';

interface ClassSettingsModalProps {
    classData: Class;
    onClose: () => void;
    onClassUpdated: () => void;
    onClassDeleted: () => void;
}

export const ClassSettingsModal: React.FC<ClassSettingsModalProps> = ({ classData, onClose, onClassUpdated, onClassDeleted }) => {
    const [name, setName] = useState(classData.name);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsSubmitting(true);
        try {
            const classRef = doc(db, 'classes', classData.id);
            await updateDoc(classRef, {
                name: name.trim()
            });
            onClassUpdated();
            onClose();
        } catch (error) {
            console.error("Error updating class:", error);
            alert("Failed to update class.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await deleteDoc(doc(db, 'classes', classData.id));
            // Note: In a real app, we should also delete assignments and remove student references.
            onClassDeleted();
            onClose();
        } catch (error) {
            console.error("Error deleting class:", error);
            alert("Failed to delete class.");
        } finally {
            setIsDeleting(false);
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

                <h2 className="text-2xl font-bold text-primary mb-lg">Class Settings</h2>

                <form onSubmit={handleUpdate} className="flex flex-col gap-lg">
                    <div>
                        <label className="block text-sm font-semibold text-muted mb-xs">Class Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full p-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                            required
                        />
                    </div>

                    <div className="pt-md border-t border-border">
                        <h3 className="text-sm font-bold text-error mb-sm flex items-center gap-xs">
                            <AlertTriangle size={16} />
                            Danger Zone
                        </h3>
                        {!showDeleteConfirm ? (
                            <button
                                type="button"
                                onClick={() => setShowDeleteConfirm(true)}
                                className="btn btn-outline border-error text-error hover:bg-error/10 w-full justify-center"
                            >
                                <Trash2 size={16} className="mr-sm" />
                                Delete Class
                            </button>
                        ) : (
                            <div className="bg-error/10 p-md rounded-md text-center">
                                <p className="text-sm text-error font-semibold mb-sm">Are you sure? This cannot be undone.</p>
                                <div className="flex gap-sm justify-center">
                                    <button
                                        type="button"
                                        onClick={() => setShowDeleteConfirm(false)}
                                        className="btn btn-ghost text-sm"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleDelete}
                                        className="btn btn-primary bg-error border-error text-white hover:bg-error/90 text-sm"
                                        disabled={isDeleting}
                                    >
                                        {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-sm mt-sm">
                        <button type="button" onClick={onClose} className="btn btn-ghost" disabled={isSubmitting}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 size={18} className="animate-spin mr-sm" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save size={18} className="mr-sm" />
                                    Save Changes
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
