import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { ArrowLeft, Check, AlertCircle, Quote } from 'lucide-react';

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
}

export const ParagraphBuilder: React.FC<ParagraphBuilderProps> = ({ annotations, onBack, onComplete }) => {
    const [paragraph, setParagraph] = useState<ParagraphState>({
        id: 'p1',
        claimVerb: null,
        evidence: '',
        commentary: ''
    });

    const [commentarySentences, setCommentarySentences] = useState(0);
    const [evidenceSentences, setEvidenceSentences] = useState(0);

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
            // Rough estimate: 1 sentence per ~20 words or split by periods
            setEvidenceSentences(annotation.text.split(/[.!?]+/).filter(Boolean).length || 1);
        }
    };

    const handleCommentaryChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const text = e.target.value;
        setParagraph(prev => ({ ...prev, commentary: text }));

        // Calculate sentence count
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
        setCommentarySentences(sentences);
    };

    const isRatioMet = commentarySentences >= (evidenceSentences * 2);

    return (
        <div className="container" style={{ maxWidth: '1000px', paddingBottom: '4rem' }}>
            <button onClick={onBack} className="btn btn-outline mb-lg">
                <ArrowLeft size={16} style={{ marginRight: '0.5rem' }} /> Back to Reading
            </button>

            <header className="mb-xl text-center">
                <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>The Skeleton Builder</h1>
                <p className="text-muted">Construct your argument. Remember the Golden Ratio: 2 sentences of commentary for every 1 sentence of evidence.</p>
            </header>

            <DragDropContext onDragEnd={handleDragEnd}>
                <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '2rem' }}>

                    {/* Source Material (Annotations) */}
                    <div className="flex flex-col gap-md">
                        <h3 className="text-sans" style={{ fontSize: '1rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Your Evidence Bank
                        </h3>
                        <Droppable droppableId="annotations-list" isDropDisabled={true}>
                            {(provided) => (
                                <div
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    className="flex flex-col gap-sm"
                                >
                                    {annotations.map((ann, index) => (
                                        <Draggable key={ann.id} draggableId={ann.id} index={index}>
                                            {(provided, snapshot) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                    className="card"
                                                    style={{
                                                        padding: '1rem',
                                                        borderLeft: '4px solid var(--color-accent)',
                                                        backgroundColor: snapshot.isDragging ? 'var(--color-surface)' : 'white',
                                                        ...provided.draggableProps.style
                                                    }}
                                                >
                                                    <div style={{ fontWeight: 700, color: 'var(--color-primary)', marginBottom: '0.25rem' }}>
                                                        {ann.verb}
                                                    </div>
                                                    <div style={{ fontSize: '0.8rem', fontStyle: 'italic', color: 'var(--color-text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                        "{ann.text}"
                                                    </div>
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </div>

                    {/* Builder Area */}
                    <div className="flex flex-col gap-xl">

                        {/* Step 1: Claim */}
                        <div className="card" style={{ padding: '2rem' }}>
                            <div className="flex items-center gap-md mb-md">
                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--color-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>1</div>
                                <h3 style={{ margin: 0 }}>Construct Topic Sentence</h3>
                            </div>

                            <p className="text-muted mb-md">Drag a verb card here to establish the focus of this paragraph.</p>

                            <Droppable droppableId="claim-slot">
                                {(provided, snapshot) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        style={{
                                            minHeight: '80px',
                                            border: '2px dashed var(--color-border)',
                                            borderRadius: 'var(--radius-md)',
                                            backgroundColor: snapshot.isDraggingOver ? 'var(--color-background)' : 'transparent',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            padding: '1rem'
                                        }}
                                    >
                                        {paragraph.claimVerb ? (
                                            <div style={{ width: '100%' }}>
                                                <div style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '1.2rem', marginBottom: '0.5rem' }}>
                                                    The author <span style={{ textDecoration: 'underline' }}>{paragraph.claimVerb.verb.toLowerCase()}s</span>...
                                                </div>
                                                {paragraph.claimVerb.commentary && (
                                                    <div style={{ fontSize: '0.9rem', color: 'var(--color-text)' }}>
                                                        ...in order to {paragraph.claimVerb.commentary.toLowerCase().replace(/^it /, '').replace(/\.$/, '')}.
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-muted">Drop Verb Here</span>
                                        )}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </div>

                        {/* Step 2: Evidence (Auto-populated) */}
                        {paragraph.claimVerb && (
                            <div className="card" style={{ padding: '2rem', animation: 'fadeIn 0.5s ease-out' }}>
                                <div className="flex items-center gap-md mb-md">
                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--color-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>2</div>
                                    <h3 style={{ margin: 0 }}>Evidence</h3>
                                </div>

                                <div style={{
                                    padding: '1.5rem',
                                    backgroundColor: 'var(--color-background)',
                                    borderRadius: 'var(--radius-md)',
                                    fontFamily: 'var(--font-serif)',
                                    fontStyle: 'italic',
                                    borderLeft: '4px solid var(--color-text-muted)',
                                    marginBottom: '1rem'
                                }}>
                                    <Quote size={20} style={{ color: 'var(--color-text-muted)', marginBottom: '0.5rem' }} />
                                    <p style={{ margin: 0 }}>"{paragraph.evidence}"</p>
                                </div>
                                <div className="text-muted text-right" style={{ fontSize: '0.8rem' }}>
                                    Estimated Sentences: {evidenceSentences}
                                </div>
                            </div>
                        )}

                        {/* Step 3: Commentary (The 2:1 Enforcer) */}
                        {paragraph.claimVerb && (
                            <div className="card" style={{ padding: '2rem', animation: 'fadeIn 0.5s ease-out 0.2s backwards' }}>
                                <div className="flex items-center gap-md mb-md">
                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--color-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>3</div>
                                    <h3 style={{ margin: 0 }}>Commentary</h3>
                                </div>

                                <div className="flex justify-between items-center mb-sm">
                                    <label style={{ fontWeight: 600 }}>Analyze the evidence:</label>
                                    <div className={`flex items-center gap-xs ${isRatioMet ? 'text-success' : 'text-warning'}`} style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                                        {isRatioMet ? <Check size={16} /> : <AlertCircle size={16} />}
                                        Ratio: {commentarySentences} / {evidenceSentences * 2} sentences
                                    </div>
                                </div>

                                <textarea
                                    value={paragraph.commentary}
                                    onChange={handleCommentaryChange}
                                    placeholder="Explain HOW the evidence supports your claim and WHY it matters to the audience..."
                                    style={{
                                        width: '100%',
                                        minHeight: '150px',
                                        padding: '1rem',
                                        borderRadius: 'var(--radius-md)',
                                        border: `1px solid ${isRatioMet ? 'var(--color-success)' : 'var(--color-border)'}`,
                                        fontFamily: 'var(--font-sans)',
                                        fontSize: '1rem',
                                        lineHeight: '1.6',
                                        resize: 'vertical'
                                    }}
                                />

                                <div className="mt-lg flex justify-end">
                                    <button
                                        className="btn btn-primary"
                                        disabled={!isRatioMet}
                                        style={{ opacity: isRatioMet ? 1 : 0.5, cursor: isRatioMet ? 'pointer' : 'not-allowed' }}
                                        onClick={() => onComplete(paragraph)}
                                    >
                                        {isRatioMet ? 'Add Paragraph to Essay' : 'Need More Commentary'}
                                    </button>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </DragDropContext>
        </div>
    );
};
