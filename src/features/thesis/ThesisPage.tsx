import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { ArrowLeft, BookOpen, Layout, GripVertical, ArrowRight, Save, Loader2, Sparkles, X, Eye } from 'lucide-react';
import { RHETORICAL_VERBS } from '../reader/data';
import { useAuth } from '../../contexts/AuthContext';

interface ThesisState {
    verb1: string | null;
    verb2: string | null;
    purpose: string;
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string; shadow: string }> = {
    "Comparison": { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe", shadow: "rgba(59, 130, 246, 0.15)" },
    "Emphasis": { bg: "#fffbeb", text: "#b45309", border: "#fde68a", shadow: "rgba(245, 158, 11, 0.15)" },
    "Tone/Emotion": { bg: "#fff1f2", text: "#be123c", border: "#fecdd3", shadow: "rgba(244, 63, 94, 0.15)" },
    "Logic/Argument": { bg: "#ecfdf5", text: "#047857", border: "#a7f3d0", shadow: "rgba(16, 185, 129, 0.15)" },
    "Structure": { bg: "#f5f3ff", text: "#6d28d9", border: "#ddd6fe", shadow: "rgba(139, 92, 246, 0.15)" },
    "Default": { bg: "#f9fafb", text: "#374151", border: "#e5e7eb", shadow: "rgba(107, 114, 128, 0.15)" }
};

// NEW HELPER FUNCTION
const toGerund = (verb: string) => {
    if (verb.endsWith('ies')) return verb.slice(0, -3) + 'ying'; // Amplifies -> Amplifying
    if (verb.endsWith('sses') || verb.endsWith('hes')) return verb.slice(0, -2) + 'ing'; // Digresses -> Digressing
    if (verb.endsWith('es')) return verb.slice(0, -2) + 'ing'; // Juxtaposes -> Juxtaposing
    if (verb.endsWith('s')) return verb.slice(0, -1) + 'ing'; // Highlights -> Highlighting
    return verb + 'ing';
};

export const ThesisPage: React.FC = () => {
    const { id, studentId } = useParams<{ id: string; studentId?: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    // DETERMINE MODE
    const targetUserId = studentId || user?.uid;
    const isReadOnly = !!studentId;

    const [loading, setLoading] = useState(true);
    const [assignmentTitle, setAssignmentTitle] = useState('');
    const [authorName, setAuthorName] = useState('');
    const [collectedVerbs, setCollectedVerbs] = useState<string[]>([]);
    const [thesis, setThesis] = useState<ThesisState>({ verb1: null, verb2: null, purpose: '' });
    const [isDragging, setIsDragging] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (!id || !targetUserId) return;
            try {
                // 1. Assignment
                const assignSnap = await getDoc(doc(db, 'assignments', id));
                if (assignSnap.exists()) {
                    const data = assignSnap.data();
                    setAssignmentTitle(data.title);
                    setAuthorName(data.author || "The Author");
                }

                // 2. Annotations
                const q = query(
                    collection(db, 'annotations'),
                    where('assignmentId', '==', id),
                    where('userId', '==', targetUserId)
                );
                const annSnap = await getDocs(q);
                const verbs = annSnap.docs.map(d => d.data().verb);
                setCollectedVerbs(Array.from(new Set(verbs)));

                // 3. Check for existing thesis work
                const subRef = doc(db, 'submissions', `${targetUserId}_${id}`);
                const subSnap = await getDoc(subRef);
                if (subSnap.exists()) {
                    const data = subSnap.data();
                    if (data.thesis) {
                        setThesis(data.thesis);
                    }
                }

                setLoading(false);
            } catch (error) { console.error(error); setLoading(false); }
        };
        fetchData();
    }, [id, targetUserId]);

    // ... [Drag Handlers & getVerbStyle remain exactly the same] ...
    const handleDragStart = (e: React.DragEvent, verb: string) => {
        if (isReadOnly) return;
        e.dataTransfer.setData('text/plain', verb);
        setIsDragging(true);
    };
    const handleDragOver = (e: React.DragEvent) => e.preventDefault();
    const handleDrop = (e: React.DragEvent, slot: 'verb1' | 'verb2') => {
        e.preventDefault();
        const verb = e.dataTransfer.getData('text/plain');
        setThesis(prev => ({ ...prev, [slot]: verb }));
        setIsDragging(false);
    };
    const getVerbStyle = (verb: string) => {
        const category = RHETORICAL_VERBS.find(cat => cat.verbs.includes(verb))?.category || "Default";
        return CATEGORY_COLORS[category] || CATEGORY_COLORS["Default"];
    };

    const handleSave = async () => {
        if (isReadOnly) {
            navigate(`/teacher/review/${id}/${studentId}/paragraphs`);
            return;
        }

        if (!user || !id) return;
        setIsSaving(true);
        try {
            const submissionRef = doc(db, 'submissions', `${user.uid}_${id}`);

            // Merge with existing data (so we don't overwrite SPACECAT)
            await setDoc(submissionRef, {
                userId: user.uid,
                assignmentId: id,
                thesis: thesis,
                status: 'thesis_drafted',
                updatedAt: serverTimestamp()
            }, { merge: true });

            // Navigate back to reader
            navigate(`/assignment/${id}`);
        } catch (error) {
            console.error("Error saving thesis:", error);
            alert("Failed to save thesis. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    // ... [DraggableToken and DropSocket components remain exactly the same] ...
    const DraggableToken = ({ verb }: { verb: string }) => {
        const style = getVerbStyle(verb);
        return (
            <div
                draggable
                onDragStart={(e) => handleDragStart(e, verb)}
                onDragEnd={() => setIsDragging(false)}
                style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem',
                    backgroundColor: 'white', borderRadius: 'var(--radius-md)',
                    border: `1px solid ${style.border}`, borderLeft: `4px solid ${style.border}`,
                    marginBottom: '0.5rem', cursor: 'grab', boxShadow: 'var(--shadow-sm)',
                    transition: 'all 0.2s'
                }}
            >
                <span style={{ fontFamily: 'var(--font-serif)', fontWeight: 500, color: 'var(--color-text)', flex: 1 }}>{verb}</span>
                <GripVertical size={14} style={{ color: 'var(--color-text-muted)', opacity: 0.5 }} />
            </div>
        );
    };

    const DropSocket = ({ slot, label, number }: { slot: 'verb1' | 'verb2', label: string, number: number }) => {
        const currentVerb = thesis[slot];
        const style = currentVerb ? getVerbStyle(currentVerb) : null;

        return (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '160px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'var(--color-border)', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>{number}</span>
                    {label}
                </div>

                <div
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, slot)}
                    style={{
                        height: '80px',
                        borderRadius: 'var(--radius-lg)',
                        border: currentVerb ? `2px solid ${style?.border}` : '2px dashed var(--color-border)',
                        backgroundColor: currentVerb ? style?.bg : (isDragging ? '#eff6ff' : 'var(--color-background)'),
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        position: 'relative', transition: 'all 0.2s',
                        boxShadow: currentVerb ? `0 4px 12px ${style?.shadow}` : 'none'
                    }}
                >
                    {currentVerb ? (
                        <>
                            <span style={{ fontSize: '1.1rem', fontFamily: 'var(--font-serif)', fontWeight: 700, color: style?.text }}>
                                {toGerund(currentVerb)}
                            </span>
                            <button
                                onClick={() => setThesis(p => ({ ...p, [slot]: null }))}
                                style={{ position: 'absolute', top: '5px', right: '5px', background: 'white', border: 'none', borderRadius: '50%', padding: '4px', cursor: 'pointer', boxShadow: 'var(--shadow-sm)' }}
                            >
                                <X size={12} color="var(--color-text-muted)" />
                            </button>
                        </>
                    ) : (
                        <span style={{ fontSize: '0.85rem', fontWeight: 500, color: isDragging ? 'var(--color-primary)' : 'var(--color-text-muted)', opacity: isDragging ? 1 : 0.5 }}>
                            Drop Strategy
                        </span>
                    )}
                </div>
            </div>
        );
    };

    if (loading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Loader2 className="animate-spin" size={32} color="var(--color-primary)" /></div>;

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f8f9fa' }}>
            {/* Header */}
            <header style={{ backgroundColor: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={() => navigate(-1)} className="btn btn-ghost" style={{ padding: '0.5rem' }}>
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 style={{ fontSize: '1.25rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            The Architect's Desk
                        </h1>
                        <p style={{ fontSize: '0.8rem', margin: 0, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {isReadOnly ? <span className="flex items-center gap-2 text-amber-600"><Eye size={12} /> Reviewing Student Work</span> : <>Drafting for: <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{assignmentTitle}</span></>}
                        </p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="btn btn-outline" style={{ fontSize: '0.8rem' }}>
                        <BookOpen size={16} style={{ marginRight: '0.5rem' }} /> Reference Text
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={(!isReadOnly && (!thesis.verb1 || !thesis.verb2 || !thesis.purpose)) || isSaving}
                        className="btn btn-primary"
                        style={{ fontSize: '0.8rem', opacity: (!isReadOnly && (!thesis.verb1 || !thesis.verb2 || !thesis.purpose)) ? 0.5 : 1 }}
                    >
                        {isSaving ? <Loader2 className="animate-spin" size={16} /> : (isReadOnly ? <ArrowRight size={16} style={{ marginRight: '0.5rem' }} /> : <Save size={16} style={{ marginRight: '0.5rem' }} />)}
                        {isSaving ? 'Saving...' : (isReadOnly ? 'Next: Paragraphs' : 'Save Thesis')}
                    </button>
                </div>
            </header>

            <main style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

                {/* LEFT: Inventory */}
                <div style={{ width: '300px', backgroundColor: 'white', borderRight: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', zIndex: 5 }}>
                    <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-background)' }}>
                        <h2 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Layout size={16} /> Rhetorical Inventory
                        </h2>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: '0.5rem 0 0 0', lineHeight: 1.4 }}>
                            Drag strategies onto the drafting board.
                        </p>
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
                        {collectedVerbs.length === 0 ? (
                            <div style={{ padding: '2rem', border: '2px dashed var(--color-border)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>No annotations found.</p>
                            </div>
                        ) : (
                            collectedVerbs.map(verb => <DraggableToken key={verb} verb={verb} />)
                        )}
                    </div>
                </div>

                {/* RIGHT: Drafting Board */}
                <div style={{ flex: 1, backgroundColor: '#f0f4f8', display: 'flex', flexDirection: 'column', overflowY: 'auto', position: 'relative' }}>
                    {/* Live Preview Banner */}
                    <div style={{ backgroundColor: 'white', borderBottom: '1px solid var(--color-primary-light)', padding: '2rem', textAlign: 'center', position: 'sticky', top: 0, zIndex: 5, boxShadow: 'var(--shadow-sm)' }}>
                        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <Sparkles size={14} color="var(--color-accent)" />
                                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Live Preview</span>
                            </div>
                            <p style={{ fontSize: '1.5rem', fontFamily: 'var(--font-serif)', lineHeight: 1.6, color: 'var(--color-text)' }}>
                                <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{authorName}</span> begins by
                                <span style={{ margin: '0 0.5rem', padding: '0 0.25rem', borderBottom: thesis.verb1 ? '2px solid var(--color-primary)' : '2px dashed var(--color-border)', color: thesis.verb1 ? 'var(--color-primary)' : 'var(--color-text-muted)', fontStyle: thesis.verb1 ? 'normal' : 'italic' }}>
                                    {thesis.verb1 ? toGerund(thesis.verb1) : " [strategy] "}
                                </span>
                                , then shifts to
                                <span style={{ margin: '0 0.5rem', padding: '0 0.25rem', borderBottom: thesis.verb2 ? '2px solid var(--color-primary)' : '2px dashed var(--color-border)', color: thesis.verb2 ? 'var(--color-primary)' : 'var(--color-text-muted)', fontStyle: thesis.verb2 ? 'normal' : 'italic' }}>
                                    {thesis.verb2 ? toGerund(thesis.verb2) : " [strategy] "}
                                </span>
                                {' '}in order to{' '}
                                <span style={{ margin: '0 0.5rem', padding: '0 0.25rem', borderBottom: thesis.purpose ? '2px solid var(--color-accent)' : '2px dashed var(--color-border)', color: thesis.purpose ? 'var(--color-text)' : 'var(--color-text-muted)', fontStyle: thesis.purpose ? 'normal' : 'italic' }}>
                                    {thesis.purpose || " [universal purpose]"}
                                </span>.
                            </p>
                        </div>
                    </div>

                    {/* Workspace */}
                    <div style={{ flex: 1, padding: '3rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ width: '100%', maxWidth: '1000px', backgroundColor: 'white', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--color-border)', padding: '3rem' }}>

                            {/* Step 1: Structure */}
                            <div style={{ marginBottom: '3rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                    {/* Author Block */}
                                    <div style={{ width: '150px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-background)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontWeight: 700, color: 'var(--color-text-muted)', textAlign: 'center', padding: '0.5rem' }}>
                                        {authorName}
                                    </div>

                                    <ArrowRight size={24} color="var(--color-border)" />
                                    <DropSocket slot="verb1" label="Strategy 1" number={1} />
                                    <ArrowRight size={24} color="var(--color-border)" />
                                    <DropSocket slot="verb2" label="Strategy 2" number={2} />
                                </div>
                            </div>

                            {/* Step 2: Purpose */}
                            <div style={{ paddingTop: '2rem', borderTop: '2px dashed var(--color-border)' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', display: 'block' }}>Step 3: The "In Order To"</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', backgroundColor: 'var(--color-background)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                                    <span style={{ fontSize: '1.25rem', fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>...in order to</span>
                                    <input
                                        type="text"
                                        value={thesis.purpose}
                                        onChange={(e) => setThesis(p => ({ ...p, purpose: e.target.value }))}
                                        placeholder="convey what message to the audience?"
                                        disabled={isReadOnly}
                                        style={{ flex: 1, backgroundColor: 'transparent', border: 'none', borderBottom: '2px solid var(--color-border)', outline: 'none', padding: '0.5rem', fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: 'var(--color-text)' }}
                                        autoComplete="off"
                                    />
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};
