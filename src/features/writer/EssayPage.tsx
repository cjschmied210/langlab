import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { ArrowLeft, FileText, Loader2, Eye } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { EssayAssembler } from './EssayAssembler';

const toGerund = (verb: string) => {
    if (verb.endsWith('ies')) return verb.slice(0, -3) + 'ying';
    if (verb.endsWith('sses') || verb.endsWith('hes')) return verb.slice(0, -2) + 'ing';
    if (verb.endsWith('es')) return verb.slice(0, -2) + 'ing';
    if (verb.endsWith('s')) return verb.slice(0, -1) + 'ing';
    return verb + 'ing';
};

export const EssayPage: React.FC = () => {
    const { id, studentId } = useParams<{ id: string; studentId?: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    // DETERMINE MODE
    const targetUserId = studentId || user?.uid;
    const isReadOnly = !!studentId;

    const [loading, setLoading] = useState(true);
    const [thesis, setThesis] = useState('');
    const [paragraphs, setParagraphs] = useState<any[]>([]);
    const [assignmentTitle, setAssignmentTitle] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            if (!id || !targetUserId) return;
            try {
                const assignSnap = await getDoc(doc(db, 'assignments', id));
                if (assignSnap.exists()) setAssignmentTitle(assignSnap.data().title);

                const subRef = doc(db, 'submissions', `${targetUserId}_${id}`);
                const subSnap = await getDoc(subRef);
                if (subSnap.exists()) {
                    const data = subSnap.data();
                    if (data.thesis) {
                        const t = data.thesis;
                        // FIX: Use toGerund here to avoid "Highlightsing"
                        setThesis(`${t.verb1 ? toGerund(t.verb1) : '...'}, then shifts to ${t.verb2 ? toGerund(t.verb2) : '...'} in order to ${t.purpose || '...'}.`);
                    }
                    if (data.paragraphs) setParagraphs(data.paragraphs);
                }
                setLoading(false);
            } catch (error) { console.error(error); setLoading(false); }
        };
        fetchData();
    }, [id, targetUserId]);

    const handleSubmit = async () => {
        if (isReadOnly) return;
        if (!user || !id) return;
        try {
            const subRef = doc(db, 'submissions', `${user.uid}_${id}`);
            await setDoc(subRef, { status: 'submitted', submittedAt: serverTimestamp() }, { merge: true });
            alert("Essay Submitted Successfully!");
            navigate('/student/dashboard');
        } catch (e) { console.error(e); alert("Error submitting"); }
    };

    const handleReorder = async (newOrder: any[]) => {
        setParagraphs(newOrder);
        if (isReadOnly) return;
        if (user && id) {
            try {
                const subRef = doc(db, 'submissions', `${user.uid}_${id}`);
                await setDoc(subRef, { paragraphs: newOrder }, { merge: true });
            } catch (e) { console.error(e); }
        }
    };

    if (loading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8f9fa' }}><Loader2 className="animate-spin" size={32} color="var(--color-primary)" /></div>;

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa', display: 'flex', flexDirection: 'column', fontFamily: 'var(--font-sans)' }}>
            <header style={{ backgroundColor: 'white', borderBottom: '1px solid var(--color-border)', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10, boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={() => navigate(-1)} className="btn btn-ghost" style={{ padding: '0.5rem', color: 'var(--color-text-muted)' }}>
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <FileText size={20} /> Final Assembly
                        </h1>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                            {isReadOnly ? <span className="flex items-center gap-2 text-amber-600"><Eye size={12} /> Reviewing Student Work</span> : <>Drafting for: <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{assignmentTitle}</span></>}
                        </p>
                    </div>
                </div>
            </header>

            <main style={{ flex: 1, padding: '2rem' }}>
                <EssayAssembler
                    thesis={thesis}
                    paragraphs={paragraphs}
                    onBack={() => navigate(-1)}
                    onSubmit={handleSubmit}
                    onReorder={isReadOnly ? undefined : handleReorder}
                />
            </main>
        </div>
    );
};
