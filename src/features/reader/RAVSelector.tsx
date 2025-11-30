import React, { useState } from 'react';
import { RHETORICAL_VERBS } from './data';
import { X, ArrowLeft } from 'lucide-react';

interface RAVSelectorProps {
    position: { top: number; left: number } | null;
    onSelect: (verb: string, commentary: string) => void;
    onClose: () => void;
}

export const RAVSelector: React.FC<RAVSelectorProps> = ({ position, onSelect, onClose }) => {
    const [step, setStep] = useState<'verb' | 'commentary'>('verb');
    const [selectedVerb, setSelectedVerb] = useState<string | null>(null);
    const [commentary, setCommentary] = useState('');

    if (!position) return null;

    const handleVerbClick = (verb: string) => {
        setSelectedVerb(verb);
        setStep('commentary');
    };

    const handleSave = () => {
        if (selectedVerb && commentary.trim()) {
            onSelect(selectedVerb, commentary);
            // Reset state after save
            setStep('verb');
            setSelectedVerb(null);
            setCommentary('');
        }
    };

    return (
        <div
            className="rav-selector"
            style={{
                position: 'absolute',
                top: position.top,
                left: position.left,
                transform: 'translate(-50%, 10px)',
                backgroundColor: 'var(--color-surface)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-lg)',
                border: '1px solid var(--color-border)',
                zIndex: 100,
                width: '320px',
                maxHeight: '400px',
                overflowY: 'auto',
                padding: 'var(--spacing-sm)',
                display: 'flex',
                flexDirection: 'column'
            }}
        >
            {step === 'verb' ? (
                <>
                    <div className="flex justify-between items-center mb-md" style={{ padding: '0 var(--spacing-xs)' }}>
                        <span className="text-muted" style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Select Function
                        </span>
                        <button onClick={onClose} style={{ background: 'none', border: 'none', padding: 0, color: 'var(--color-text-muted)', cursor: 'pointer' }}>
                            <X size={14} />
                        </button>
                    </div>

                    <div className="flex flex-col gap-md">
                        {RHETORICAL_VERBS.map((category) => (
                            <div key={category.category}>
                                <div style={{
                                    fontSize: '0.7rem',
                                    color: 'var(--color-primary)',
                                    fontWeight: 700,
                                    marginBottom: 'var(--spacing-xs)',
                                    paddingLeft: 'var(--spacing-xs)'
                                }}>
                                    {category.category}
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                                    {category.verbs.map((verb) => (
                                        <button
                                            key={verb}
                                            onClick={() => handleVerbClick(verb)}
                                            style={{
                                                textAlign: 'left',
                                                padding: '6px 8px',
                                                fontSize: '0.85rem',
                                                border: '1px solid transparent',
                                                borderRadius: 'var(--radius-sm)',
                                                backgroundColor: 'transparent',
                                                color: 'var(--color-text)',
                                                cursor: 'pointer',
                                                transition: 'all 0.1s'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.backgroundColor = 'var(--color-background)';
                                                e.currentTarget.style.color = 'var(--color-primary)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.backgroundColor = 'transparent';
                                                e.currentTarget.style.color = 'var(--color-text)';
                                            }}
                                        >
                                            {verb}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                <>
                    <div className="flex justify-between items-center mb-md" style={{ padding: '0 var(--spacing-xs)' }}>
                        <button onClick={() => setStep('verb')} style={{ background: 'none', border: 'none', padding: 0, color: 'var(--color-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}>
                            <ArrowLeft size={14} /> Back
                        </button>
                        <button onClick={onClose} style={{ background: 'none', border: 'none', padding: 0, color: 'var(--color-text-muted)', cursor: 'pointer' }}>
                            <X size={14} />
                        </button>
                    </div>

                    <div style={{ padding: '0 var(--spacing-xs)' }}>
                        <div style={{ marginBottom: '1rem' }}>
                            <span className="text-muted" style={{ fontSize: '0.8rem' }}>You selected: </span>
                            <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{selectedVerb}</span>
                        </div>

                        <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                            How does this affect the audience?
                        </label>

                        <textarea
                            value={commentary}
                            onChange={(e) => setCommentary(e.target.value)}
                            placeholder={`This contrast highlights [X] in order to make the audience feel/think [Y]...`}
                            style={{
                                width: '100%',
                                height: '100px',
                                padding: '0.75rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--color-border)',
                                fontFamily: 'var(--font-sans)',
                                fontSize: '0.9rem',
                                marginBottom: '1rem',
                                resize: 'none'
                            }}
                            autoFocus
                        />

                        <button
                            className="btn btn-primary"
                            style={{ width: '100%' }}
                            onClick={handleSave}
                            disabled={!commentary.trim()}
                        >
                            Save Annotation
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};
