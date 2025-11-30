import React, { useState, useRef } from 'react';
import { SAMPLE_TEXT } from './data';
import { SpacecatModal } from './SpacecatModal';
import { ThesisBuilder } from '../thesis/ThesisBuilder';
import { ParagraphBuilder } from '../writer/ParagraphBuilder';
import { EssayAssembler } from '../writer/EssayAssembler';
import { Trash2, PenTool, X, ArrowLeft, Check, FileText, Layers } from 'lucide-react';
import { RHETORICAL_VERBS } from './data';

interface Annotation {
    id: string;
    text: string;
    verb: string;
    commentary?: string;
    startOffset: number;
    endOffset: number;
    color: string;
}

export const TextReader: React.FC = () => {
    const [isLocked, setIsLocked] = useState(true);
    const [showThesisBuilder, setShowThesisBuilder] = useState(false);
    const [showParagraphBuilder, setShowParagraphBuilder] = useState(false);
    const [showEssayAssembler, setShowEssayAssembler] = useState(false);
    const [annotations, setAnnotations] = useState<Annotation[]>([
        {
            id: 'demo-1',
            text: 'the torch has been passed to a new generation of Americans',
            verb: 'juxtaposes',
            commentary: 'This metaphor emphasizes the transfer of responsibility and the vitality of the new administration.',
            startOffset: 218,
            endOffset: 280,
            color: '#fef3c7'
        },
        {
            id: 'demo-2',
            text: 'Ask not what your country can do for you--ask what you can do for your country',
            verb: 'challenges',
            commentary: 'This famous chiasmus shifts the burden of action from the government to the citizen.',
            startOffset: 3700, // Approximate, just for demo data presence
            endOffset: 3780,
            color: '#fef3c7'
        }
    ]);
    const [selection, setSelection] = useState<{ text: string; range: Range; start: number; end: number } | null>(null);
    const [thesis, setThesis] = useState('Through the use of stirring metaphors and appeals to pathos, JFK unites the American people in a call to service.');
    const [paragraphs, setParagraphs] = useState<any[]>([
        {
            id: 'demo-para-1',
            claimVerb: {
                id: 'demo-1',
                text: 'the torch has been passed to a new generation of Americans',
                verb: 'juxtaposes',
                commentary: 'This metaphor emphasizes the transfer of responsibility and the vitality of the new administration.',
                startOffset: 218,
                endOffset: 280,
                color: '#fef3c7'
            },
            evidence: 'the torch has been passed to a new generation of Americans',
            commentary: 'By comparing leadership to a torch, Kennedy suggests that the presidency is a beacon of light and hope. This implies that the new generation has a duty to keep this fire burning, inspiring the audience to feel a sense of solemn duty.'
        }
    ]);

    // Sidebar State
    const [sidebarMode, setSidebarMode] = useState<'list' | 'create'>('list');
    const [createStep, setCreateStep] = useState<'verb' | 'commentary'>('verb');
    const [selectedVerb, setSelectedVerb] = useState<string | null>(null);
    const [commentary, setCommentary] = useState('');

    const contentRef = useRef<HTMLDivElement>(null);

    // Helper to get absolute offset relative to the container
    const getAbsoluteOffset = (container: Node, node: Node, offset: number): number => {
        const range = document.createRange();
        range.selectNodeContents(container);
        range.setEnd(node, offset);
        return range.toString().length;
    };

    const handleMouseUp = () => {
        if (isLocked) return;

        const windowSelection = window.getSelection();
        if (!windowSelection || windowSelection.isCollapsed || !contentRef.current) {
            // Only clear selection if we aren't in the middle of creating an annotation
            if (sidebarMode === 'list') {
                setSelection(null);
            }
            return;
        }

        const range = windowSelection.getRangeAt(0);

        if (!contentRef.current.contains(range.commonAncestorContainer)) {
            setSelection(null);
            return;
        }

        const start = getAbsoluteOffset(contentRef.current, range.startContainer, range.startOffset);
        const end = start + range.toString().length;

        setSelection({
            text: windowSelection.toString(),
            range: range,
            start,
            end
        });

        // Automatically switch sidebar to create mode
        setSidebarMode('create');
        setCreateStep('verb');
        setSelectedVerb(null);
        setCommentary('');
    };

    const handleVerbSelect = (verb: string) => {
        setSelectedVerb(verb);
        setCreateStep('commentary');
    };

    const handleSaveAnnotation = () => {
        if (!selection || !selectedVerb) return;

        const newAnnotation: Annotation = {
            id: Math.random().toString(36).substr(2, 9),
            text: selection.text,
            verb: selectedVerb,
            commentary: commentary,
            startOffset: selection.start,
            endOffset: selection.end,
            color: '#fef3c7'
        };

        setAnnotations([...annotations, newAnnotation]);

        // Reset state
        setSelection(null);
        setSidebarMode('list');
        setCreateStep('verb');
        setSelectedVerb(null);
        setCommentary('');
        window.getSelection()?.removeAllRanges();
    };

    const handleCancelAnnotation = () => {
        setSelection(null);
        setSidebarMode('list');
        window.getSelection()?.removeAllRanges();
    };

    const renderHighlightedContent = () => {
        const text = SAMPLE_TEXT.content;

        // Combine existing annotations with current selection (if active)
        const allHighlights = [...annotations];
        if (selection && sidebarMode === 'create') {
            allHighlights.push({
                id: 'temp-selection',
                text: selection.text,
                verb: 'Selecting...',
                startOffset: selection.start,
                endOffset: selection.end,
                color: 'rgba(59, 130, 246, 0.2)' // Blue tint for active selection
            } as Annotation);
        }

        if (allHighlights.length === 0) return text;

        const sorted = allHighlights.sort((a, b) => a.startOffset - b.startOffset);
        const chunks: React.ReactNode[] = [];
        let lastIndex = 0;

        sorted.forEach((ann) => {
            if (ann.startOffset > lastIndex) {
                chunks.push(<span key={`text-${lastIndex}`}>{text.slice(lastIndex, ann.startOffset)}</span>);
            }

            chunks.push(
                <span
                    key={ann.id}
                    style={{
                        backgroundColor: ann.id === 'temp-selection' ? ann.color : 'rgba(251, 191, 36, 0.3)',
                        borderBottom: ann.id === 'temp-selection' ? '2px dashed var(--color-primary)' : '2px solid var(--color-accent)',
                        cursor: 'pointer'
                    }}
                    title={ann.verb}
                >
                    {text.slice(ann.startOffset, ann.endOffset)}
                </span>
            );

            lastIndex = ann.endOffset;
        });

        if (lastIndex < text.length) {
            chunks.push(<span key={`text-${lastIndex}`}>{text.slice(lastIndex)}</span>);
        }

        return chunks;
    };

    const handleParagraphComplete = (paragraph: any) => {
        setParagraphs([...paragraphs, paragraph]);
        setShowParagraphBuilder(false);
        // Optional: Show a toast or notification
        alert('Paragraph added to essay!');
    };

    const handleThesisSave = (newThesis: string) => {
        setThesis(newThesis);
        setShowThesisBuilder(false);
        alert('Thesis saved to essay!');
    };

    if (showEssayAssembler) {
        return (
            <EssayAssembler
                thesis={thesis}
                paragraphs={paragraphs}
                onBack={() => setShowEssayAssembler(false)}
            />
        );
    }

    if (showParagraphBuilder) {
        return (
            <ParagraphBuilder
                annotations={annotations}
                onBack={() => setShowParagraphBuilder(false)}
                onComplete={handleParagraphComplete}
            />
        );
    }

    return (
        <div className="flex gap-lg" style={{ height: 'calc(100vh - 8rem)', overflow: 'hidden', position: 'relative' }}>

            {isLocked && (
                <SpacecatModal onUnlock={() => setIsLocked(false)} />
            )}

            {showThesisBuilder && (
                <ThesisBuilder
                    authorName={SAMPLE_TEXT.author}
                    availableVerbs={annotations.map(a => a.verb)}
                    onClose={() => setShowThesisBuilder(false)}
                    onSave={handleThesisSave}
                />
            )}

            {/* Main Reader Area */}
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '2rem', filter: isLocked ? 'blur(5px)' : 'none', pointerEvents: isLocked ? 'none' : 'auto' }} className="reader-scroll">
                <div style={{ maxWidth: '700px', margin: '0 auto', paddingBottom: '4rem' }}>
                    <header className="mb-lg text-center">
                        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{SAMPLE_TEXT.title}</h1>
                        <div className="text-muted" style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>
                            {SAMPLE_TEXT.author}, {SAMPLE_TEXT.date}
                        </div>
                    </header>

                    <div
                        ref={contentRef}
                        onMouseUp={handleMouseUp}
                        style={{
                            fontFamily: 'var(--font-serif)',
                            fontSize: '1.25rem',
                            lineHeight: '1.8',
                            color: 'var(--color-text)',
                            whiteSpace: 'pre-wrap'
                        }}
                    >
                        {renderHighlightedContent()}
                    </div>
                </div>
            </div>

            {/* Dynamic Sidebar */}
            <div style={{
                width: '350px',
                borderLeft: '1px solid var(--color-border)',
                paddingLeft: '1.5rem',
                overflowY: 'auto',
                filter: isLocked ? 'blur(5px)' : 'none',
                pointerEvents: isLocked ? 'none' : 'auto',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'var(--color-surface)'
            }}>

                {sidebarMode === 'list' ? (
                    // MODE: LIST ANNOTATIONS
                    <>
                        <div className="flex justify-between items-center mb-md">
                            <h3 className="text-sans" style={{ fontSize: '1rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                                Annotations ({annotations.length})
                            </h3>
                        </div>

                        <div className="flex flex-col gap-md" style={{ flex: 1, overflowY: 'auto' }}>
                            {annotations.map(ann => (
                                <div key={ann.id} className="card" style={{ padding: '1rem', borderLeft: '4px solid var(--color-accent)' }}>
                                    <div className="flex justify-between items-start mb-sm">
                                        <span style={{
                                            backgroundColor: 'var(--color-primary)',
                                            color: 'white',
                                            fontSize: '0.7rem',
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            fontWeight: 600,
                                            textTransform: 'uppercase'
                                        }}>
                                            {ann.verb}
                                        </span>
                                        <button
                                            onClick={() => setAnnotations(annotations.filter(a => a.id !== ann.id))}
                                            style={{ background: 'none', border: 'none', padding: 0, color: 'var(--color-text-muted)', cursor: 'pointer' }}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                    <div style={{ fontSize: '0.9rem', fontStyle: 'italic', color: 'var(--color-text-muted)', borderLeft: '2px solid var(--color-border)', paddingLeft: '0.5rem', marginBottom: '0.5rem' }}>
                                        "{ann.text}"
                                    </div>
                                    {ann.commentary && (
                                        <div style={{ fontSize: '0.85rem', color: 'var(--color-text)', backgroundColor: 'var(--color-background)', padding: '0.5rem', borderRadius: '4px' }}>
                                            <span style={{ fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.25rem' }}>Effect:</span>
                                            {ann.commentary}
                                        </div>
                                    )}
                                </div>
                            ))}

                            {annotations.length === 0 && (
                                <div className="text-muted text-center" style={{ fontSize: '0.9rem', fontStyle: 'italic', marginTop: '2rem' }}>
                                    Select text to start analyzing.
                                </div>
                            )}
                        </div>

                        <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--color-border)', display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
                            <button
                                className="btn btn-primary"
                                style={{ width: '100%' }}
                                onClick={() => setShowThesisBuilder(true)}
                            >
                                <PenTool size={18} style={{ marginRight: '0.5rem' }} />
                                Build Thesis
                            </button>
                            <button
                                className="btn btn-outline"
                                style={{ width: '100%' }}
                                onClick={() => setShowParagraphBuilder(true)}
                                disabled={annotations.length === 0}
                            >
                                <FileText size={18} style={{ marginRight: '0.5rem' }} />
                                Build Paragraph
                            </button>
                            <button
                                className="btn btn-outline"
                                style={{ width: '100%' }}
                                onClick={() => setShowEssayAssembler(true)}
                                disabled={!thesis && paragraphs.length === 0}
                            >
                                <Layers size={18} style={{ marginRight: '0.5rem' }} />
                                View Essay Skeleton ({paragraphs.length})
                            </button>
                        </div>
                    </>
                ) : (
                    // MODE: CREATE ANNOTATION
                    <div className="flex flex-col h-full">
                        <div className="flex justify-between items-center mb-md pb-sm border-b">
                            <h3 className="text-sans" style={{ fontSize: '1rem', color: 'var(--color-primary)', fontWeight: 700, margin: 0 }}>
                                New Analysis
                            </h3>
                            <button onClick={handleCancelAnnotation} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                                <X size={18} />
                            </button>
                        </div>

                        <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: 'var(--color-background)', borderRadius: 'var(--radius-md)', borderLeft: '3px solid var(--color-primary)' }}>
                            <div className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Selected Text</div>
                            <div style={{ fontSize: '0.9rem', fontStyle: 'italic', maxHeight: '100px', overflowY: 'auto' }}>"{selection?.text}"</div>
                        </div>

                        {createStep === 'verb' ? (
                            <div className="flex flex-col gap-md" style={{ flex: 1, overflowY: 'auto' }}>
                                <div className="text-muted" style={{ fontSize: '0.85rem', fontWeight: 600 }}>What is the author doing?</div>
                                {RHETORICAL_VERBS.map((category) => (
                                    <div key={category.category}>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 700, marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                                            {category.category}
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                            {category.verbs.map((verb) => (
                                                <button
                                                    key={verb}
                                                    onClick={() => handleVerbSelect(verb)}
                                                    className="btn btn-outline"
                                                    style={{ fontSize: '0.8rem', padding: '0.5rem', justifyContent: 'flex-start' }}
                                                >
                                                    {verb}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col h-full">
                                <button
                                    onClick={() => setCreateStep('verb')}
                                    className="text-muted mb-md flex items-center gap-xs"
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem' }}
                                >
                                    <ArrowLeft size={14} /> Back to verbs
                                </button>

                                <div className="mb-lg">
                                    <div className="text-muted" style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Function</div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-primary)' }}>{selectedVerb}</div>
                                </div>

                                <div className="flex flex-col gap-sm" style={{ flex: 1 }}>
                                    <label style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                                        How does this affect the audience?
                                    </label>
                                    <textarea
                                        value={commentary}
                                        onChange={(e) => setCommentary(e.target.value)}
                                        placeholder="This contrast highlights [X] in order to make the audience feel/think [Y]..."
                                        style={{
                                            flex: 1,
                                            width: '100%',
                                            padding: '1rem',
                                            borderRadius: 'var(--radius-md)',
                                            border: '1px solid var(--color-border)',
                                            fontFamily: 'var(--font-sans)',
                                            fontSize: '0.95rem',
                                            resize: 'none',
                                            lineHeight: '1.6'
                                        }}
                                        autoFocus
                                    />
                                </div>

                                <div className="mt-lg pt-md border-t">
                                    <button
                                        className="btn btn-primary"
                                        style={{ width: '100%' }}
                                        onClick={handleSaveAnnotation}
                                        disabled={!commentary.trim()}
                                    >
                                        <Check size={18} style={{ marginRight: '0.5rem' }} />
                                        Save Annotation
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
