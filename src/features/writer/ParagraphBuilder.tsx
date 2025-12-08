import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { ArrowLeft, Check, AlertCircle, Quote, X } from 'lucide-react';

interface Annotation {
    id: string;
    text: string;
    verb: string;
    commentary?: string;
}

export interface ParagraphState {
    id: string;
    claimVerb: Annotation | null;
    evidence: string;
    commentary: string;
}

interface ParagraphBuilderProps {
    annotations: Annotation[];
    onBack: () => void;
    onComplete: (paragraph: ParagraphState) => void;
    onCancel?: () => void;
    initialState?: ParagraphState | null;
    textData?: any;
}

export const ParagraphBuilder: React.FC<ParagraphBuilderProps> = ({
    annotations,
    onBack,
    onComplete,
    onCancel,
    initialState
}) => {
    // Helper to create a fresh empty state with a UNIQUE ID
    const createEmptyState = (): ParagraphState => ({
        id: `para_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // <--- UNIQUE ID FIX
        claimVerb: null,
        evidence: '',
        commentary: ''
    });

    const [paragraph, setParagraph] = useState<ParagraphState>(createEmptyState());

    // Load state when editing, or reset when switching to "New"
    useEffect(() => {
        if (initialState) {
            setParagraph(initialState);
        } else {
            setParagraph(createEmptyState());
        }
    }, [initialState]);

    const [commentarySentences, setCommentarySentences] = useState(0);
    const [evidenceSentences, setEvidenceSentences] = useState(0);

    useEffect(() => {
        if (paragraph.evidence) {
            setEvidenceSentences(paragraph.evidence.split(/[.!?]+/).filter(Boolean).length || 1);
        } else {
            setEvidenceSentences(0);
        }

        if (paragraph.commentary) {
            setCommentarySentences(paragraph.commentary.split(/[.!?]+/).filter(s => s.trim().length > 0).length);
        } else {
            setCommentarySentences(0);
        }
    }, [paragraph.evidence, paragraph.commentary]);

    const handleDragEnd = (result: DropResult) => {
        if (!result.destination) return;

        const annotationId = result.draggableId;
        const annotation = annotations.find(a => a.id === annotationId);

        if (annotation && result.destination.droppableId === 'claim-slot') {
            setParagraph(prev => ({
                ...prev,
                claimVerb: annotation,
                evidence: annotation.text
            }));
        }
    };

    const handleCommentaryChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const text = e.target.value;
        setParagraph(prev => ({ ...prev, commentary: text }));
    };

    const isRatioMet = commentarySentences >= (evidenceSentences * 2);
    const isEditing = !!initialState;

    return (
        // SCROLL FIX: Changed height from '100vh' to '100%' to fit in parent container
        <div style={{ display: 'flex', height: '100%', backgroundColor: 'white', overflow: 'hidden' }}>
            <DragDropContext onDragEnd={handleDragEnd}>

                {/* Left Sidebar: Evidence Bank */}
                <div style={{ width: '350px', backgroundColor: 'white', borderRight: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', zIndex: 20 }}>
                    <div style={{ padding: '1rem', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <button onClick={onBack} className="btn btn-ghost" style={{ padding: '0.5rem' }}>
                            <ArrowLeft size={20} />
                        </button>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-primary)', margin: 0 }}>Evidence Bank</h2>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', backgroundColor: 'var(--color-background)' }}>
                        {annotations.length === 0 ? (
                            <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '2rem', fontSize: '0.9rem' }}>
                                {isEditing ? "Editing Paragraph..." : "All evidence used! Select a paragraph below to edit."}
                            </div>
                        ) : (
                            <Droppable droppableId="annotations-list" isDropDisabled={true}>
                                {(provided) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
                                    >
                                        {annotations.map((ann, index) => {
                                            const isUsed = paragraph.claimVerb?.id === ann.id;
                                            return (
                                                <Draggable key={ann.id} draggableId={ann.id} index={index} isDragDisabled={isUsed}>
                                                    {(provided, snapshot) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            className="card"
                                                            style={{
                                                                padding: '1rem',
                                                                borderLeft: '4px solid var(--color-accent)',
                                                                backgroundColor: snapshot.isDragging ? 'var(--color-surface)' : (isUsed ? '#f0f9ff' : 'white'),
                                                                borderColor: isUsed ? 'var(--color-primary)' : 'var(--color-border)',
                                                                opacity: isUsed ? 1 : 1,
                                                                cursor: isUsed ? 'default' : 'grab',
                                                                boxShadow: snapshot.isDragging ? 'var(--shadow-lg)' : 'var(--shadow-sm)',
                                                                ...provided.draggableProps.style
                                                            }}
                                                        >
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
                                                                {isUsed && <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase' }}>Active</span>}
                                                            </div>

                                                            <div style={{
                                                                fontSize: '0.9rem',
                                                                fontStyle: 'italic',
                                                                color: 'var(--color-text-muted)',
                                                                borderLeft: '2px solid var(--color-border)',
                                                                paddingLeft: '0.5rem',
                                                                marginBottom: '0.5rem',
                                                                lineHeight: 1.5
                                                            }}>
                                                                "{ann.text}"
                                                            </div>
                                                        </div>
                                                    )}
                                                </Draggable>
                                            );
                                        })}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        )}
                    </div>
                </div>

                {/* Main Stage: Builder */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#f8f9fa', overflow: 'hidden', position: 'relative' }}>
                    <header style={{ padding: '1rem', borderBottom: '1px solid var(--color-border)', backgroundColor: 'white', textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
                        <div>
                            <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-primary)', margin: 0 }}>
                                {isEditing ? 'Edit Paragraph' : 'Paragraph Architect'}
                            </h1>
                            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: 0 }}>Focus on Reasoning & Organization</p>
                        </div>

                        {isEditing && onCancel && (
                            <button
                                onClick={onCancel}
                                className="btn btn-ghost"
                                style={{ position: 'absolute', right: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}
                            >
                                <X size={16} /> Cancel Edit
                            </button>
                        )}
                    </header>

                    <div style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
                        <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '8rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                            {/* Step 1: Claim */}
                            <div className="card" style={{ padding: '2rem', borderTop: '4px solid var(--color-primary)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--color-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.2rem' }}>1</div>
                                    <div>
                                        <h3 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Construct Topic Sentence</h3>
                                        <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>Drag a verb card here to establish the focus of your paragraph.</p>
                                    </div>
                                </div>

                                <Droppable droppableId="claim-slot">
                                    {(provided, snapshot) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                            style={{
                                                minHeight: '160px',
                                                border: paragraph.claimVerb ? '2px solid var(--color-border)' : '2px dashed var(--color-border)',
                                                borderRadius: 'var(--radius-lg)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                padding: '2rem',
                                                backgroundColor: snapshot.isDraggingOver ? 'var(--color-background)' : (paragraph.claimVerb ? 'white' : '#f9fafb'),
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            {paragraph.claimVerb ? (
                                                <div style={{ width: '100%', textAlign: 'center' }}>
                                                    <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '1rem', lineHeight: 1.4 }}>
                                                        The author <span style={{ textDecoration: 'underline', textDecorationColor: 'var(--color-accent)', textDecorationThickness: '4px', textUnderlineOffset: '4px' }}>{paragraph.claimVerb.verb.toLowerCase()}s</span>...
                                                    </div>
                                                    {paragraph.claimVerb.commentary && (
                                                        <div style={{ fontSize: '1.25rem', color: 'var(--color-text)', fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>
                                                            ...in order to {paragraph.claimVerb.commentary.toLowerCase().replace(/^it /, '').replace(/\.$/, '')}.
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div style={{ textAlign: 'center', pointerEvents: 'none', opacity: 0.5 }}>
                                                    <span style={{ fontSize: '1.1rem', fontWeight: 500, color: 'var(--color-text-muted)' }}>Drop Evidence Card Here</span>
                                                </div>
                                            )}
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            </div>

                            {/* Step 2 & 3 (Evidence & Commentary) */}
                            {paragraph.claimVerb && (
                                <>
                                    <div className="card" style={{ padding: '2rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--color-border)', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>2</div>
                                            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--color-text-muted)' }}>Evidence</h3>
                                        </div>
                                        <div style={{ backgroundColor: '#f9fafb', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontStyle: 'italic', fontFamily: 'var(--font-serif)', fontSize: '1.1rem', lineHeight: 1.6, color: 'var(--color-text)' }}>
                                            <Quote size={24} style={{ color: 'var(--color-accent)', marginBottom: '0.5rem', opacity: 0.5 }} />
                                            "{paragraph.evidence}"
                                        </div>
                                    </div>

                                    <div className="card" style={{ padding: '2rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--color-border)', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>3</div>
                                                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--color-text-muted)' }}>Commentary</h3>
                                            </div>
                                            <div style={{
                                                display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase',
                                                padding: '0.25rem 0.75rem', borderRadius: '999px',
                                                backgroundColor: isRatioMet ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                                color: isRatioMet ? 'var(--color-success)' : '#b45309'
                                            }}>
                                                {isRatioMet ? <Check size={16} /> : <AlertCircle size={16} />}
                                                Ratio: {commentarySentences} / {evidenceSentences * 2} Sentences
                                            </div>
                                        </div>

                                        <textarea
                                            value={paragraph.commentary}
                                            onChange={handleCommentaryChange}
                                            placeholder="Explain HOW the evidence supports your claim and WHY it matters to the audience..."
                                            style={{
                                                width: '100%', minHeight: '200px', padding: '1.5rem', borderRadius: 'var(--radius-md)',
                                                border: `1px solid ${isRatioMet ? 'var(--color-success)' : 'var(--color-border)'}`,
                                                fontSize: '1.1rem', lineHeight: 1.6, fontFamily: 'var(--font-sans)', outline: 'none', resize: 'vertical'
                                            }}
                                        />

                                        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                                            <button
                                                className="btn btn-primary"
                                                style={{ padding: '0.75rem 2rem', fontSize: '1rem' }}
                                                disabled={!isRatioMet}
                                                onClick={() => onComplete(paragraph)}
                                            >
                                                {isEditing ? 'Update Paragraph' : 'Add Paragraph to Essay'}
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </DragDropContext>
        </div>
    );
};
