import React from 'react';
import { ArrowLeft, Copy, Send, FileText, CheckCircle2, GripVertical } from 'lucide-react';
import type { ParagraphState } from './ParagraphBuilder';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';

interface EssayAssemblerProps {
    thesis: string;
    paragraphs: ParagraphState[];
    onBack: () => void;
    onSubmit: () => void;
    onReorder?: (newOrder: ParagraphState[]) => void;
}

export const EssayAssembler: React.FC<EssayAssemblerProps> = ({ thesis, paragraphs, onBack, onSubmit, onReorder }) => {

    const handleCopy = () => {
        const text = `Thesis: ${thesis}\n\n` + paragraphs.map(p =>
            `Paragraph:\nClaim: ${p.claimVerb?.verb} - ${p.claimVerb?.commentary}\nEvidence: "${p.evidence}"\nCommentary: ${p.commentary}`
        ).join('\n\n');

        navigator.clipboard.writeText(text);
        alert('Essay skeleton copied to clipboard!');
    };

    const handleDragEnd = (result: DropResult) => {
        if (!result.destination || !onReorder) return;
        const items = Array.from(paragraphs);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);
        onReorder(items);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#f8f9fa', overflow: 'hidden' }}>

            <header style={{ padding: '1rem 2rem', backgroundColor: 'white', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={onBack} className="btn btn-ghost" style={{ padding: '0.5rem', color: 'var(--color-text-muted)' }}>
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <FileText size={20} /> Final Assembly
                        </h1>
                        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: 0 }}>Review and submit your argument structure.</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button onClick={handleCopy} className="btn btn-outline" style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Copy size={16} /> Copy to Clipboard
                    </button>
                    <button onClick={onSubmit} className="btn btn-primary" style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--color-success)', borderColor: 'var(--color-success)' }}>
                        <Send size={16} /> Submit Essay
                    </button>
                </div>
            </header>

            <div style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
                <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '4rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    <section className="card" style={{ padding: '2rem', borderLeft: '6px solid var(--color-primary)', backgroundColor: 'white', boxShadow: 'var(--shadow-md)' }}>
                        <h3 style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '1rem', letterSpacing: '0.05em' }}>
                            Thesis Statement
                        </h3>
                        <p style={{ fontSize: '1.25rem', fontFamily: 'var(--font-serif)', lineHeight: 1.6, color: 'var(--color-text)' }}>
                            {thesis || <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>No thesis statement constructed yet.</span>}
                        </p>
                    </section>

                    <div>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-primary)', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span>Body Paragraphs</span>
                            <span style={{ fontSize: '0.8rem', backgroundColor: 'var(--color-background)', padding: '0.2rem 0.6rem', borderRadius: '99px', color: 'var(--color-text-muted)' }}>{paragraphs.length} Total</span>
                        </h3>

                        {paragraphs.length === 0 ? (
                            <div style={{ padding: '3rem', border: '2px dashed var(--color-border)', borderRadius: 'var(--radius-lg)', textAlign: 'center', backgroundColor: 'var(--color-background)' }}>
                                <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>No paragraphs added yet.</p>
                                <button onClick={onBack} className="btn btn-outline" style={{ fontSize: '0.9rem' }}>Go back to Builder</button>
                            </div>
                        ) : (
                            <DragDropContext onDragEnd={handleDragEnd}>
                                <Droppable droppableId="essay-paragraphs">
                                    {(provided) => (
                                        <div {...provided.droppableProps} ref={provided.innerRef} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                            {paragraphs.map((para, index) => (
                                                <Draggable
                                                    key={`${para.id}_${index}`} // UNIQUE KEY FIX
                                                    draggableId={`${para.id}_${index}`} // UNIQUE ID FIX
                                                    index={index}
                                                    isDragDisabled={!onReorder}
                                                >
                                                    {(provided, snapshot) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            className="card"
                                                            style={{
                                                                padding: '0', overflow: 'hidden', backgroundColor: 'white',
                                                                border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)',
                                                                boxShadow: snapshot.isDragging ? 'var(--shadow-lg)' : 'var(--shadow-sm)',
                                                                transform: snapshot.isDragging ? 'scale(1.02)' : 'scale(1)',
                                                                ...provided.draggableProps.style
                                                            }}
                                                        >
                                                            <div
                                                                {...provided.dragHandleProps}
                                                                style={{
                                                                    padding: '1rem 1.5rem', backgroundColor: '#f9fafb', borderBottom: '1px solid var(--color-border)',
                                                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                                    cursor: onReorder ? 'grab' : 'default'
                                                                }}
                                                            >
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                                    {onReorder && <GripVertical size={16} color="var(--color-text-muted)" />}
                                                                    <span style={{ backgroundColor: 'var(--color-primary)', color: 'white', fontSize: '0.7rem', fontWeight: 700, padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                                                                        ¶ {index + 1}
                                                                    </span>
                                                                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text)', textTransform: 'uppercase' }}>
                                                                        Strategy: <span style={{ color: 'var(--color-primary)' }}>{para.claimVerb?.verb || "Unknown"}</span>
                                                                    </span>
                                                                </div>
                                                                <CheckCircle2 size={18} style={{ color: 'var(--color-success)', opacity: 0.5 }} />
                                                            </div>

                                                            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                                                                <div>
                                                                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Topic Sentence Idea</div>
                                                                    <p style={{ fontSize: '1rem', lineHeight: 1.5 }}>{para.claimVerb?.commentary}</p>
                                                                </div>

                                                                <div style={{ paddingLeft: '1rem', borderLeft: '3px solid var(--color-accent)' }}>
                                                                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Evidence</div>
                                                                    <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--color-text)', opacity: 0.9 }}>"{para.evidence}"</p>
                                                                </div>

                                                                <div>
                                                                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Analysis</div>
                                                                    <p style={{ fontSize: '1rem', lineHeight: 1.6, color: 'var(--color-text)' }}>{para.commentary}</p>
                                                                </div>

                                                            </div>
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            </DragDropContext>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};
