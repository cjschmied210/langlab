import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { ArrowLeft, Layout, Sparkles, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ParagraphBuilder } from './ParagraphBuilder';

export const ParagraphPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [assignmentTitle, setAssignmentTitle] = useState('');
    const [annotations, setAnnotations] = useState<any[]>([]);
    const [existingParagraphs, setExistingParagraphs] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            if (!id || !user) return;
            try {
                // 1. Get Assignment Title
                const assignSnap = await getDoc(doc(db, 'assignments', id));
                if (assignSnap.exists()) setAssignmentTitle(assignSnap.data().title);

                // 2. Get Annotations (Evidence Bank)
                const q = query(collection(db, 'annotations'), where('assignmentId', '==', id), where('userId', '==', user.uid));
                const annSnap = await getDocs(q);
                setAnnotations(annSnap.docs.map(d => ({ id: d.id, ...d.data() })));

                // 3. Get Existing Progress
                const subRef = doc(db, 'submissions', `${user.uid}_${id}`);
                const subSnap = await getDoc(subRef);
                if (subSnap.exists() && subSnap.data().paragraphs) {
                    setExistingParagraphs(subSnap.data().paragraphs);
                }

                setLoading(false);
            } catch (error) { console.error(error); setLoading(false); }
        };
        fetchData();
    }, [id, user]);

    const handleSave = async (paragraph: any) => {
        if (!user || !id) return;
        const newParagraphs = [...existingParagraphs, paragraph];
        setExistingParagraphs(newParagraphs);

        try {
            const subRef = doc(db, 'submissions', `${user.uid}_${id}`);
            await setDoc(subRef, {
                paragraphs: newParagraphs,
                updatedAt: serverTimestamp()
            }, { merge: true });
            alert("Paragraph Saved!");
        } catch (e) { console.error(e); }
    };

    if (loading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8f9fa' }}><Loader2 className="animate-spin" size={32} color="var(--color-primary)" /></div>;

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa', display: 'flex', flexDirection: 'column', fontFamily: 'var(--font-sans)' }}>
            {/* Clean Header */}
            <header style={{ backgroundColor: 'white', borderBottom: '1px solid var(--color-border)', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10, boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={() => navigate(-1)} className="btn btn-ghost" style={{ padding: '0.5rem', color: 'var(--color-text-muted)' }}>
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Layout size={20} /> Paragraph Builder
                        </h1>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                            Drafting for: <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{assignmentTitle}</span>
                        </p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-outline" style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => navigate(`/assignment/${id}/essay`)}>
                        <Sparkles size={14} /> Go to Essay Assembly
                    </button>
                </div>
            </header>

            {/* Main Workspace */}
            <main style={{ flex: 1, maxWidth: '1280px', margin: '0 auto', padding: '2rem', width: '100%' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
                    <ParagraphBuilder
                        annotations={annotations}
                        onBack={() => navigate(-1)}
                        onComplete={handleSave}
                    />
                </div>

                {/* Show Saved Paragraphs Preview */}
                {existingParagraphs.length > 0 && (
                    <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '2px dashed var(--color-border)' }}>
                        <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <CheckCircle2 size={16} /> Completed Paragraphs ({existingParagraphs.length})
                        </h3>
                        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                            {existingParagraphs.map((p, i) => (
                                <div key={i} style={{ padding: '1rem', backgroundColor: 'white', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Paragraph {i + 1}</div>
                                    <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <p style={{ margin: 0 }}><strong>Claim:</strong> {p.claimVerb?.verb}</p>
                                        <p style={{ margin: 0, fontStyle: 'italic', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>"{p.evidence}"</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};
