import React, { useState } from 'react';
import { GripVertical, ArrowRight, CheckCircle2, Eraser, BookOpen, ChevronDown } from 'lucide-react';
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

// "Academic Zen" Color Palette
const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    "Comparison": { bg: "#dbeafe", text: "#1e40af", border: "#93c5fd" },
    "Emphasis": { bg: "#fef3c7", text: "#92400e", border: "#fcd34d" },
    "Tone/Emotion": { bg: "#ffe4e6", text: "#9f1239", border: "#fda4af" },
    "Logic/Argument": { bg: "#d1fae5", text: "#065f46", border: "#6ee7b7" },
    "Structure": { bg: "#ede9fe", text: "#5b21b6", border: "#c4b5fd" },
    "Default": { bg: "#f3f4f6", text: "#374151", border: "#d1d5db" }
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
                        h-12 rounded-md border-2 flex items-center justify-center font-serif font-medium cursor-default relative transition-all
                        ${!currentVerb && !isDragging ? 'hover:border-primary/30 hover:bg-gray-50' : ''}
                    `}
                >
                    {currentVerb ? (
                        <>
                            <span className="text-base">{currentVerb}ing</span>
                            <button
                                onClick={() => clearSlot(slot)}
                                className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-sm border border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity hover:text-error"
                            >
                                <Eraser size={10} />
                            </button>
                        </>
                    ) : (
                        <span className="text-xs opacity-40 pointer-events-none font-sans uppercase tracking-wide">Drag Verb</span>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div
            className="absolute bottom-0 left-0 right-[340px] bg-surface border-t border-primary/20 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] z-50 flex flex-col animate-in slide-in-from-bottom-10 duration-300"
            style={{ height: '400px', position: 'absolute', bottom: 0, left: 0, right: '340px', zIndex: 50 }}
        >
            {/* Header / Close Bar */}
            <div className="flex justify-between items-center px-6 py-2 bg-background border-b border-border">
                <h3 className="text-sm font-bold text-primary font-sans uppercase tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 bg-primary rounded-full"></span>
                    Thesis Builder
                </h3>
                <button onClick={onClose} className="text-muted hover:text-primary transition-colors flex items-center gap-1 text-xs font-medium uppercase tracking-wide">
                    Close <ChevronDown size={16} />
                </button>
            </div>

            <div className="flex flex-1 overflow-hidden">

                {/* LEFT SIDEBAR: Evidence Bank */}
                <div className="w-64 bg-background/30 border-r border-border p-4 overflow-y-auto">
                    <h4 className="text-[10px] font-bold text-muted uppercase mb-3 flex items-center gap-2">
                        <BookOpen size={12} />
                        Evidence Bank
                    </h4>
                    <div className="flex flex-col gap-2">
                        {uniqueVerbs.length === 0 ? (
                            <div className="text-center p-6 border-2 border-dashed border-border rounded-lg text-muted text-xs">
                                Highlight text above to collect rhetorical verbs.
                            </div>
                        ) : (
                            uniqueVerbs.map(verb => {
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
                                        className="px-3 py-2 rounded border cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-all flex items-center justify-between group"
                                    >
                                        <span className="font-medium text-sm font-serif">{verb}</span>
                                        <GripVertical size={12} className="opacity-0 group-hover:opacity-50" />
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* MAIN AREA: Construction Zone */}
                <div className="flex-1 flex flex-col bg-white">

                    {/* 1. Live Sentence Preview (The "Output") */}
                    <div className="flex-1 flex items-center justify-center p-6 bg-primary/5">
                        <p className="font-serif text-xl md:text-2xl text-center leading-relaxed text-foreground/90 max-w-4xl">
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

                    {/* 2. The "Inputs" (The Blocks) */}
                    <div className="h-48 border-t border-border p-6 flex items-center justify-center gap-4 bg-white">

                        {/* Slot 1 */}
                        <VerbSlot slot="verb1" label="Strategy 1" number={1} />

                        <ArrowRight className="text-muted/20 shrink-0 mt-4" size={20} />

                        {/* Slot 2 */}
                        <VerbSlot slot="verb2" label="Shift / Strategy 2" number={2} />

                        <ArrowRight className="text-muted/20 shrink-0 mt-4" size={20} />

                        {/* Purpose Input */}
                        <div className="flex flex-col gap-1 flex-[2] min-w-[200px]">
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
                                    className="w-full h-12 pl-3 pr-10 bg-background border border-border focus:border-primary rounded-md outline-none font-serif text-base placeholder:text-muted/40 placeholder:font-sans transition-colors shadow-inner"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted/30 italic text-xs pointer-events-none font-serif">
                                    ...in order to
                                </span>
                            </div>
                        </div>

                        {/* Save Button */}
                        <button
                            onClick={handleSave}
                            disabled={!thesis.verb1 || !thesis.verb2 || !thesis.purpose}
                            className="h-12 px-6 ml-4 bg-primary hover:bg-primary-light text-white rounded-lg font-medium shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0 disabled:shadow-none flex items-center gap-2 shrink-0"
                        >
                            <CheckCircle2 size={18} />
                            <span className="hidden md:inline">Save Thesis</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
