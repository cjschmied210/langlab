import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { ArrowLeft, Check, AlertCircle, Quote, BookOpen, X, ChevronUp, ChevronDown } from 'lucide-react';

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
    textData?: {
        title: string;
        author: string;
        content: string;
    };
}

export const ParagraphBuilder: React.FC<ParagraphBuilderProps> = ({ annotations, onBack, onComplete, textData }) => {
    const [paragraph, setParagraph] = useState<ParagraphState>({
        id: 'p1',
        claimVerb: null,
        evidence: '',
        commentary: ''
    });

    const [commentarySentences, setCommentarySentences] = useState(0);
    const [evidenceSentences, setEvidenceSentences] = useState(0);
    const [showText, setShowText] = useState(false);
    const [isDrawerOpen, setIsDrawerOpen] = useState(true);

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
        <div className="flex flex-col h-screen bg-surface overflow-hidden">
            {/* Header */}
            <header className="flex items-center justify-between p-md border-b bg-white z-10">
                <button onClick={onBack} className="btn btn-ghost text-muted hover:text-foreground">
                    <ArrowLeft size={20} className="mr-sm" />
                    Exit Builder
                </button>
                <div className="text-center">
                    <h1 className="text-lg font-bold text-primary">Paragraph Architect</h1>
                    <p className="text-xs text-muted">Focus on Reasoning & Organization</p>
                </div>
                <button
                    onClick={() => setShowText(!showText)}
                    className={`btn ${showText ? 'btn-primary' : 'btn-outline'}`}
                >
                    <BookOpen size={18} className="mr-sm" />
                    {showText ? 'Hide Text' : 'Show Text'}
                </button>
            </header>

            {/* Main Content Area */}
            <div className="flex-1 relative flex overflow-hidden">

                {/* Builder Stage (Center) */}
                <div className="flex-1 overflow-y-auto p-xl pb-64"> {/* Extra padding for drawer */}
                    <div className="max-w-3xl mx-auto space-y-xl">
                        <DragDropContext onDragEnd={handleDragEnd}>

                            {/* Step 1: Claim */}
                            <div className="card p-xl shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-md mb-md">
                                    <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold">1</div>
                                    <h3 className="text-lg font-bold m-0">Construct Topic Sentence</h3>
                                </div>
                                <p className="text-muted mb-md">Drag a verb card from the drawer below to establish your focus.</p>

                                <Droppable droppableId="claim-slot">
                                    {(provided, snapshot) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                            className={`min-h-[100px] border-2 border-dashed rounded-lg flex items-center justify-center p-md transition-colors ${snapshot.isDraggingOver ? 'border-primary bg-primary/5' : 'border-border'
                                                }`}
                                        >
                                            {paragraph.claimVerb ? (
                                                <div className="w-full animate-in fade-in zoom-in-95">
                                                    <div className="text-xl font-bold text-primary mb-sm">
                                                        The author <span className="underline decoration-2 decoration-accent">{paragraph.claimVerb.verb.toLowerCase()}s</span>...
                                                    </div>
                                                    {paragraph.claimVerb.commentary && (
                                                        <div className="text-base text-foreground">
                                                            ...in order to {paragraph.claimVerb.commentary.toLowerCase().replace(/^it /, '').replace(/\.$/, '')}.
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-muted font-medium">Drop Verb Card Here</span>
                                            )}
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            </div>

                            {/* Step 2: Evidence */}
                            {paragraph.claimVerb && (
                                <div className="card p-xl shadow-sm hover:shadow-md transition-shadow animate-in slide-in-from-bottom-4 fade-in duration-500">
                                    <div className="flex items-center gap-md mb-md">
                                        <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold">2</div>
                                        <h3 className="text-lg font-bold m-0">Evidence</h3>
                                    </div>
                                    <div className="bg-muted/10 p-lg rounded-lg border-l-4 border-muted italic font-serif text-lg leading-relaxed mb-sm">
                                        <Quote size={20} className="text-muted mb-xs" />
                                        "{paragraph.evidence}"
                                    </div>
                                    <div className="text-right text-xs text-muted font-bold uppercase">
                                        Estimated Length: {evidenceSentences} sentence{evidenceSentences !== 1 ? 's' : ''}
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Commentary */}
                            {paragraph.claimVerb && (
                                <div className="card p-xl shadow-sm hover:shadow-md transition-shadow animate-in slide-in-from-bottom-4 fade-in duration-500 delay-150">
                                    <div className="flex items-center gap-md mb-md">
                                        <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold">3</div>
                                        <h3 className="text-lg font-bold m-0">Commentary</h3>
                                    </div>

                                    <div className="flex justify-between items-center mb-sm">
                                        <label className="font-semibold text-sm">Analyze the evidence:</label>
                                        <div className={`flex items-center gap-xs text-xs font-bold uppercase px-sm py-xs rounded-full ${isRatioMet ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                                            {isRatioMet ? <Check size={14} /> : <AlertCircle size={14} />}
                                            Ratio: {commentarySentences} / {evidenceSentences * 2} Sentences
                                        </div>
                                    </div>

                                    <textarea
                                        value={paragraph.commentary}
                                        onChange={handleCommentaryChange}
                                        placeholder="Explain HOW the evidence supports your claim and WHY it matters to the audience..."
                                        className={`w-full min-h-[150px] p-md rounded-md border text-base leading-relaxed focus:ring-2 focus:ring-primary/20 outline-none transition-all ${isRatioMet ? 'border-success focus:border-success' : 'border-border focus:border-primary'
                                            }`}
                                    />

                                    <div className="mt-lg flex justify-end">
                                        <button
                                            className="btn btn-primary shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
                                            disabled={!isRatioMet}
                                            onClick={() => onComplete(paragraph)}
                                        >
                                            {isRatioMet ? 'Add Paragraph to Essay' : 'Need More Commentary'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Evidence Drawer (Fixed Bottom) */}
                            <div
                                className={`fixed bottom-0 left-0 right-0 bg-white border-t shadow-[0_-4px_20px_rgba(0,0,0,0.1)] transition-transform duration-300 ease-in-out z-40 ${isDrawerOpen ? 'translate-y-0' : 'translate-y-[calc(100%-40px)]'
                                    }`}
                                style={{ height: '320px' }}
                            >
                                <div
                                    className="h-10 bg-muted/5 border-b flex items-center justify-center cursor-pointer hover:bg-muted/10 transition-colors"
                                    onClick={() => setIsDrawerOpen(!isDrawerOpen)}
                                >
                                    {isDrawerOpen ? <ChevronDown size={20} className="text-muted" /> : <ChevronUp size={20} className="text-muted" />}
                                    <span className="ml-xs text-xs font-bold text-muted uppercase tracking-wider">Evidence Bank ({annotations.length})</span>
                                </div>

                                <div className="p-lg h-full overflow-x-auto">
                                    <Droppable droppableId="annotations-list" direction="horizontal" isDropDisabled={true}>
                                        {(provided) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.droppableProps}
                                                className="flex gap-md pb-lg min-w-max px-md"
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
                                                                    className={`w-[280px] h-[200px] flex-shrink-0 bg-white border rounded-xl p-md flex flex-col shadow-sm transition-all ${isUsed ? 'opacity-50 grayscale cursor-not-allowed border-dashed' : 'hover:shadow-md hover:border-primary cursor-grab active:cursor-grabbing'
                                                                        } ${snapshot.isDragging ? 'shadow-xl ring-2 ring-primary rotate-2 scale-105 z-50' : ''}`}
                                                                >
                                                                    <div className="flex items-center justify-between mb-sm">
                                                                        <span className="bg-primary/10 text-primary text-xs font-bold px-sm py-xs rounded uppercase tracking-wider">
                                                                            {ann.verb}
                                                                        </span>
                                                                        {isUsed && <span className="text-xs font-bold text-muted uppercase">Selected</span>}
                                                                    </div>
                                                                    <div className="flex-1 overflow-hidden relative">
                                                                        <p className="text-sm text-muted italic font-serif leading-relaxed line-clamp-4">
                                                                            "{ann.text}"
                                                                        </p>
                                                                        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent" />
                                                                    </div>
                                                                    {ann.commentary && (
                                                                        <div className="mt-sm pt-sm border-t border-dashed">
                                                                            <p className="text-xs text-muted truncate">
                                                                                <span className="font-bold">Effect:</span> {ann.commentary}
                                                                            </p>
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
                        </DragDropContext>
                    </div>
                </div>

                {/* Text Slide-over Panel */}
                {showText && textData && (
                    <div className="w-[400px] border-l bg-background shadow-xl z-30 flex flex-col animate-in slide-in-from-right duration-300">
                        <div className="p-md border-b flex items-center justify-between bg-white">
                            <h3 className="font-bold text-lg">Source Text</h3>
                            <button onClick={() => setShowText(false)} className="p-xs hover:bg-muted/10 rounded-full">
                                <X size={20} className="text-muted" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-lg">
                            <h2 className="text-xl font-bold mb-xs">{textData.title}</h2>
                            <p className="text-sm text-muted italic mb-lg">{textData.author}</p>
                            <div className="font-serif text-lg leading-relaxed whitespace-pre-wrap text-foreground/90">
                                {textData.content}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
