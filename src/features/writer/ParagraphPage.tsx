import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { ArrowLeft, Layout, Sparkles, Loader2, CheckCircle2, Edit2, Eye } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ParagraphBuilder, type ParagraphState } from './ParagraphBuilder';

export const ParagraphPage: React.FC = () => {
    const { id, studentId } = useParams<{ id: string; studentId?: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    // DETERMINE MODE
    const targetUserId = studentId || user?.uid;
    const isReadOnly = !!studentId;

    const [loading, setLoading] = useState(true);
    const [assignmentTitle, setAssignmentTitle] = useState('');
    const [annotations, setAnnotations] = useState<any[]>([]);
    const [existingParagraphs, setExistingParagraphs] = useState<ParagraphState[]>([]);

    // New State for Editing
    const [editingParagraphId, setEditingParagraphId] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!id || !targetUserId) return;
            try {
                const assignSnap = await getDoc(doc(db, 'assignments', id));
                if (assignSnap.exists()) setAssignmentTitle(assignSnap.data().title);

                const q = query(collection(db, 'annotations'), where('assignmentId', '==', id), where('userId', '==', targetUserId));
                const annSnap = await getDocs(q);
                setAnnotations(annSnap.docs.map(d => ({ id: d.id, ...d.data() })));

                const subRef = doc(db, 'submissions', `${targetUserId}_${id}`);
                const subSnap = await getDoc(subRef);
                if (subSnap.exists() && subSnap.data().paragraphs) {
                    setExistingParagraphs(subSnap.data().paragraphs);
                }

                setLoading(false);
            } catch (error) { console.error(error); setLoading(false); }
        };
        fetchData();
    }, [id, targetUserId]);

    const handleSave = async (paragraph: ParagraphState) => {
        if (!user || !id || isReadOnly) return;

        let newParagraphs;
        if (editingParagraphId) {
            // Update existing
            newParagraphs = existingParagraphs.map(p => p.id === paragraph.id ? paragraph : p);
            setEditingParagraphId(null); // Exit edit mode
        } else {
            // Add new
            newParagraphs = [...existingParagraphs, paragraph];
        }

        setExistingParagraphs(newParagraphs);

        try {
            const subRef = doc(db, 'submissions', `${user.uid}_${id}`);
            await setDoc(subRef, {
                paragraphs: newParagraphs,
                updatedAt: serverTimestamp()
            }, { merge: true });
        } catch (e) { console.error(e); }
    };

    // FILTER LOGIC:
    // Identify ALL annotation IDs currently used in saved paragraphs
    // BUT exclude the one used in the paragraph we are currently editing (so we can see it to re-drag it if needed)
    const usedAnnotationIds = existingParagraphs
        .filter(p => p.id !== editingParagraphId)
        .map(p => p.claimVerb?.id)
        .filter(Boolean); // Remove nulls

    const availableAnnotations = annotations.filter(a => !usedAnnotationIds.includes(a.id));

    const paragraphToEdit = existingParagraphs.find(p => p.id === editingParagraphId) || null;

    if (loading) return <div className="h-screen flex items-center justify-center bg-[#f8f9fa]"><Loader2 className="animate-spin text-primary" /></div>;

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'var(--font-sans)', backgroundColor: '#f8f9fa' }}>
            {/* Header */}
            <header style={{ backgroundColor: 'white', borderBottom: '1px solid var(--color-border)', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={() => navigate(-1)} className="btn btn-ghost" style={{ padding: '0.5rem', color: 'var(--color-text-muted)' }}><ArrowLeft size={20} /></button>
                    <div>
                        <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                            <Layout size={20} /> Paragraph Builder
                        </h1>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                            {isReadOnly ? <span className="flex items-center gap-2 text-amber-600"><Eye size={12} /> Reviewing Student Work</span> : <>Drafting for: <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{assignmentTitle}</span></>}
                        </p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-outline" style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => navigate(isReadOnly ? `/teacher/review/${id}/${studentId}/essay` : `/assignment/${id}/essay`)}>
                        <Sparkles size={14} /> {isReadOnly ? 'Next: Essay' : 'Go to Essay Assembly'}
                    </button>
                </div>
            </header>

            {/* Main Workspace */}
            <main style={{ flex: 1, maxWidth: '1200px', margin: '0 auto', padding: '2rem', width: '100%', boxSizing: 'border-box' }}>
                <div style={{ display: 'grid', gap: '2rem' }}>

                    {/* THE BUILDER - Hide if ReadOnly */}
                    {!isReadOnly && (
                        <div style={{ height: '800px', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
                            <ParagraphBuilder
                                key={editingParagraphId || 'new'} // <--- NUCLEAR RESET: Forces re-mount when mode changes
                                annotations={availableAnnotations}
                                onBack={() => navigate(-1)}
                                onComplete={handleSave}
                                initialState={paragraphToEdit}
                                onCancel={() => setEditingParagraphId(null)}
                            />
                        </div>
                    )}

                    {/* Completed Paragraphs Preview */}
                    {(existingParagraphs.length > 0 || isReadOnly) && (
                        <div style={{ marginTop: isReadOnly ? '0' : '2rem', paddingTop: isReadOnly ? '0' : '2rem', borderTop: isReadOnly ? 'none' : '2px dashed var(--color-border)' }}>
                            <h3 style={{ color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <CheckCircle2 size={16} /> Completed Paragraphs ({existingParagraphs.length})
                            </h3>
                            <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                                {existingParagraphs.map((p, i) => (
                                    <div
                                        key={p.id}
                                        onClick={() => !isReadOnly && setEditingParagraphId(p.id)}
                                        style={{
                                            padding: '1.5rem', backgroundColor: 'white', borderRadius: 'var(--radius-md)',
                                            border: editingParagraphId === p.id ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                                            boxShadow: 'var(--shadow-sm)', cursor: isReadOnly ? 'default' : 'pointer', transition: 'all 0.2s'
                                        }}
                                        className={!isReadOnly ? "hover-card" : ""}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase' }}>Paragraph {i + 1}</div>
                                            {!isReadOnly && <Edit2 size={14} color="var(--color-text-muted)" />}
                                        </div>
                                        <div style={{ marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>{p.claimVerb?.verb}</div>

                                        {/* COMMENTARY PREVIEW (Fixed) */}
                                        <div style={{ fontSize: '0.85rem', color: 'var(--color-text)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                            {p.commentary || <span style={{ fontStyle: 'italic', color: 'var(--color-text-muted)' }}>No commentary added.</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};
