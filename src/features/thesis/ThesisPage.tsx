import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { ArrowLeft, BookOpen, Sparkles, CheckCircle2, Eraser, ArrowRight, Layout, GripVertical } from 'lucide-react';
import { RHETORICAL_VERBS } from '../reader/data';

interface ThesisState {
    verb1: string | null;
    verb2: string | null;
    purpose: string;
}

// "Academic Zen" Color Palette
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
    const [availableVerbs, setAvailableVerbs] = useState<string[]>([]);

    // Thesis Builder State
    const [thesis, setThesis] = useState<ThesisState>({
        verb1: null,
        verb2: null,
        purpose: ''
    });
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (!id || !user) return;
            try {
                // 1. Get Assignment Details
                const assignSnap = await getDoc(doc(db, 'assignments', id));
                if (assignSnap.exists()) {
                    const data = assignSnap.data();
                    setAssignmentTitle(data.title);
                    setAuthorName(data.author || "The Author");
                }

                // 2. Get User's Annotations
                const q = query(collection(db, 'annotations'), where('assignmentId', '==', id), where('userId', '==', user.uid));
                const querySnapshot = await getDocs(q);
                const verbs = querySnapshot.docs.map(doc => doc.data().verb);
                setAvailableVerbs(Array.from(new Set(verbs))); // Unique verbs

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
            } catch (error) {
                console.error("Error fetching data:", error);
                setLoading(false);
            }
        };
        fetchData();
    }, [id, user]);

    const getVerbStyle = (verb: string) => {
        const category = RHETORICAL_VERBS.find(cat => cat.verbs.includes(verb))?.category || "Default";
        return CATEGORY_COLORS[category] || CATEGORY_COLORS["Default"];
    };

    const handleDragStart = (e: React.DragEvent, verb: string) => {
        e.dataTransfer.setData('text/plain', verb);
        setIsDragging(true);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent, slot: 'verb1' | 'verb2') => {
        e.preventDefault();
        const verb = e.dataTransfer.getData('text/plain');
        setThesis(prev => ({ ...prev, [slot]: verb }));
        setIsDragging(false);
    };

    const clearSlot = (slot: 'verb1' | 'verb2') => {
        setThesis(prev => ({ ...prev, [slot]: null }));
    };

    const handleSaveAndExit = async () => {
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

    const VerbSlot = ({ slot, label, number }: { slot: 'verb1' | 'verb2', label: string, number: number }) => {
        const currentVerb = thesis[slot];
        const style = currentVerb ? getVerbStyle(currentVerb) : null;

        return (
            <div className="flex flex-col gap-1 relative group flex-1 min-w-[140px]">
                <div className="text-[10px] font-bold text-muted uppercase tracking-widest flex items-center gap-1">
                    <span className="w-4 h-4 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[9px]">{number}</span>
                    {label}
                </div>
                <div
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, slot)}
                    style={{
                        backgroundColor: currentVerb ? style?.bg : (isDragging ? '#f0f9ff' : 'transparent'),
                        borderColor: currentVerb ? style?.border : (isDragging ? 'var(--color-primary)' : 'var(--color-border)'),
                        color: currentVerb ? style?.text : 'var(--color-text-muted)',
                        borderStyle: currentVerb ? 'solid' : 'dashed'
                    }}
                    className={`
                        h-16 rounded-md border-2 flex items-center justify-center font-serif font-medium cursor-default relative transition-all
                        ${!currentVerb && !isDragging ? 'hover:border-primary/30 hover:bg-gray-50' : ''}
                    `}
                >
                    {currentVerb ? (
                        <>
                            <span className="text-lg">{currentVerb}ing</span>
                            <button
                                onClick={() => clearSlot(slot)}
                                className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-sm border border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity hover:text-error"
                            >
                                <Eraser size={12} />
                            </button>
                        </>
                    ) : (
                        <span className="text-sm opacity-40 pointer-events-none font-sans uppercase tracking-wide">Drag Verb Here</span>
                    )}
                </div>
            </div>
        );
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Distinct Header for this Phase */}
            <header className="bg-surface border-b border-border p-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="btn btn-ghost text-muted hover:text-primary">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-lg font-bold font-serif text-primary flex items-center gap-2">
                            <Layout size={20} />
                            The Architect's Desk
                        </h1>
                        <p className="text-xs text-muted">Drafting argument for: <span className="font-semibold">{assignmentTitle}</span></p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => navigate(`/assignment/${id}`)} className="btn btn-outline text-xs">
                        <BookOpen size={14} className="mr-2" />
                        View Text (Reference)
                    </button>
                </div>
            </header>

            <main className="flex-1 container mx-auto p-8 flex gap-8 h-[calc(100vh-80px)]">
                {/* Left Panel: The Raw Materials */}
                <div className="w-1/3 flex flex-col gap-6">
                    <div className="card p-6 bg-surface/50 border-dashed flex-1 overflow-y-auto">
                        <h2 className="text-sm font-bold text-muted uppercase mb-4 flex items-center gap-2">
                            <BookOpen size={14} />
                            Your Rhetorical Inventory
                        </h2>
                        <p className="text-sm text-muted mb-6">
                            You identified these strategies in the text. Drag them into the builder to construct your claim.
                        </p>

                        <div className="flex flex-wrap gap-3">
                            {availableVerbs.length === 0 ? (
                                <div className="text-sm text-muted italic">No verbs found. Go back and annotate the text!</div>
                            ) : (
                                availableVerbs.map(verb => {
                                    const style = getVerbStyle(verb);
                                    return (
                                        <div
                                            key={verb}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, verb)}
                                            style={{
                                                backgroundColor: style.bg,
                                                borderColor: style.border,
                                                color: style.text
                                            }}
                                            className="px-4 py-3 rounded border cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-all flex items-center gap-2 group"
                                        >
                                            <span className="font-medium text-sm font-serif">{verb}</span>
                                            <GripVertical size={14} className="opacity-0 group-hover:opacity-50 ml-auto" />
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    <div className="card p-6 bg-blue-50 border-blue-100">
                        <h2 className="text-sm font-bold text-blue-800 uppercase mb-2 flex items-center gap-2">
                            <Sparkles size={14} />
                            The Goal
                        </h2>
                        <p className="text-sm text-blue-700 leading-relaxed">
                            Move beyond identification. Don't just say <em>what</em> {authorName} did. Explain <em>why</em> they did it to move the audience.
                        </p>
                    </div>
                </div>

                {/* Right Panel: The Construction Zone */}
                <div className="flex-1 flex flex-col">
                    <div className="card h-full p-8 flex flex-col items-center justify-center bg-white shadow-xl border-primary/10 relative overflow-hidden">

                        {/* Background Decoration */}
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-100 via-primary/20 to-blue-100"></div>

                        <div className="text-center mb-12 max-w-2xl">
                            <h2 className="text-3xl font-serif font-bold text-primary mb-3">Construct Your Thesis</h2>
                            <p className="text-muted text-lg">Drag strategies from your inventory to build a cohesive argument.</p>
                        </div>

                        {/* Live Preview */}
                        <div className="w-full max-w-4xl mb-12 p-8 bg-primary/5 rounded-xl border border-primary/10">
                            <p className="font-serif text-2xl md:text-3xl text-center leading-relaxed text-foreground/90">
                                <span className="font-bold text-primary">{authorName}</span> begins by
                                <span className={`mx-2 inline-block border-b-2 ${thesis.verb1 ? 'border-primary text-primary font-bold' : 'border-dashed border-muted text-muted/40 italic'}`}>
                                    {thesis.verb1 ? `${thesis.verb1}ing` : " [verb] "}
                                </span>
                                , then shifts to
                                <span className={`mx-2 inline-block border-b-2 ${thesis.verb2 ? 'border-primary text-primary font-bold' : 'border-dashed border-muted text-muted/40 italic'}`}>
                                    {thesis.verb2 ? `${thesis.verb2}ing` : " [verb] "}
                                </span>
                                {' '}in order to{' '}
                                <span className={`mx-2 inline-block border-b-2 ${thesis.purpose ? 'border-primary text-primary font-bold' : 'border-dashed border-muted text-muted/40 italic'}`}>
                                    {thesis.purpose || " [state purpose]"}
                                </span>.
                            </p>
                        </div>

                        {/* Builder Interface */}
                        <div className="w-full max-w-5xl p-8 border-t border-border flex items-center justify-center gap-6">

                            {/* Slot 1 */}
                            <VerbSlot slot="verb1" label="Strategy 1" number={1} />

                            <ArrowRight className="text-muted/20 shrink-0 mt-6" size={24} />

                            {/* Slot 2 */}
                            <VerbSlot slot="verb2" label="Shift / Strategy 2" number={2} />

                            <ArrowRight className="text-muted/20 shrink-0 mt-6" size={24} />

                            {/* Purpose Input */}
                            <div className="flex flex-col gap-2 flex-[2] min-w-[240px]">
                                <div className="text-[10px] font-bold text-muted uppercase tracking-widest flex items-center gap-1">
                                    <span className="w-4 h-4 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[9px]">3</span>
                                    Universal Purpose
                                </div>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={thesis.purpose}
                                        onChange={(e) => setThesis(prev => ({ ...prev, purpose: e.target.value }))}
                                        placeholder="convey [message] to the audience..."
                                        className="w-full h-16 pl-4 pr-12 bg-background border border-border focus:border-primary rounded-md outline-none font-serif text-lg placeholder:text-muted/40 placeholder:font-sans transition-colors shadow-inner"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted/30 italic text-sm pointer-events-none font-serif">
                                        ...in order to
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Save Action */}
                        <div className="mt-12">
                            <button
                                onClick={handleSaveAndExit}
                                disabled={!thesis.verb1 || !thesis.verb2 || !thesis.purpose}
                                className="h-14 px-8 bg-primary hover:bg-primary-light text-white rounded-xl font-medium shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0 disabled:shadow-none flex items-center gap-3 text-lg"
                            >
                                <CheckCircle2 size={24} />
                                Save Thesis & Return
                            </button>
                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
};
