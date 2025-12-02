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
    textData?: any; // Kept for interface compatibility but unused
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
        <div className="flex h-screen bg-surface overflow-hidden">
            <DragDropContext onDragEnd={handleDragEnd}>

                {/* Left Sidebar: Evidence Bank */}
                <div className="w-[350px] flex-shrink-0 bg-white border-r flex flex-col z-20 shadow-sm">
                    <div className="p-md border-b flex items-center gap-sm">
                        <button onClick={onBack} className="p-xs hover:bg-muted/10 rounded-full transition-colors text-muted">
                            <ArrowLeft size={20} />
                        </button>
                        <h2 className="font-bold text-lg text-primary">Evidence Bank</h2>
                    </div>

                    <div className="flex-1 overflow-y-auto p-md bg-muted/5">
                        <Droppable droppableId="annotations-list" isDropDisabled={true}>
                            {(provided) => (
                                <div
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    className="flex flex-col gap-md"
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
                                                        className={`bg-white border rounded-xl p-md shadow-sm transition-all ${isUsed ? 'opacity-50 grayscale cursor-not-allowed border-dashed' : 'hover:shadow-md hover:border-primary cursor-grab active:cursor-grabbing'
                                                            } ${snapshot.isDragging ? 'shadow-xl ring-2 ring-primary rotate-2 scale-105 z-50' : ''}`}
                                                    >
                                                        <div className="flex items-center justify-between mb-sm">
                                                            <span className="bg-primary/10 text-primary text-xs font-bold px-sm py-xs rounded uppercase tracking-wider">
                                                                {ann.verb}
                                                            </span>
                                                            {isUsed && <span className="text-xs font-bold text-muted uppercase">Selected</span>}
                                                        </div>
                                                        <p className="text-sm text-muted italic font-serif leading-relaxed line-clamp-3 mb-sm">
                                                            "{ann.text}"
                                                        </p>
                                                        {ann.commentary && (
                                                            <div className="text-xs text-muted border-t border-dashed pt-xs truncate">
                                                                <span className="font-bold">Effect:</span> {ann.commentary}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </Draggable>
                                        );
                                    })}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </div>
                </div>

                {/* Main Stage: Builder */}
                <div className="flex-1 flex flex-col bg-surface overflow-hidden relative">
                    <header className="p-md border-b bg-white/50 backdrop-blur-sm z-10 text-center">
                        <h1 className="text-xl font-bold text-primary">Paragraph Architect</h1>
                        <p className="text-sm text-muted">Focus on Reasoning & Organization</p>
                    </header>

                    <div className="flex-1 overflow-y-auto p-xl">
                        <div className="max-w-4xl mx-auto space-y-xl pb-32">

                            {/* Step 1: Claim (The Hero) */}
                            <div className="card p-xl shadow-md border-t-4 border-primary">
                                <div className="flex items-center gap-md mb-lg">
                                    <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg shadow-sm">1</div>
                                    <div>
                                        <h3 className="text-2xl font-bold m-0 text-foreground">Construct Topic Sentence</h3>
                                        <p className="text-muted">Drag a verb card here to establish the focus of your paragraph.</p>
                                    </div>
                                </div>

                                <Droppable droppableId="claim-slot">
                                    {(provided, snapshot) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                            className={`min-h-[160px] border-2 border-dashed rounded-xl flex items-center justify-center p-xl transition-all duration-300 ${snapshot.isDraggingOver ? 'border-primary bg-primary/5 scale-[1.02]' : 'border-border bg-muted/5'
                                                } ${paragraph.claimVerb ? 'bg-white border-solid border-primary/20' : ''}`}
                                        >
                                            {paragraph.claimVerb ? (
                                                <div className="w-full animate-in fade-in zoom-in-95 duration-300">
                                                    <div className="text-3xl font-bold text-primary mb-md leading-tight text-center">
                                                        The author <span className="underline decoration-4 decoration-accent underline-offset-4">{paragraph.claimVerb.verb.toLowerCase()}s</span>...
                                                    </div>
                                                    {paragraph.claimVerb.commentary && (
                                                        <div className="text-xl text-foreground/80 text-center font-serif italic">
                                                            ...in order to {paragraph.claimVerb.commentary.toLowerCase().replace(/^it /, '').replace(/\.$/, '')}.
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="text-center pointer-events-none">
                                                    <div className="text-muted/40 mb-sm">
                                                        <ArrowLeft size={48} className="mx-auto rotate-180 opacity-50" />
                                                    </div>
                                                    <span className="text-lg font-medium text-muted">Drop Evidence Card Here</span>
                                                </div>
                                            )}
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            </div>

                            {/* Step 2: Evidence */}
                            {paragraph.claimVerb && (
                                <div className="card p-xl shadow-sm animate-in slide-in-from-bottom-8 fade-in duration-500">
                                    <div className="flex items-center gap-md mb-md">
                                        <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center font-bold">2</div>
                                        <h3 className="text-lg font-bold m-0 text-muted-foreground">Evidence</h3>
                                    </div>
                                    <div className="bg-white p-lg rounded-lg border border-border shadow-inner italic font-serif text-lg leading-relaxed text-foreground/80">
                                        <Quote size={24} className="text-accent mb-sm opacity-50" />
                                        "{paragraph.evidence}"
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Commentary */}
                            {paragraph.claimVerb && (
                                <div className="card p-xl shadow-sm animate-in slide-in-from-bottom-8 fade-in duration-500 delay-100">
                                    <div className="flex items-center justify-between mb-md">
                                        <div className="flex items-center gap-md">
                                            <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center font-bold">3</div>
                                            <h3 className="text-lg font-bold m-0 text-muted-foreground">Commentary</h3>
                                        </div>
                                        <div className={`flex items-center gap-xs text-xs font-bold uppercase px-md py-xs rounded-full transition-colors ${isRatioMet ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                                            {isRatioMet ? <Check size={16} /> : <AlertCircle size={16} />}
                                            Ratio: {commentarySentences} / {evidenceSentences * 2} Sentences
                                        </div>
                                    </div>

                                    <textarea
                                        value={paragraph.commentary}
                                        onChange={handleCommentaryChange}
                                        placeholder="Explain HOW the evidence supports your claim and WHY it matters to the audience..."
                                        className={`w-full min-h-[200px] p-lg rounded-xl border text-lg leading-relaxed focus:ring-4 focus:ring-primary/10 outline-none transition-all resize-y ${isRatioMet ? 'border-success focus:border-success' : 'border-border focus:border-primary'
                                            }`}
                                    />

                                    <div className="mt-xl flex justify-end">
                                        <button
                                            className="btn btn-primary btn-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all w-full sm:w-auto"
                                            disabled={!isRatioMet}
                                            onClick={() => onComplete(paragraph)}
                                        >
                                            {isRatioMet ? 'Add Paragraph to Essay' : 'Need More Commentary'}
                                        </button>
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </DragDropContext>
        </div>
    );
};
