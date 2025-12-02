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

    if (loading) return <div className="h-screen flex items-center justify-center bg-[#f8f9fa]"><Loader2 className="animate-spin text-primary" /></div>;

    return (
        <div className="min-h-screen bg-[#f8f9fa] flex flex-col font-sans">
            {/* Clean Header */}
            <header className="bg-white border-b border-border px-8 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="btn btn-ghost p-2 text-muted"><ArrowLeft size={20} /></button>
                    <div>
                        <h1 className="text-xl font-bold font-serif text-primary flex items-center gap-2">
                            <Layout size={20} /> Paragraph Builder
                        </h1>
                        <p className="text-xs text-muted uppercase tracking-wider">Drafting for: <span className="text-primary font-semibold">{assignmentTitle}</span></p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button className="btn btn-outline text-xs flex items-center gap-2" onClick={() => navigate(`/assignment/${id}/essay`)}>
                        <Sparkles size={14} /> Go to Essay Assembly
                    </button>
                </div>
            </header>

            {/* Main Workspace */}
            <main className="flex-1 container mx-auto max-w-7xl p-8">
                <div className="grid grid-cols-1 gap-8">
                    <ParagraphBuilder
                        annotations={annotations}
                        onBack={() => navigate(-1)}
                        onComplete={handleSave}
                    />
                </div>

                {/* Show Saved Paragraphs Preview */}
                {existingParagraphs.length > 0 && (
                    <div className="mt-12 pt-8 border-t border-dashed border-border">
                        <h3 className="text-muted font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                            <CheckCircle2 size={16} /> Completed Paragraphs ({existingParagraphs.length})
                        </h3>
                        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                            {existingParagraphs.map((p, i) => (
                                <div key={i} className="p-4 bg-white rounded-lg border border-border shadow-sm">
                                    <div className="text-xs font-bold text-primary mb-2 uppercase tracking-wide">Paragraph {i + 1}</div>
                                    <div className="text-sm text-muted space-y-2">
                                        <p><strong>Claim:</strong> {p.claimVerb?.verb}</p>
                                        <p className="italic line-clamp-2">"{p.evidence}"</p>
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
