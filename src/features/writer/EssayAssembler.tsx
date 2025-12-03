import React from 'react';
import { ArrowLeft, Copy, Send, FileText, CheckCircle2, GripVertical } from 'lucide-react';
import type { ParagraphState } from './ParagraphBuilder';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

interface EssayAssemblerProps {
    thesis: string;
    paragraphs: ParagraphState[];
    onBack: () => void;
    onSubmit: () => void;
    onReorder?: (newOrder: ParagraphState[]) => void; // New prop
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
            {/* Header (Same as before) */}
            <header style={{ padding: '1rem 2rem', backgroundColor: 'white', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={onBack} className="btn btn-ghost" style={{ padding: '0.5rem', color: 'var(--color-text-muted)' }}><ArrowLeft size={20} /></button>
                    <div><h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><FileText size={20} /> Final Assembly</h1></div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button onClick={handleCopy} className="btn btn-outline" style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Copy size={16} /> Copy</button>
                    <button onClick={onSubmit} className="btn btn-primary" style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--color-success)', borderColor: 'var(--color-success)' }}><Send size={16} /> Submit Essay</button>
                </div>
            </header>

            {/* Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
                <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '4rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    {/* Thesis */}
                    <section className="card" style={{ padding: '2rem', borderLeft: '6px solid var(--color-primary)', backgroundColor: 'white', boxShadow: 'var(--shadow-md)' }}>
                        <h3 style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '1rem', letterSpacing: '0.05em' }}>Thesis Statement</h3>
                        <p style={{ fontSize: '1.25rem', fontFamily: 'var(--font-serif)', lineHeight: 1.6, color: 'var(--color-text)' }}>{thesis || "No thesis yet."}</p>
                    </section>

                    {/* Draggable Paragraphs */}
                    <DragDropContext onDragEnd={handleDragEnd}>
                        <Droppable droppableId="essay-paragraphs">
                            {(provided) => (
                                <div {...provided.droppableProps} ref={provided.innerRef} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    {paragraphs.map((para, index) => (
                                        <Draggable key={para.id || index} draggableId={para.id || String(index)} index={index} isDragDisabled={!onReorder}>
                                            {(provided, snapshot) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    className="card"
                                                    style={{
                                                        padding: '0', overflow: 'hidden', backgroundColor: 'white',
                                                        border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)',
                                                        boxShadow: snapshot.isDragging ? 'var(--shadow-lg)' : 'var(--shadow-sm)',
                                                        ...provided.draggableProps.style
                                                    }}
                                                >
                                                    <div {...provided.dragHandleProps} style={{ padding: '1rem 1.5rem', backgroundColor: '#f9fafb', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: onReorder ? 'grab' : 'default' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                            <GripVertical size={16} color="var(--color-text-muted)" />
                                                            <span style={{ backgroundColor: 'var(--color-primary)', color: 'white', fontSize: '0.7rem', fontWeight: 700, padding: '0.25rem 0.5rem', borderRadius: '4px' }}>¶ {index + 1}</span>
                                                            <span style={{ fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase' }}>Strategy: <span style={{ color: 'var(--color-primary)' }}>{para.claimVerb?.verb}</span></span>
                                                        </div>
                                                    </div>
                                                    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                                        <div>
                                                            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Analysis</div>
                                                            <p style={{ fontSize: '1rem', lineHeight: 1.6 }}>{para.commentary}</p>
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
                </div>
            </div>
        </div>
    );
};
