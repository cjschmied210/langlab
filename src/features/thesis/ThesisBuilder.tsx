
import React, { useState } from 'react';
import { GripVertical, X } from 'lucide-react';

interface ThesisBuilderProps {
    authorName: string;
    availableVerbs: string[]; // Verbs collected from annotations
    onClose: () => void;
    onSave: (thesis: string) => void;
}

interface ThesisState {
    verb1: string | null;
    verb2: string | null;
    purpose: string;
}

export const ThesisBuilder: React.FC<ThesisBuilderProps> = ({ authorName, availableVerbs, onClose, onSave }) => {
    const [thesis, setThesis] = useState<ThesisState>({
        verb1: null,
        verb2: null,
        purpose: ''
    });

    const handleDragStart = (e: React.DragEvent, verb: string) => {
        e.dataTransfer.setData('text/plain', verb);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent, slot: 'verb1' | 'verb2') => {
        e.preventDefault();
        const verb = e.dataTransfer.getData('text/plain');
        setThesis(prev => ({ ...prev, [slot]: verb }));
    };

    const handleSave = () => {
        const text = `${authorName} begins by ${thesis.verb1 || '[verb]'}ing, then shifts to ${thesis.verb2 || '[verb]'}ing in order to ${thesis.purpose || '[purpose]'}.`;
        onSave(text);
    };

    // Deduplicate verbs
    const uniqueVerbs = Array.from(new Set(availableVerbs));

    return (
        <div style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            height: '350px',
            backgroundColor: 'var(--color-surface)',
            borderTop: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-2xl)',
            zIndex: 500,
            display: 'flex',
            flexDirection: 'column',
            padding: 'var(--spacing-lg)'
        }}>
            <div className="flex justify-between items-center mb-md">
                <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-serif)' }}>Phase 3: Thesis Builder</h3>
                <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                    <X />
                </button>
            </div>

            <div className="flex gap-lg" style={{ height: '100%' }}>
                {/* Source Verbs */}
                <div style={{ width: '250px', borderRight: '1px solid var(--color-border)', paddingRight: '1rem', overflowY: 'auto' }}>
                    <h4 className="text-muted text-sans" style={{ fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '1rem' }}>
                        Your Analytical Verbs
                    </h4>
                    <div className="flex flex-wrap gap-sm">
                        {uniqueVerbs.map(verb => (
                            <div
                                key={verb}
                                draggable
                                onDragStart={(e) => handleDragStart(e, verb)}
                                style={{
                                    padding: '0.5rem 0.75rem',
                                    backgroundColor: 'var(--color-background)',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: 'var(--radius-md)',
                                    cursor: 'grab',
                                    fontSize: '0.9rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.25rem'
                                }}
                            >
                                <GripVertical size={14} className="text-muted" />
                                {verb}
                            </div>
                        ))}
                        {uniqueVerbs.length === 0 && (
                            <p className="text-muted" style={{ fontSize: '0.9rem', fontStyle: 'italic' }}>
                                No annotations yet. Highlight text to collect verbs.
                            </p>
                        )}
                    </div>
                </div>

                {/* Builder Area */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                    <div style={{
                        fontSize: '1.5rem',
                        fontFamily: 'var(--font-serif)',
                        lineHeight: '2.5',
                        textAlign: 'center',
                        maxWidth: '800px'
                    }}>
                        <span style={{ fontWeight: 'bold', color: 'var(--color-primary)' }}>{authorName}</span>
                        {' '}begins by{' '}
                        <span
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, 'verb1')}
                            style={{
                                display: 'inline-block',
                                minWidth: '150px',
                                borderBottom: '2px dashed var(--color-accent)',
                                padding: '0 0.5rem',
                                color: thesis.verb1 ? 'var(--color-text)' : 'var(--color-text-muted)',
                                backgroundColor: thesis.verb1 ? 'var(--color-background)' : 'transparent',
                                cursor: 'default'
                            }}
                        >
                            {thesis.verb1 ? thesis.verb1 + 'ing' : '[verb]'}
                        </span>
                        , then shifts to{' '}
                        <span
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, 'verb2')}
                            style={{
                                display: 'inline-block',
                                minWidth: '150px',
                                borderBottom: '2px dashed var(--color-accent)',
                                padding: '0 0.5rem',
                                color: thesis.verb2 ? 'var(--color-text)' : 'var(--color-text-muted)',
                                backgroundColor: thesis.verb2 ? 'var(--color-background)' : 'transparent',
                                cursor: 'default'
                            }}
                        >
                            {thesis.verb2 ? thesis.verb2 + 'ing' : '[verb]'}
                        </span>
                        {' '}in order to{' '}
                        <input
                            type="text"
                            value={thesis.purpose}
                            onChange={(e) => setThesis(prev => ({ ...prev, purpose: e.target.value }))}
                            placeholder="[state the universal purpose/message]"
                            style={{
                                border: 'none',
                                borderBottom: '2px dashed var(--color-accent)',
                                fontSize: '1.5rem',
                                fontFamily: 'var(--font-serif)',
                                width: '350px',
                                outline: 'none',
                                backgroundColor: 'transparent'
                            }}
                        />
                        .
                    </div>

                    <div className="mt-lg">
                        <button
                            className="btn btn-primary"
                            onClick={handleSave}
                            disabled={!thesis.verb1 || !thesis.verb2 || !thesis.purpose}
                            style={{ opacity: (!thesis.verb1 || !thesis.verb2 || !thesis.purpose) ? 0.5 : 1 }}
                        >
                            Save Thesis
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
