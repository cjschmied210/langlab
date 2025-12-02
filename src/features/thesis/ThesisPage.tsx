import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { ArrowLeft, BookOpen, Sparkles, Layout, GripVertical, Eraser, ArrowRight, Save } from 'lucide-react';
import { RHETORICAL_VERBS } from '../reader/data';

interface ThesisState {
    verb1: string | null;
    verb2: string | null;
    purpose: string;
}

// Reusing your palette
const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    "Comparison": { bg: "#dbeafe", text: "#1e40af", border: "#93c5fd" },
    "Emphasis": { bg: "#fef3c7", text: "#92400e", border: "#fcd34d" },
    "Tone/Emotion": { bg: "#ffe4e6", text: "#9f1239", border: "#fda4af" },
    "Logic/Argument": { bg: "#d1fae5", text: "#065f46", border: "#6ee7b7" },
    "Structure": { bg: "#ede9fe", text: "#5b21b6", border: "#c4b5fd" },
    "Default": { bg: "#f3f4f6", text: "#374151", border: "#d1d5db" }
};

export const ThesisPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [assignmentTitle, setAssignmentTitle] = useState('');
    const [authorName, setAuthorName] = useState('');
    const [collectedVerbs, setCollectedVerbs] = useState<string[]>([]);

    // Thesis State
    const [thesis, setThesis] = useState<ThesisState>({ verb1: null, verb2: null, purpose: '' });
    const [isDragging, setIsDragging] = useState(false);

    // Fetch Data
    useEffect(() => {
        const fetchData = async () => {
            if (!id || !user) return;
            try {
                // 1. Assignment
                const assignSnap = await getDoc(doc(db, 'assignments', id));
                if (assignSnap.exists()) {
                    const data = assignSnap.data();
                    setAssignmentTitle(data.title);
                    setAuthorName(data.author || "The Author");
                }
                // 2. Annotations
                const q = query(collection(db, 'annotations'), where('assignmentId', '==', id), where('userId', '==', user.uid));
                const annSnap = await getDocs(q);
                const verbs = annSnap.docs.map(d => d.data().verb);
                setCollectedVerbs(Array.from(new Set(verbs))); // Deduplicate

                // 3. Get Existing Thesis (if any)
                const submissionRef = doc(db, 'submissions', `${user.uid}_${id}`);
                const subSnap = await getDoc(submissionRef);
                if (subSnap.exists()) {
                    const data = subSnap.data();
                    if (data.thesisState) {
                        setThesis(data.thesisState);
                    }
                }

                setLoading(false);
            } catch (error) { console.error(error); }
        };
        fetchData();
    }, [id, user]);

    // --- Drag & Drop Handlers ---
    const handleDragStart = (e: React.DragEvent, verb: string) => {
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
        if (!user || !id) return;

        const thesisStatement = `${authorName} begins by ${thesis.verb1 || '[verb]'}ing, then shifts to ${thesis.verb2 || '[verb]'}ing in order to ${thesis.purpose || '[purpose]'}.`;

        try {
            const submissionRef = doc(db, 'submissions', `${user.uid}_${id}`);
            await setDoc(submissionRef, {
                thesisState: thesis,
                thesisStatement: thesisStatement,
                updatedAt: serverTimestamp()
            }, { merge: true });

            navigate(`/assignment/${id}`);
        } catch (error) {
            console.error("Error saving thesis:", error);
        }
    };

    // --- Sub-Components ---
    const VerbCard = ({ verb }: { verb: string }) => {
        const style = getVerbStyle(verb);
        return (
            <div
                draggable
                onDragStart={(e) => handleDragStart(e, verb)}
                onDragEnd={() => setIsDragging(false)}
                className="group flex items-center justify-between p-3 rounded-lg border cursor-grab active:cursor-grabbing hover:shadow-md transition-all bg-white"
                style={{ borderLeft: `4px solid ${style.border}`, borderColor: style.border }}
            >
                <span className="font-serif font-medium text-foreground">{verb}</span>
                <GripVertical size={14} className="text-muted/30 group-hover:text-muted transition-colors" />
            </div>
        );
    };

    const DropSlot = ({ slot, label, number }: { slot: 'verb1' | 'verb2', label: string, number: number }) => {
        const currentVerb = thesis[slot];
        const style = currentVerb ? getVerbStyle(currentVerb) : null;
        return (
            <div
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, slot)}
                className={`
                    relative flex-1 h-24 rounded-xl border-2 flex flex-col items-center justify-center transition-all duration-300
                    ${currentVerb ? 'bg-white shadow-sm' : 'border-dashed border-border bg-gray-50/50'}
                    ${isDragging && !currentVerb ? 'border-primary/50 bg-primary/5 scale-[1.02]' : ''}
                `}
                style={{
                    borderColor: currentVerb ? style?.border : undefined,
                    backgroundColor: currentVerb ? style?.bg : undefined
                }}
            >
                {currentVerb ? (
                    <>
                        <div className="text-xs font-bold uppercase tracking-widest opacity-60 mb-1" style={{ color: style?.text }}>{label}</div>
                        <span className="text-xl font-serif font-bold" style={{ color: style?.text }}>{currentVerb}ing</span>
                        <button
                            onClick={() => setThesis(p => ({ ...p, [slot]: null }))}
                            className="absolute top-2 right-2 p-1 hover:bg-white/50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                        >
                            <Eraser size={14} className="text-muted/60 hover:text-error" />
                        </button>
                    </>
                ) : (
                    <div className="flex flex-col items-center gap-2 opacity-40">
                        <span className="w-6 h-6 rounded-full border-2 border-current flex items-center justify-center text-xs font-bold">{number}</span>
                        <span className="text-sm font-medium uppercase tracking-wide">Drop Strategy</span>
                    </div>
                )}
            </div>
        );
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

    return (
        <div className="min-h-screen bg-[#f8f9fa] flex flex-col font-sans text-text">
            {/* Header */}
            <header className="bg-white border-b border-border px-8 py-4 flex justify-between items-center shadow-sm z-10">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-muted">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold font-serif text-primary flex items-center gap-2">
                            The Architect's Desk
                        </h1>
                        <p className="text-xs text-muted font-medium uppercase tracking-wider">
                            Drafting argument for: <span className="text-primary">{assignmentTitle}</span>
                        </p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => navigate(`/assignment/${id}`)} className="btn btn-outline text-xs px-4 py-2 flex items-center gap-2 hover:bg-gray-50">
                        <BookOpen size={16} /> Reference Text
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!thesis.verb1 || !thesis.verb2 || !thesis.purpose}
                        className="btn btn-primary text-xs px-6 py-2 flex items-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50 disabled:shadow-none transition-all"
                    >
                        <Save size={16} /> Save Thesis
                    </button>
                </div>
            </header>

            <main className="flex-1 flex overflow-hidden">
                {/* LEFT: The Toolbox */}
                <div className="w-80 bg-white border-r border-border flex flex-col z-0">
                    <div className="p-6 bg-gray-50/50 border-b border-border">
                        <h2 className="text-sm font-bold text-muted uppercase tracking-widest flex items-center gap-2">
                            <Layout size={16} />
                            Rhetorical Inventory
                        </h2>
                        <p className="text-xs text-muted mt-2 leading-relaxed">
                            Drag these strategies onto the drafting board to construct your claim.
                        </p>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 space-y-3">
                        {collectedVerbs.length === 0 ? (
                            <div className="text-center py-10 px-4 border-2 border-dashed border-gray-200 rounded-xl">
                                <p className="text-sm text-muted">No strategies found.</p>
                                <p className="text-xs text-muted/60 mt-1">Go back and highlight text to populate your inventory.</p>
                            </div>
                        ) : (
                            collectedVerbs.map(verb => <VerbCard key={verb} verb={verb} />)
                        )}
                    </div>
                </div>

                {/* RIGHT: The Drafting Board */}
                <div className="flex-1 bg-gray-50/50 relative overflow-y-auto">
                    {/* Background Grid Pattern */}
                    <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#1e3a8a 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

                    <div className="max-w-5xl mx-auto p-12 relative z-0">

                        {/* The "Paper" Container */}
                        <div className="bg-white rounded-xl shadow-xl border border-border/50 overflow-hidden">

                            {/* Live Preview Strip */}
                            <div className="bg-primary/5 border-b border-primary/10 p-8 text-center">
                                <p className="font-serif text-2xl text-primary/80 leading-relaxed">
                                    <span className="font-bold text-primary">{authorName}</span> begins by
                                    <span className={`mx-2 inline-block border-b-2 ${thesis.verb1 ? 'border-primary font-bold text-primary' : 'border-dashed border-primary/20 text-primary/30'}`}>
                                        {thesis.verb1 ? `${thesis.verb1}ing` : " [strategy] "}
                                    </span>
                                    , then shifts to
                                    <span className={`mx-2 inline-block border-b-2 ${thesis.verb2 ? 'border-primary font-bold text-primary' : 'border-dashed border-primary/20 text-primary/30'}`}>
                                        {thesis.verb2 ? `${thesis.verb2}ing` : " [strategy] "}
                                    </span>
                                    {' '}in order to{' '}
                                    <span className={`mx-2 inline-block border-b-2 ${thesis.purpose ? 'border-primary font-bold text-primary' : 'border-dashed border-primary/20 text-primary/30'}`}>
                                        {thesis.purpose || " [universal purpose]"}
                                    </span>.
                                </p>
                            </div>

                            {/* The Machine */}
                            <div className="p-12 space-y-12">
                                {/* Step 1: The Structure */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between text-xs font-bold text-muted uppercase tracking-widest px-1">
                                        <span>Beginning</span>
                                        <span>Shift</span>
                                        <span>Ending</span>
                                    </div>
                                    <div className="flex items-center gap-4 group">
                                        <div className="w-32 h-24 flex items-center justify-center bg-gray-100 rounded-xl border border-gray-200 font-bold text-gray-500 shadow-sm">
                                            {authorName}
                                        </div>
                                        <ArrowRight className="text-gray-300" />
                                        <DropSlot slot="verb1" label="Strategy 1" number={1} />
                                        <ArrowRight className="text-gray-300" />
                                        <DropSlot slot="verb2" label="Strategy 2" number={2} />
                                    </div>
                                </div>

                                {/* Step 2: The Purpose */}
                                <div className="space-y-4 pt-8 border-t border-dashed border-gray-200">
                                    <label className="text-xs font-bold text-muted uppercase tracking-widest flex items-center gap-2">
                                        <Sparkles size={14} className="text-accent" />
                                        The Universal Purpose
                                    </label>
                                    <div className="flex items-center gap-4 bg-gray-50 p-6 rounded-xl border border-border">
                                        <span className="text-lg font-serif italic text-muted shrink-0">...in order to</span>
                                        <input
                                            type="text"
                                            value={thesis.purpose}
                                            onChange={(e) => setThesis(p => ({ ...p, purpose: e.target.value }))}
                                            placeholder="convey what message to the audience?"
                                            className="flex-1 bg-transparent border-b-2 border-gray-300 focus:border-primary outline-none py-2 font-serif text-xl placeholder:text-muted/30 placeholder:italic transition-colors"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
};
