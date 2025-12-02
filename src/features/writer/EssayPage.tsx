import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { ArrowLeft, FileText, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { EssayAssembler } from './EssayAssembler';

export const EssayPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [thesis, setThesis] = useState('');
    const [paragraphs, setParagraphs] = useState<any[]>([]);
    const [assignmentTitle, setAssignmentTitle] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            if (!id || !user) return;
            try {
                const assignSnap = await getDoc(doc(db, 'assignments', id));
                if (assignSnap.exists()) setAssignmentTitle(assignSnap.data().title);

                const subRef = doc(db, 'submissions', `${user.uid}_${id}`);
                const subSnap = await getDoc(subRef);
                if (subSnap.exists()) {
                    const data = subSnap.data();
                    if (data.thesis) {
                        const t = data.thesis;
                        setThesis(`${t.verb1 ? t.verb1 + 'ing' : '...'}, then shifts to ${t.verb2 ? t.verb2 + 'ing' : '...'} in order to ${t.purpose || '...'}.`);
                    }
                    if (data.paragraphs) setParagraphs(data.paragraphs);
                }
                setLoading(false);
            } catch (error) { console.error(error); setLoading(false); }
        };
        fetchData();
    }, [id, user]);

    const handleSubmit = async () => {
        if (!user || !id) return;
        try {
            const subRef = doc(db, 'submissions', `${user.uid}_${id}`);
            await setDoc(subRef, { status: 'submitted', submittedAt: serverTimestamp() }, { merge: true });
            alert("Essay Submitted Successfully!");
            navigate('/student/dashboard');
        } catch (e) { console.error(e); alert("Error submitting"); }
    };

    if (loading) return <div className="h-screen flex items-center justify-center bg-[#f8f9fa]"><Loader2 className="animate-spin text-primary" /></div>;

    return (
        <div className="min-h-screen bg-[#f8f9fa] flex flex-col font-sans">
            <header className="bg-white border-b border-border px-8 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="btn btn-ghost p-2 text-muted"><ArrowLeft size={20} /></button>
                    <div>
                        <h1 className="text-xl font-bold font-serif text-primary flex items-center gap-2">
                            <FileText size={20} /> Final Assembly
                        </h1>
                        <p className="text-xs text-muted uppercase tracking-wider">Drafting for: <span className="text-primary font-semibold">{assignmentTitle}</span></p>
                    </div>
                </div>
            </header>

            <main className="flex-1 p-8">
                <EssayAssembler
                    thesis={thesis}
                    paragraphs={paragraphs}
                    onBack={() => navigate(-1)}
                    onSubmit={handleSubmit}
                />
            </main>
        </div>
    );
};
