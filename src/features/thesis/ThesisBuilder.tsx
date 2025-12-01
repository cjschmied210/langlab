import React, { useState } from 'react';
import { GripVertical, X, ArrowRight, Sparkles, CheckCircle2, Eraser, BookOpen } from 'lucide-react';
import { RHETORICAL_VERBS } from '../reader/data';

interface ThesisBuilderProps {
    authorName: string;
    availableVerbs: string[];
    onClose: () => void;
    onSave: (thesis: string) => void;
}

interface ThesisState {
    verb1: string | null;
    verb2: string | null;
    purpose: string;
}

// "Academic Zen" Color Palette for Categories
const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    "Comparison": { bg: "#dbeafe", text: "#1e40af", border: "#93c5fd" },      // Blue
    "Emphasis": { bg: "#fef3c7", text: "#92400e", border: "#fcd34d" },        // Amber
    "Tone/Emotion": { bg: "#ffe4e6", text: "#9f1239", border: "#fda4af" },    // Rose
    "Logic/Argument": { bg: "#d1fae5", text: "#065f46", border: "#6ee7b7" },  // Emerald
    "Structure": { bg: "#ede9fe", text: "#5b21b6", border: "#c4b5fd" },       // Violet
    "Default": { bg: "#f3f4f6", text: "#374151", border: "#d1d5db" }          // Grey
};

export const ThesisBuilder: React.FC<ThesisBuilderProps> = ({ authorName, availableVerbs, onClose, onSave }) => {
    const [thesis, setThesis] = useState<ThesisState>({
        verb1: null,
        verb2: null,
        purpose: ''
    });
    const [isDragging, setIsDragging] = useState(false);

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

    const handleSave = () => {
        const text = `${authorName} begins by ${thesis.verb1 || '[verb]'}ing, then shifts to ${thesis.verb2 || '[verb]'}ing in order to ${thesis.purpose || '[purpose]'}.`;
        onSave(text);
    };

    const clearSlot = (slot: 'verb1' | 'verb2') => {
        setThesis(prev => ({ ...prev, [slot]: null }));
    };

    const uniqueVerbs = Array.from(new Set(availableVerbs));

    const VerbSlot = ({ slot, label, number }: { slot: 'verb1' | 'verb2', label: string, number: number }) => {
        const currentVerb = thesis[slot];
        const style = currentVerb ? getVerbStyle(currentVerb) : null;

        return (
            <div className="flex flex-col gap-2 relative group flex-1">
                <div className="text-xs font-bold text-muted uppercase tracking-widest flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px]">{number}</span>
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
                        h-14 rounded-lg border-2 flex items-center justify-center font-medium cursor-default relative transition-all
                        ${!currentVerb && !isDragging ? 'hover:border-primary/50 hover:bg-gray-50' : ''}
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
                        <span className="text-sm opacity-40 pointer-events-none">Drop Verb Here</span>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="bg-surface w-full max-w-5xl h-[85vh] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-white/20"
                style={{ maxWidth: '1100px' }}
            >
                <div className="flex justify-between items-center p-6 border-b border-border bg-background">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                            <Sparkles size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold font-serif text-primary">Thesis Constructor</h2>
                            <p className="text-sm text-muted">Assemble your argument using your collected evidence.</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-muted/10 rounded-full transition-colors text-muted">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    <div className="w-80 bg-background/50 border-r border-border p-6 overflow-y-auto">
                        <h4 className="text-xs font-bold text-muted uppercase mb-4 flex items-center gap-2">
                            <BookOpen size={14} />
                            Available Verbs ({uniqueVerbs.length})
                        </h4>
                        <div className="flex flex-col gap-2">
                            {uniqueVerbs.length === 0 ? (
                                <div className="text-center p-8 border-2 border-dashed border-border rounded-lg text-muted text-sm">
                                    <p>No annotations yet.</p>
                                    <p className="text-xs mt-2">Highlight text in the reader to collect rhetorical verbs.</p>
                                </div>
                            ) : (
                                uniqueVerbs.map(verb => {
                                    const style = getVerbStyle(verb);
                                    return (
                                        <div
                                            key={verb}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, verb)}
                                            className="p-3 rounded-md border cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-all flex items-center justify-between group bg-white"
                                            style={{
                                                borderLeftColor: style.border,
                                                borderLeftWidth: '4px'
                                            }}
                                        >
                                            <span className="font-medium text-sm" style={{ color: style.text }}>{verb}</span>
                                            <GripVertical size={14} className="text-muted/30" />
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col bg-white relative">
                        <div className="bg-primary/5 border-b border-primary/10 p-6 text-center sticky top-0 z-10">
                            <p className="text-xs font-bold text-primary/40 uppercase tracking-widest mb-2">Live Preview</p>
                            <p className="font-serif text-xl text-primary/90 leading-relaxed">
                                <span className="font-bold">{authorName}</span> begins by
                                <span className={`mx-1 px-1 rounded ${thesis.verb1 ? 'bg-primary/10 font-bold' : 'opacity-40 italic'}`}>
                                    {thesis.verb1 ? `${thesis.verb1}ing` : "[verb]"}
                                </span>
                                , then shifts to
                                <span className={`mx-1 px-1 rounded ${thesis.verb2 ? 'bg-primary/10 font-bold' : 'opacity-40 italic'}`}>
                                    {thesis.verb2 ? `${thesis.verb2}ing` : "[verb]"}
                                </span>
                                {' '}in order to{' '}
                                <span className={`mx-1 px-1 rounded ${thesis.purpose ? 'bg-primary/10 font-bold' : 'opacity-40 italic'}`}>
                                    {thesis.purpose || "[state purpose]"}
                                </span>.
                            </p>
                        </div>

                        <div className="flex-1 flex flex-col items-center justify-center p-12 gap-12 overflow-y-auto">
                            <div className="w-full max-w-3xl">
                                <div className="flex items-center gap-4">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="text-xs font-bold text-muted uppercase tracking-widest">Speaker</div>
                                        <div className="h-14 px-6 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center font-bold text-slate-700 shadow-sm">
                                            {authorName}
                                        </div>
                                    </div>
                                    <ArrowRight className="text-muted/20 shrink-0" size={32} />
                                    <VerbSlot slot="verb1" label="Initial Strategy" number={1} />
                                    <ArrowRight className="text-muted/20 shrink-0" size={32} />
                                    <VerbSlot slot="verb2" label="Shift / Evolution" number={2} />
                                </div>
                            </div>

                            <div className="w-full max-w-2xl p-6 bg-background/50 rounded-xl border border-border border-dashed">
                                <div className="text-xs font-bold text-muted uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px]">3</span>
                                    Universal Purpose
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-lg font-serif italic text-muted">...in order to</span>
                                    <input
                                        type="text"
                                        value={thesis.purpose}
                                        onChange={(e) => setThesis(prev => ({ ...prev, purpose: e.target.value }))}
                                        placeholder="convey [message] to the audience..."
                                        className="flex-1 bg-transparent border-b-2 border-primary/20 focus:border-primary outline-none py-2 font-serif text-lg placeholder:text-muted/30 transition-colors"
                                        autoComplete="off"
                                    />
                                </div>
                            </div>

                            <div className="mt-auto pt-8">
                                <button
                                    onClick={handleSave}
                                    disabled={!thesis.verb1 || !thesis.verb2 || !thesis.purpose}
                                    className="btn btn-primary px-10 py-3 text-lg shadow-lg hover:shadow-primary/20 hover:-translate-y-1 transition-all flex items-center gap-2 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none rounded-full"
                                >
                                    <CheckCircle2 size={20} />
                                    Finalize & Save Thesis
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
