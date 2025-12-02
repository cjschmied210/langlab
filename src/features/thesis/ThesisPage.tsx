import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { ArrowLeft, BookOpen, Layout, GripVertical, Eraser, ArrowRight, Save, Loader2, Sparkles } from 'lucide-react';
import { RHETORICAL_VERBS } from '../reader/data';
import { useAuth } from '../../contexts/AuthContext';

// Reusing your color palette
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
    const [thesis, setThesis] = useState({ verb1: null as string | null, verb2: null as string | null, purpose: '' });
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (!id || !user) return;
            try {
                // 1. Fetch Assignment Info
                const assignSnap = await getDoc(doc(db, 'assignments', id));
                if (assignSnap.exists()) {
                    const data = assignSnap.data();
                    setAssignmentTitle(data.title);
                    setAuthorName(data.author || "The Author");
                }

                // 2. Fetch User's Annotations to populate the "Inventory"
                const q = query(
                    collection(db, 'annotations'),
                    where('assignmentId', '==', id),
                    where('userId', '==', user.uid)
                );
                const annSnap = await getDocs(q);
                const verbs = annSnap.docs.map(d => d.data().verb);
                setCollectedVerbs(Array.from(new Set(verbs)));

                // 3. Fetch Existing Thesis
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
                console.error(error);
                setLoading(false);
            }
        };
        fetchData();
    }, [id, user]);

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

    // --- Components ---
    const DropSlot = ({ slot, label, number }: { slot: 'verb1' | 'verb2', label: string, number: number }) => {
        const currentVerb = thesis[slot];
        const style = currentVerb ? getVerbStyle(currentVerb) : null;
        return (
            <div
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, slot)}
                className={`
                    relative flex-1 h-32 rounded-xl border-2 flex flex-col items-center justify-center transition-all duration-300
                    ${currentVerb ? 'bg-white shadow-sm' : 'border-dashed border-slate-200 bg-slate-50/50'}
                    ${isDragging && !currentVerb ? 'border-blue-400 bg-blue-50 scale-[1.02]' : ''}
                `}
                style={{ borderColor: style?.border, backgroundColor: style?.bg }}
            >
                {currentVerb ? (
                    <>
                        <div className="text-xs font-bold uppercase tracking-widest opacity-60 mb-2" style={{ color: style?.text }}>{label}</div>
                        <span className="text-2xl font-serif font-bold" style={{ color: style?.text }}>{currentVerb}ing</span>
                        <button
                            onClick={() => setThesis(p => ({ ...p, [slot]: null }))}
                            className="absolute top-2 right-2 p-1 hover:bg-white/50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                        >
                            <Eraser size={14} className="text-slate-400 hover:text-red-500" />
                        </button>
                    </>
                ) : (
                    <div className="flex flex-col items-center gap-3 opacity-40">
                        <span className="w-8 h-8 rounded-full border-2 border-current flex items-center justify-center text-sm font-bold">{number}</span>
                        <span className="text-sm font-medium uppercase tracking-wide">Drop Strategy</span>
                    </div>
                )}
            </div>
        );
    };

    if (loading) return <div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center shadow-sm z-10">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold font-serif text-blue-900 flex items-center gap-2">
                            The Architect's Desk
                        </h1>
                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                            Drafting for: <span className="text-blue-600">{assignmentTitle}</span>
                        </p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => navigate(`/assignment/${id}`)} className="btn btn-outline text-xs px-4 py-2 flex items-center gap-2">
                        <BookOpen size={16} /> Reference Text
                    </button>
                    <button onClick={handleSave} className="btn btn-primary text-xs px-6 py-2 flex items-center gap-2 shadow-lg shadow-blue-900/20">
                        <Save size={16} /> Save & Return
                    </button>
                </div>
            </header>

            <main className="flex-1 flex overflow-hidden">
                {/* LEFT: The Toolbox */}
                <div className="w-80 bg-white border-r border-slate-200 flex flex-col z-0">
                    <div className="p-6 bg-slate-50/50 border-b border-slate-200">
                        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <Layout size={16} /> Rhetorical Inventory
                        </h2>
                        <p className="text-xs text-slate-400 mt-2">Drag strategies onto the drafting board.</p>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-slate-50/30">
                        {collectedVerbs.length === 0 ? (
                            <div className="text-center py-10 px-4 border-2 border-dashed border-gray-200 rounded-xl">
                                <p className="text-sm text-muted">No strategies found.</p>
                                <p className="text-xs text-muted/60 mt-1">Go back and highlight text to populate your inventory.</p>
                            </div>
                        ) : (
                            collectedVerbs.map(verb => {
                                const style = getVerbStyle(verb);
                                return (
                                    <div
                                        key={verb}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, verb)}
                                        onDragEnd={() => setIsDragging(false)}
                                        className="group flex items-center justify-between p-3 rounded-lg border cursor-grab active:cursor-grabbing hover:shadow-md transition-all bg-white"
                                        style={{ borderLeft: `4px solid ${style.border}`, borderColor: style.border }}
                                    >
                                        <span className="font-serif font-medium text-slate-700">{verb}</span>
                                        <GripVertical size={14} className="text-slate-300 group-hover:text-slate-500" />
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* RIGHT: The Drafting Board */}
                <div className="flex-1 bg-slate-100 relative overflow-y-auto flex flex-col">
                    {/* Background Grid */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#1e3a8a 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

                    {/* Live Preview */}
                    <div className="bg-blue-900/5 border-b border-blue-900/10 p-8 text-center sticky top-0 backdrop-blur-sm z-10">
                        <p className="font-serif text-2xl text-blue-900/80 leading-relaxed max-w-4xl mx-auto">
                            <span className="font-bold text-blue-900">{authorName}</span> begins by
                            <span className={`mx-2 inline-block border-b-2 ${thesis.verb1 ? 'border-blue-600 font-bold text-blue-600' : 'border-dashed border-blue-900/20 text-blue-900/30'}`}>
                                {thesis.verb1 ? `${thesis.verb1}ing` : " [strategy] "}
                            </span>
                            , then shifts to
                            <span className={`mx-2 inline-block border-b-2 ${thesis.verb2 ? 'border-blue-600 font-bold text-blue-600' : 'border-dashed border-blue-900/20 text-blue-900/30'}`}>
                                {thesis.verb2 ? `${thesis.verb2}ing` : " [strategy] "}
                            </span>
                            {' '}in order to{' '}
                            <span className={`mx-2 inline-block border-b-2 ${thesis.purpose ? 'border-blue-600 font-bold text-blue-600' : 'border-dashed border-blue-900/20 text-blue-900/30'}`}>
                                {thesis.purpose || " [universal purpose]"}
                            </span>.
                        </p>
                    </div>

                    <div className="flex-1 p-12 flex items-center justify-center">
                        <div className="w-full max-w-5xl space-y-12">
                            {/* Step 1: Structure */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between px-1 text-xs font-bold text-slate-400 uppercase tracking-widest">
                                    <span>Beginning</span><span>Shift</span><span>Ending</span>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="w-40 h-32 flex items-center justify-center bg-white rounded-xl border border-slate-200 font-bold text-slate-500 shadow-sm text-center px-4">
                                        {authorName}
                                    </div>
                                    <ArrowRight className="text-slate-300" size={32} />
                                    <DropSlot slot="verb1" label="Strategy 1" number={1} />
                                    <ArrowRight className="text-slate-300" size={32} />
                                    <DropSlot slot="verb2" label="Strategy 2" number={2} />
                                </div>
                            </div>
                            {/* Step 2: Purpose */}
                            <div className="space-y-4 pt-8 border-t-2 border-dashed border-slate-200">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Sparkles size={14} className="text-amber-500" /> The Universal Purpose
                                </label>
                                <div className="flex items-center gap-6 bg-white p-8 rounded-xl border border-slate-200 shadow-sm focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                                    <span className="text-xl font-serif italic text-slate-400 shrink-0">...in order to</span>
                                    <input
                                        type="text"
                                        value={thesis.purpose}
                                        onChange={(e) => setThesis(p => ({ ...p, purpose: e.target.value }))}
                                        placeholder="convey what message to the audience?"
                                        className="flex-1 bg-transparent border-b-2 border-slate-200 focus:border-blue-600 outline-none py-2 font-serif text-2xl placeholder:text-slate-300 placeholder:italic transition-colors text-slate-800"
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
