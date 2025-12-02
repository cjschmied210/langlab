import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { ArrowLeft, BookOpen, Layout, GripVertical, ArrowRight, Save, Loader2, Sparkles, X } from 'lucide-react';
import { RHETORICAL_VERBS } from '../reader/data';
import { useAuth } from '../../contexts/AuthContext';

interface ThesisState {
    verb1: string | null;
    verb2: string | null;
    purpose: string;
}

// Refined Palette: Slightly more saturated for better contrast on white
const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string; shadow: string }> = {
    "Comparison": { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe", shadow: "rgba(59, 130, 246, 0.15)" },
    "Emphasis": { bg: "#fffbeb", text: "#b45309", border: "#fde68a", shadow: "rgba(245, 158, 11, 0.15)" },
    "Tone/Emotion": { bg: "#fff1f2", text: "#be123c", border: "#fecdd3", shadow: "rgba(244, 63, 94, 0.15)" },
    "Logic/Argument": { bg: "#ecfdf5", text: "#047857", border: "#a7f3d0", shadow: "rgba(16, 185, 129, 0.15)" },
    "Structure": { bg: "#f5f3ff", text: "#6d28d9", border: "#ddd6fe", shadow: "rgba(139, 92, 246, 0.15)" },
    "Default": { bg: "#f9fafb", text: "#374151", border: "#e5e7eb", shadow: "rgba(107, 114, 128, 0.15)" }
};

export const ThesisPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [assignmentTitle, setAssignmentTitle] = useState('');
    const [authorName, setAuthorName] = useState('');
    const [collectedVerbs, setCollectedVerbs] = useState<string[]>([]);
    const [thesis, setThesis] = useState<ThesisState>({ verb1: null, verb2: null, purpose: '' });
    const [isDragging, setIsDragging] = useState(false);

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
                const q = query(
                    collection(db, 'annotations'),
                    where('assignmentId', '==', id),
                    where('userId', '==', user.uid)
                );
                const annSnap = await getDocs(q);
                const verbs = annSnap.docs.map(d => d.data().verb);
                setCollectedVerbs(Array.from(new Set(verbs)));

                // 3. Check for existing thesis work
                const submissionRef = doc(db, 'submissions', `${user.uid}_${id}`);
                const subSnap = await getDoc(submissionRef);
                if (subSnap.exists()) {
                    const data = subSnap.data();
                    if (data.thesisState) {
                        setThesis(data.thesisState);
                    }
                }

                setLoading(false);
            } catch (error) { console.error(error); setLoading(false); }
        };
        fetchData();
    }, [id, user]);

    // Drag Handlers
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

    const DraggableToken = ({ verb }: { verb: string }) => {
        const style = getVerbStyle(verb);
        return (
            <div
                draggable
                onDragStart={(e) => handleDragStart(e, verb)}
                onDragEnd={() => setIsDragging(false)}
                className="group relative flex items-center gap-3 p-3 rounded-lg border bg-white cursor-grab active:cursor-grabbing transition-all hover:shadow-md hover:-translate-y-0.5"
                style={{
                    borderColor: style.border,
                    boxShadow: `0 2px 0 ${style.border}` // Tactile "thick" border at bottom
                }}
            >
                <div className="w-1.5 h-8 rounded-full" style={{ backgroundColor: style.text, opacity: 0.2 }}></div>
                <span className="font-medium text-slate-700 text-sm flex-1">{verb}</span>
                <GripVertical size={14} className="text-slate-300 group-hover:text-slate-500" />
            </div>
        );
    };

    const DropSocket = ({ slot, label, number }: { slot: 'verb1' | 'verb2', label: string, number: number }) => {
        const currentVerb = thesis[slot];
        const style = currentVerb ? getVerbStyle(currentVerb) : null;

        return (
            <div className="flex flex-col gap-2 flex-1 min-w-[180px]">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[10px]">{number}</span>
                    {label}
                </div>

                <div
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, slot)}
                    className={`
                        relative h-20 rounded-xl border-2 flex items-center justify-center transition-all duration-200
                        ${currentVerb
                            ? 'bg-white shadow-sm border-transparent'
                            : 'border-dashed border-slate-200 bg-slate-50 inner-shadow-sm' // "Empty Socket" feel
                        }
                        ${isDragging && !currentVerb ? 'border-blue-400 bg-blue-50/50 scale-[1.02] shadow-[0_0_0_4px_rgba(59,130,246,0.1)]' : ''}
                    `}
                    style={currentVerb ? {
                        backgroundColor: style?.bg,
                        borderColor: style?.border,
                        boxShadow: `0 4px 12px ${style?.shadow}`
                    } : {}}
                >
                    {currentVerb ? (
                        <>
                            <span className="text-lg font-serif font-bold" style={{ color: style?.text }}>
                                {currentVerb}ing
                            </span>
                            <button
                                onClick={() => setThesis(p => ({ ...p, [slot]: null }))}
                                className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-sm border border-gray-100 text-slate-400 hover:text-red-500 hover:scale-110 transition-all"
                            >
                                <X size={12} />
                            </button>
                        </>
                    ) : (
                        <span className={`text-sm font-medium transition-colors ${isDragging ? 'text-blue-500' : 'text-slate-300'}`}>
                            Drop Strategy
                        </span>
                    )}
                </div>
            </div>
        );
    };

    if (loading) {
        return <div className="h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-blue-900" /></div>;
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
            {/* Top Navigation Bar */}
            <header className="bg-white border-b border-slate-200 px-6 py-3 flex justify-between items-center sticky top-0 z-20 shadow-sm">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
                        <ArrowLeft size={18} />
                    </button>
                    <div className="h-6 w-px bg-slate-200"></div>
                    <div className="flex items-center gap-2 text-slate-700">
                        <Layout size={18} className="text-blue-600" />
                        <span className="font-bold">Architect's Desk</span>
                        <span className="text-slate-300 mx-1">/</span>
                        <span className="text-sm text-slate-500">{assignmentTitle}</span>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => navigate(`/assignment/${id}`)} className="btn btn-ghost text-xs flex items-center gap-2 text-slate-500 hover:text-blue-600">
                        <BookOpen size={14} /> View Text
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!thesis.verb1 || !thesis.verb2 || !thesis.purpose}
                        className="btn btn-primary bg-blue-600 hover:bg-blue-700 text-white text-xs px-5 py-2 rounded-full shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:shadow-none transition-all flex items-center gap-2"
                    >
                        <Save size={14} /> Save Thesis
                    </button>
                </div>
            </header>

            <main className="flex-1 flex overflow-hidden">

                {/* LEFT: Inventory (Narrower, cleaner) */}
                <div className="w-72 bg-white border-r border-slate-200 flex flex-col z-10 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
                    <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Evidence Bank</h2>
                        <p className="text-[10px] text-slate-400">Drag items to the board.</p>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin scrollbar-thumb-slate-200">
                        {collectedVerbs.length === 0 ? (
                            <div className="p-6 border-2 border-dashed border-slate-100 rounded-xl text-center">
                                <p className="text-xs text-slate-400">No annotations found.</p>
                            </div>
                        ) : (
                            collectedVerbs.map(verb => <DraggableToken key={verb} verb={verb} />)
                        )}
                    </div>
                </div>

                {/* RIGHT: Construction Canvas */}
                <div className="flex-1 bg-[#f8fafc] relative flex flex-col overflow-hidden">

                    {/* 1. The Live Preview (Sticky & Elegant) */}
                    <div className="bg-white/80 backdrop-blur-md border-b border-blue-100 p-8 text-center z-10 shadow-sm">
                        <div className="max-w-4xl mx-auto">
                            <div className="mb-2 flex items-center justify-center gap-2">
                                <Sparkles size={14} className="text-amber-400" />
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live Preview</span>
                            </div>
                            <p className="font-serif text-2xl text-slate-700 leading-relaxed">
                                <span className="font-bold text-slate-900">{authorName}</span> begins by
                                <span className={`mx-2 px-2 py-0.5 rounded transition-all ${thesis.verb1 ? 'bg-blue-50 text-blue-700 font-bold border-b-2 border-blue-200' : 'text-slate-300 italic border-b-2 border-dashed border-slate-200'}`}>
                                    {thesis.verb1 ? `${thesis.verb1}ing` : "strategy"}
                                </span>
                                , then shifts to
                                <span className={`mx-2 px-2 py-0.5 rounded transition-all ${thesis.verb2 ? 'bg-blue-50 text-blue-700 font-bold border-b-2 border-blue-200' : 'text-slate-300 italic border-b-2 border-dashed border-slate-200'}`}>
                                    {thesis.verb2 ? `${thesis.verb2}ing` : "strategy"}
                                </span>
                                {' '}in order to{' '}
                                <span className={`mx-2 px-2 py-0.5 rounded transition-all ${thesis.purpose ? 'bg-amber-50 text-amber-800 font-bold border-b-2 border-amber-200' : 'text-slate-300 italic border-b-2 border-dashed border-slate-200'}`}>
                                    {thesis.purpose || "universal purpose"}
                                </span>.
                            </p>
                        </div>
                    </div>

                    {/* 2. The Workspace (Center Stage) */}
                    <div className="flex-1 overflow-y-auto p-10 flex items-center justify-center">
                        {/* Subtle Grid Background */}
                        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '32px 32px', opacity: 0.4 }}></div>

                        <div className="w-full max-w-5xl space-y-8 relative">

                            {/* The Flow Chart */}
                            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200/60">
                                <div className="flex items-center gap-6">
                                    {/* Static Author Node */}
                                    <div className="flex flex-col gap-2 w-40 shrink-0">
                                        <div className="text-xs font-bold uppercase tracking-widest text-slate-400 text-center">Speaker</div>
                                        <div className="h-20 flex items-center justify-center bg-slate-50 rounded-xl border border-slate-200 font-bold text-slate-600 text-center px-4 text-sm">
                                            {authorName}
                                        </div>
                                    </div>

                                    {/* Flow Connector 1 */}
                                    <div className="flex-1 h-px bg-slate-200 relative">
                                        <div className="absolute right-0 -top-1.5 text-slate-300"><ArrowRight size={16} /></div>
                                    </div>

                                    {/* Slot 1 */}
                                    <DropSocket slot="verb1" label="Initial Strategy" number={1} />

                                    {/* Flow Connector 2 */}
                                    <div className="flex-1 h-px bg-slate-200 relative">
                                        <div className="absolute right-0 -top-1.5 text-slate-300"><ArrowRight size={16} /></div>
                                    </div>

                                    {/* Slot 2 */}
                                    <DropSocket slot="verb2" label="Shift / Evolution" number={2} />
                                </div>
                            </div>

                            {/* The Purpose Block */}
                            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200/60">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                                        <Sparkles size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Step 3: The "In Order To"</label>
                                        <div className="flex items-center gap-4">
                                            <span className="text-xl font-serif italic text-slate-300">...in order to</span>
                                            <input
                                                type="text"
                                                value={thesis.purpose}
                                                onChange={(e) => setThesis(p => ({ ...p, purpose: e.target.value }))}
                                                placeholder="convey [message] to the audience..."
                                                className="flex-1 bg-transparent border-b-2 border-slate-100 focus:border-amber-400 outline-none py-2 font-serif text-xl text-slate-800 placeholder:text-slate-200 transition-colors"
                                                autoComplete="off"
                                            />
                                        </div>
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
