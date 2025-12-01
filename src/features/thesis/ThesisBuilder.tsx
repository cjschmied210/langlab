import React, { useState } from 'react';
import { GripVertical, X, ArrowRight, Sparkles, CheckCircle2, Eraser } from 'lucide-react';
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

// Academic Zen Color Palette for Categories
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

    // Helper to find verb category color
    const getVerbStyle = (verb: string) => {
        const category = RHETORICAL_VERBS.find(cat => cat.verbs.includes(verb))?.category || "Default";
        return CATEGORY_COLORS[category] || CATEGORY_COLORS["Default"];
    };

    const handleDragStart = (e: React.DragEvent, verb: string) => {
        e.dataTransfer.setData('text/plain', verb);
        setIsDragging(true);
    };

    const handleDragEnd = () => {
        setIsDragging(false);
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

    // Deduplicate verbs
    const uniqueVerbs = Array.from(new Set(availableVerbs));

    // Interactive Slot Component
    const VerbSlot = ({ slot, label }: { slot: 'verb1' | 'verb2', label: string }) => {
        const currentVerb = thesis[slot];
        const style = currentVerb ? getVerbStyle(currentVerb) : null;

        return (
            <div className="flex flex-col items-center gap-2 relative group">
                <div className="text-xs font-bold text-muted uppercase tracking-widest">{label}</div>
                <div
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, slot)}
                    style={{
                        minWidth: '160px',
                        height: '50px',
                        backgroundColor: currentVerb ? style?.bg : (isDragging ? '#f0f9ff' : 'transparent'),
                        borderColor: currentVerb ? style?.border : (isDragging ? 'var(--color-primary)' : 'var(--color-border)'),
                        color: currentVerb ? style?.text : 'var(--color-text-muted)',
                        borderWidth: '2px',
                        borderStyle: currentVerb ? 'solid' : 'dashed',
                        transition: 'all 0.2s ease'
                    }}
                    className="rounded-lg flex items-center justify-center font-medium cursor-default relative"
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
                        <span className="text-sm opacity-50">Drop Verb Here</span>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            height: '450px',
            backgroundColor: '#ffffff',
            borderTop: '1px solid var(--color-border)',
            boxShadow: '0 -4px 20px rgba(0,0,0,0.1)',
            zIndex: 500,
            display: 'flex',
            flexDirection: 'column',
            animation: 'slideUp 0.3s ease-out'
        }}>
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-border bg-background/50 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <Sparkles size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold font-serif text-primary">Thesis Constructor</h3>
                        <p className="text-xs text-muted">Drag collected verbs to build your argument structure.</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-muted/10 rounded-full transition-colors text-muted">
                    <X size={20} />
                </button>
            </div>

            <div className="flex h-full overflow-hidden">

                {/* LEFT: Source Verbs */}
                <div className="w-72 border-r border-border p-6 overflow-y-auto bg-background/30">
                    <h4 className="text-xs font-bold text-muted uppercase mb-4 flex items-center gap-2">
                        <GripVertical size={14} />
                        Evidence Bank
                    </h4>
                    <div className="flex flex-col gap-2">
                        {uniqueVerbs.length === 0 ? (
                            <div className="text-center p-8 border-2 border-dashed border-border rounded-lg text-muted text-sm">
                                No annotations yet. <br />Highlight text to collect verbs.
                            </div>
                        ) : (
                            uniqueVerbs.map(verb => {
                                const style = getVerbStyle(verb);
                                return (
                                    <div
                                        key={verb}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, verb)}
                                        onDragEnd={handleDragEnd}
                                        style={{
                                            backgroundColor: style.bg,
                                            borderColor: style.border,
                                            color: style.text
                                        }}
                                        className="p-3 rounded-md border cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-all flex items-center justify-between group"
                                    >
                                        <span className="font-medium">{verb}</span>
                                        <GripVertical size={14} className="opacity-0 group-hover:opacity-50" />
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* RIGHT: Construction Zone */}
                <div className="flex-1 flex flex-col relative">
                    {/* Live Preview Banner */}
                    <div className="bg-primary/5 border-b border-primary/10 p-4 text-center">
                        <p className="font-serif text-lg text-primary/80 leading-relaxed max-w-3xl mx-auto">
                            <span className="font-bold text-primary">{authorName}</span> begins by
                            <span className={thesis.verb1 ? "font-bold mx-1 border-b-2 border-primary" : "opacity-50 italic mx-1"}>
                                {thesis.verb1 ? `${thesis.verb1}ing` : "[verb]"}
                            </span>
                            , then shifts to
                            <span className={thesis.verb2 ? "font-bold mx-1 border-b-2 border-primary" : "opacity-50 italic mx-1"}>
                                {thesis.verb2 ? `${thesis.verb2}ing` : "[verb]"}
                            </span>
                            {' '}in order to{' '}
                            <span className={thesis.purpose ? "font-bold border-b-2 border-primary" : "opacity-50 italic"}>
                                {thesis.purpose || "[purpose]"}
                            </span>.
                        </p>
                    </div>

                    {/* Builder Canvas */}
                    <div className="flex-1 flex flex-col items-center justify-center p-8 gap-8">

                        {/* The Flow */}
                        <div className="flex items-center gap-4 w-full max-w-4xl justify-center">

                            {/* Author Block (Static) */}
                            <div className="flex flex-col items-center gap-2">
                                <div className="text-xs font-bold text-muted uppercase tracking-widest">Speaker</div>
                                <div className="h-[50px] px-6 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center font-bold text-slate-700 shadow-sm">
                                    {authorName}
                                </div>
                            </div>

                            <ArrowRight className="text-muted/30" size={24} />

                            {/* Verb 1 Slot */}
                            <VerbSlot slot="verb1" label="Strategy 1" />

                            <ArrowRight className="text-muted/30" size={24} />

                            {/* Verb 2 Slot */}
                            <VerbSlot slot="verb2" label="Strategy 2" />

                            <ArrowRight className="text-muted/30" size={24} />

                            {/* Purpose Input */}
                            <div className="flex flex-col items-center gap-2 flex-1 max-w-xs">
                                <div className="text-xs font-bold text-muted uppercase tracking-widest">Universal Purpose</div>
                                <input
                                    type="text"
                                    value={thesis.purpose}
                                    onChange={(e) => setThesis(prev => ({ ...prev, purpose: e.target.value }))}
                                    placeholder="convey [message]..."
                                    className="w-full h-[50px] px-4 bg-transparent border-b-2 border-primary/30 focus:border-primary outline-none text-center font-serif text-lg placeholder:text-muted/30 transition-colors"
                                />
                            </div>
                        </div>

                        {/* Action Bar */}
                        <div className="mt-8">
                            <button
                                onClick={handleSave}
                                disabled={!thesis.verb1 || !thesis.verb2 || !thesis.purpose}
                                className="btn btn-primary px-8 py-3 text-lg shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all flex items-center gap-2 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
                            >
                                <CheckCircle2 size={20} />
                                Finalize Thesis
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
