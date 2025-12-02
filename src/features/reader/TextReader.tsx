import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    doc, getDoc, setDoc, collection, addDoc, query, where, onSnapshot,
    deleteDoc, updateDoc, serverTimestamp
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { SAMPLE_TEXT } from './data';
import { ParagraphBuilder } from '../writer/ParagraphBuilder';
import { EssayAssembler } from '../writer/EssayAssembler';
import {
    Trash2, PenTool, X, ArrowLeft, Check, FileText, Layers,
    Loader2, ChevronRight, Edit2, Lock, Sparkles, AlertCircle,
    User, Target, Users, Globe, Zap
} from 'lucide-react';
import { RHETORICAL_VERBS } from './data';

interface Annotation {
    id: string;
    text: string;
    verb: string;
    commentary?: string;
    startOffset: number;
    endOffset: number;
    color: string;
    userId?: string;
    assignmentId?: string;
}

interface SpacecatData {
    speaker: string;
    purpose: string;
    audience: string;
    context: string;
    exigence: string;
}

export const TextReader: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [textData, setTextData] = useState(SAMPLE_TEXT);
    const [loading, setLoading] = useState(!!id);
    const [phase, setPhase] = useState<'scavenger' | 'annotation'>('scavenger');
    const [spacecatData, setSpacecatData] = useState<SpacecatData>({
        speaker: '', purpose: '', audience: '', context: '', exigence: ''
    });
    const [isValidating, setIsValidating] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);
    const [showParagraphBuilder, setShowParagraphBuilder] = useState(false);
    const [showEssayAssembler, setShowEssayAssembler] = useState(false);
    const [annotations, setAnnotations] = useState<Annotation[]>([]);
    const [selection, setSelection] = useState<{ text: string; range: Range | null; start: number; end: number } | null>(null);
    const [thesis, setThesis] = useState('');
    const [paragraphs, setParagraphs] = useState<any[]>([]);
    const [sidebarMode, setSidebarMode] = useState<'list' | 'create'>('list');
    const [createStep, setCreateStep] = useState<'verb' | 'commentary'>('verb');
    const [selectedVerb, setSelectedVerb] = useState<string | null>(null);
    const [commentary, setCommentary] = useState('');
    const [showAnnotationsList, setShowAnnotationsList] = useState(true);
    const [editingAnnotationId, setEditingAnnotationId] = useState<string | null>(null);
    const [showSpacecatReview, setShowSpacecatReview] = useState(false);

    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchAssignment = async () => {
            if (!id) return;
            setLoading(true);
            try {
                const docRef = doc(db, 'assignments', id);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setTextData({
                        id: id,
                        title: data.title,
                        author: data.author || "Instructor Assigned",
                        date: new Date(data.createdAt?.toDate()).toLocaleDateString(),
                        content: data.content
                    });
                }
            } catch (error) {
                console.error("Error fetching assignment:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAssignment();
    }, [id]);

    useEffect(() => {
        const checkSubmission = async () => {
            if (!user || !id) return;
            try {
                const submissionRef = doc(db, 'submissions', `${user.uid}_${id}`);
                const docSnap = await getDoc(submissionRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    if (data.spacecat) {
                        setSpacecatData(data.spacecat);
                        setPhase('annotation');
                    }
                    if (data.thesisStatement) {
                        setThesis(data.thesisStatement);
                    }
                }
            } catch (error) {
                console.error("Error checking submission:", error);
            }
        };
        checkSubmission();
    }, [user, id]);

    useEffect(() => {
        if (!id || !user) return;
        const q = query(collection(db, 'annotations'), where('assignmentId', '==', id), where('userId', '==', user.uid));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setAnnotations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Annotation)));
        });
        return () => unsubscribe();
    }, [id, user]);

    const getAbsoluteOffset = (container: Node, node: Node, offset: number): number => {
        const range = document.createRange();
        range.selectNodeContents(container);
        range.setEnd(node, offset);
        return range.toString().length;
    };

    const handleMouseUp = () => {
        if (phase === 'scavenger') return;
        const windowSelection = window.getSelection();
        if (!windowSelection || windowSelection.isCollapsed || !contentRef.current) {
            if (sidebarMode === 'list') setSelection(null);
            return;
        }
        const range = windowSelection.getRangeAt(0);
        if (!contentRef.current.contains(range.commonAncestorContainer)) {
            setSelection(null);
            return;
        }
        const start = getAbsoluteOffset(contentRef.current, range.startContainer, range.startOffset);
        const end = start + range.toString().length;
        setSelection({ text: windowSelection.toString(), range: range, start, end });
        setSidebarMode('create');
        setCreateStep('verb');
        setSelectedVerb(null);
        setCommentary('');
        setEditingAnnotationId(null);
    };

    const handleVerbSelect = (verb: string) => {
        setSelectedVerb(verb);
        setCreateStep('commentary');
    };

    const handleEditAnnotation = (ann: Annotation) => {
        setEditingAnnotationId(ann.id);
        setSelectedVerb(ann.verb);
        setCommentary(ann.commentary || '');
        setSelection({ text: ann.text, start: ann.startOffset, end: ann.endOffset, range: null });
        setSidebarMode('create');
        setCreateStep('commentary');
    };

    const handleSaveAnnotation = async () => {
        if (!selection || !selectedVerb || !user || !id) return;
        try {
            if (editingAnnotationId) {
                const annRef = doc(db, 'annotations', editingAnnotationId);
                await updateDoc(annRef, { verb: selectedVerb, commentary: commentary });
            } else {
                await addDoc(collection(db, 'annotations'), {
                    text: selection.text, verb: selectedVerb, commentary: commentary,
                    startOffset: selection.start, endOffset: selection.end, color: '#fef3c7',
                    userId: user.uid, assignmentId: id, createdAt: new Date()
                });
            }
            setSelection(null); setSidebarMode('list'); setCreateStep('verb'); setSelectedVerb(null); setCommentary(''); setEditingAnnotationId(null);
            window.getSelection()?.removeAllRanges();
        } catch (error) {
            console.error("Error saving annotation:", error);
        }
    };

    const handleDeleteAnnotation = async (annotationId: string) => {
        if (!confirm("Delete this annotation?")) return;
        try { await deleteDoc(doc(db, 'annotations', annotationId)); } catch (error) { console.error(error); }
    };

    const handleCancelAnnotation = () => {
        setSelection(null); setSidebarMode('list'); setEditingAnnotationId(null);
        window.getSelection()?.removeAllRanges();
    };

    const handleScrollToAnnotation = (annotationId: string) => {
        const element = document.getElementById(`annotation-${annotationId}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.style.transition = 'background-color 0.5s';
            const originalColor = element.style.backgroundColor;
            element.style.backgroundColor = 'yellow';
            setTimeout(() => { element.style.backgroundColor = originalColor; }, 1000);
        }
    };

    const renderHighlightedContent = () => {
        const text = textData.content;
        const allHighlights = [...annotations];
        if (selection && sidebarMode === 'create' && !editingAnnotationId) {
            allHighlights.push({ id: 'temp-selection', text: selection.text, verb: 'Selecting...', startOffset: selection.start, endOffset: selection.end, color: 'rgba(59, 130, 246, 0.2)' } as Annotation);
        }
        if (allHighlights.length === 0) return text;
        const sorted = allHighlights.sort((a, b) => a.startOffset - b.startOffset);
        const chunks: React.ReactNode[] = [];
        let lastIndex = 0;
        sorted.forEach((ann) => {
            if (ann.startOffset > lastIndex) chunks.push(<span key={`text-${lastIndex}`}>{text.slice(lastIndex, ann.startOffset)}</span>);
            chunks.push(<span key={ann.id} id={`annotation-${ann.id}`} style={{ backgroundColor: ann.id === 'temp-selection' ? ann.color : 'rgba(251, 191, 36, 0.3)', borderBottom: ann.id === 'temp-selection' ? '2px dashed var(--color-primary)' : '2px solid var(--color-accent)', cursor: 'pointer' }} title={ann.verb} onClick={() => { if (ann.id !== 'temp-selection') handleScrollToAnnotation(ann.id); }}>{text.slice(ann.startOffset, ann.endOffset)}</span>);
            lastIndex = ann.endOffset;
        });
        if (lastIndex < text.length) chunks.push(<span key={`text-${lastIndex}`}>{text.slice(lastIndex)}</span>);
        return chunks;
    };

    const renderScavengerContent = () => {
        const paragraphs = textData.content.split('\n\n');
        return <div className="space-y-6">{paragraphs.map((para, index) => {
            const isFirst = index === 0; const isLast = index === paragraphs.length - 1; const isBlurred = !isFirst && !isLast;
            return <p key={index} style={{ filter: isBlurred ? 'blur(5px)' : 'none', userSelect: isBlurred ? 'none' : 'text', opacity: isBlurred ? 0.6 : 1, transition: 'all 0.5s ease' }}>{para}</p>;
        })}</div>;
    };

    const handleSpacecatChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setSpacecatData(prev => ({ ...prev, [name]: value }));
        setValidationError(null);
    };

    const validateSpacecat = async () => {
        setIsValidating(true);
        setValidationError(null);
        const { speaker, purpose, audience, context, exigence } = spacecatData;
        if (speaker.length < 3 || purpose.length < 5 || audience.length < 3 || context.length < 10 || exigence.length < 10) {
            setValidationError("Please provide more detail for all fields."); setIsValidating(false); return;
        }
        try {
            const submissionRef = doc(db, 'submissions', `${user!.uid}_${id}`);
            await setDoc(submissionRef, {
                userId: user!.uid, assignmentId: id, spacecat: spacecatData, status: 'started', updatedAt: serverTimestamp()
            }, { merge: true });
            setPhase('annotation');
        } catch (error) {
            console.error("Error saving progress:", error);
            setPhase('annotation');
        } finally {
            setIsValidating(false);
        }
    };

    const handleParagraphComplete = (paragraph: any) => {
        setParagraphs([...paragraphs, paragraph]);
        setShowParagraphBuilder(false);
    };



    if (loading) return <div className="flex items-center justify-center h-screen"><Loader2 size={32} className="animate-spin text-primary" /></div>;
    if (showEssayAssembler) return <EssayAssembler thesis={thesis} paragraphs={paragraphs} onBack={() => setShowEssayAssembler(false)} />;
    if (showParagraphBuilder) return <ParagraphBuilder annotations={annotations} onBack={() => setShowParagraphBuilder(false)} onComplete={handleParagraphComplete} />;

    return (
        <div className="flex gap-md" style={{ height: 'calc(100vh - 8rem)', overflow: 'hidden', position: 'relative' }}>
            {showSpacecatReview && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-surface w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center p-6 border-b border-border bg-background">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                    <Sparkles size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold font-serif text-primary">Rhetorical Context</h2>
                                    <p className="text-sm text-muted">Your analysis of the rhetorical situation.</p>
                                </div>
                            </div>
                            <button onClick={() => setShowSpacecatReview(false)} className="p-2 hover:bg-muted/10 rounded-full transition-colors text-muted">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto max-h-[70vh] space-y-6">
                            {[
                                { id: 'speaker', label: 'Speaker', icon: <User size={16} />, highlight: 'S' },
                                { id: 'purpose', label: 'Purpose', icon: <Target size={16} />, highlight: 'P' },
                                { id: 'audience', label: 'Audience', icon: <Users size={16} />, highlight: 'A' },
                                { id: 'context', label: 'Context', icon: <Globe size={16} />, highlight: 'C' },
                                { id: 'exigence', label: 'Exigence', icon: <Zap size={16} />, highlight: 'E' }
                            ].map((field) => (
                                <div key={field.id} className="group bg-background border border-border rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-muted">{field.icon}</span>
                                        <span className="text-xs font-bold text-muted uppercase tracking-wider">
                                            <span className="text-primary">{field.highlight}</span>{field.label.slice(1)}
                                        </span>
                                    </div>
                                    <div className="font-serif text-lg text-foreground leading-relaxed">
                                        {spacecatData[field.id as keyof SpacecatData]}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-6 border-t border-border bg-background flex justify-end">
                            <button onClick={() => setShowSpacecatReview(false)} className="btn btn-primary">Close</button>
                        </div>
                    </div>
                </div>
            )}

            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '1rem' }} className="reader-scroll">
                <div style={{ maxWidth: '700px', margin: '0 auto', paddingBottom: '4rem' }}>
                    <header className="mb-lg text-center">
                        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{textData.title}</h1>
                        <div className="text-muted" style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>
                            {textData.author}, {textData.date}
                        </div>
                    </header>
                    <div ref={contentRef} onMouseUp={handleMouseUp} style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', lineHeight: '1.8', color: 'var(--color-text)', whiteSpace: 'pre-wrap' }}>
                        {phase === 'scavenger' ? renderScavengerContent() : renderHighlightedContent()}
                    </div>
                </div>
            </div>

            <div style={{
                width: '320px', minWidth: '320px', borderLeft: '1px solid var(--color-border)', padding: '1.5rem',
                overflowY: 'auto', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-surface)', boxSizing: 'border-box'
            }}>
                {phase === 'scavenger' ? (
                    <div className="flex flex-col h-full">
                        <div className="mb-lg p-md bg-primary/5 rounded-lg border border-primary/10">
                            <div className="flex items-center gap-sm mb-xs text-primary">
                                <div className="p-2 bg-white rounded-full shadow-sm"><Lock size={20} /></div>
                                <h2 className="text-lg font-bold font-serif">The "Space" Check</h2>
                            </div>
                            <p className="text-xs text-muted leading-relaxed ml-1">The text is locked. Identify the rhetorical situation to proceed.</p>
                        </div>
                        <div className="flex flex-col gap-sm flex-1 overflow-y-auto pr-1">
                            {[
                                { id: 'speaker', label: 'Speaker', icon: <User size={16} />, placeholder: 'Who is writing/speaking?', highlight: 'S' },
                                { id: 'purpose', label: 'Purpose', icon: <Target size={16} />, placeholder: 'What do they want to achieve?', highlight: 'P', isArea: true },
                                { id: 'audience', label: 'Audience', icon: <Users size={16} />, placeholder: 'Who is the intended target?', highlight: 'A' },
                                { id: 'context', label: 'Context', icon: <Globe size={16} />, placeholder: 'What is happening in the world?', highlight: 'C', isArea: true },
                                { id: 'exigence', label: 'Exigence', icon: <Zap size={16} />, placeholder: 'Why write this NOW? The spark.', highlight: 'E', isArea: true }
                            ].map((field) => (
                                <div key={field.id} className="group bg-background focus-within:bg-white focus-within:shadow-md focus-within:ring-1 focus-within:ring-primary/20 border border-transparent focus-within:border-primary/50 rounded-lg transition-all duration-200">
                                    <label className="flex items-center gap-xs px-md pt-md pb-xs cursor-text" onClick={() => document.getElementById(field.id)?.focus()}>
                                        <span className="text-muted group-focus-within:text-primary transition-colors">{field.icon}</span>
                                        <span className="text-xs font-bold text-muted uppercase tracking-wider"><span className="text-primary">{field.highlight}</span>{field.label.slice(1)}</span>
                                    </label>
                                    <div className="px-md pb-md">
                                        {field.isArea ? (
                                            <textarea id={field.id} name={field.id} value={spacecatData[field.id as keyof SpacecatData]} onChange={handleSpacecatChange} placeholder={field.placeholder} rows={2} className="w-full bg-transparent border-none outline-none focus:ring-0 p-0 text-sm font-serif text-foreground placeholder:text-muted/50 placeholder:font-sans resize-none shadow-none appearance-none leading-relaxed" />
                                        ) : (
                                            <input id={field.id} type="text" name={field.id} value={spacecatData[field.id as keyof SpacecatData]} onChange={handleSpacecatChange} placeholder={field.placeholder} className="w-full bg-transparent border-none outline-none focus:ring-0 p-0 text-sm font-serif text-foreground placeholder:text-muted/50 placeholder:font-sans resize-none shadow-none appearance-none" />
                                        )}
                                    </div>
                                </div>
                            ))}
                            {validationError && <div className="mt-sm p-sm bg-error/10 text-error text-xs font-medium rounded-md flex items-start gap-sm animate-in slide-in-from-top-1"><AlertCircle size={16} className="mt-0.5 shrink-0" />{validationError}</div>}
                        </div>
                        <div className="mt-lg pt-md border-t border-border">
                            <button onClick={validateSpacecat} disabled={isValidating} className="btn btn-primary w-full py-md text-base font-medium shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-sm">
                                {isValidating ? <><Loader2 size={20} className="animate-spin" /><span>Verifying...</span></> : <><Sparkles size={20} /><span>Unlock Text</span></>}
                            </button>
                        </div>
                    </div>
                ) : (
                    // PHASE 2: ANNOTATION
                    <>
                        {sidebarMode === 'list' ? (
                            <>
                                <div className="flex justify-between items-center mb-md cursor-pointer hover:bg-muted/10 p-sm rounded" onClick={() => setShowAnnotationsList(!showAnnotationsList)}>
                                    <div className="flex items-center gap-sm">
                                        <ChevronRight size={16} style={{ transform: showAnnotationsList ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                                        <h3 className="text-sans" style={{ fontSize: '1rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Annotations ({annotations.length})</h3>
                                    </div>
                                </div>
                                {showAnnotationsList && (
                                    <div className="flex flex-col gap-md transition-all" style={{ flex: 1, overflowY: 'auto', maxHeight: '50vh' }}>
                                        {annotations.map(ann => (
                                            <div key={ann.id} className="card hover:border-primary cursor-pointer transition-colors" style={{ padding: '1rem', borderLeft: '4px solid var(--color-accent)' }} onClick={() => handleScrollToAnnotation(ann.id)}>
                                                <div className="flex justify-between items-start mb-sm">
                                                    <span style={{ backgroundColor: 'var(--color-primary)', color: 'white', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 600, textTransform: 'uppercase' }}>{ann.verb}</span>
                                                    <div className="flex items-center gap-xs">
                                                        <button onClick={(e) => { e.stopPropagation(); handleEditAnnotation(ann); }} className="p-1 hover:bg-muted/20 rounded text-muted hover:text-primary transition-colors" title="Edit"><Edit2 size={14} /></button>
                                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteAnnotation(ann.id); }} className="p-1 hover:bg-muted/20 rounded text-muted hover:text-destructive transition-colors" title="Delete"><Trash2 size={14} /></button>
                                                    </div>
                                                </div>
                                                <div style={{ fontSize: '0.9rem', fontStyle: 'italic', color: 'var(--color-text-muted)', borderLeft: '2px solid var(--color-border)', paddingLeft: '0.5rem', marginBottom: '0.5rem' }}>"{ann.text}"</div>
                                                {ann.commentary && <div style={{ fontSize: '0.85rem', color: 'var(--color-text)', backgroundColor: 'var(--color-background)', padding: '0.5rem', borderRadius: '4px' }}><span style={{ fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.25rem' }}>Effect:</span>{ann.commentary}</div>}
                                            </div>
                                        ))}
                                        {annotations.length === 0 && <div className="text-muted text-center" style={{ fontSize: '0.9rem', fontStyle: 'italic', marginTop: '2rem' }}>Select text to start analyzing.</div>}
                                    </div>
                                )}
                                <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--color-border)', display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
                                    <button
                                        className="btn btn-outline text-success border-success hover:bg-success/10"
                                        style={{ width: '100%' }}
                                        onClick={() => setShowSpacecatReview(true)}
                                    >
                                        <Check size={18} style={{ marginRight: '0.5rem' }} />
                                        Context Analyzed (SPACECAT)
                                    </button>
                                    <button
                                        className="btn btn-outline"
                                        style={{ width: '100%' }}
                                        onClick={() => navigate(`/assignment/${id}/thesis`)}
                                    >
                                        <PenTool size={18} style={{ marginRight: '0.5rem' }} />
                                        Enter Architect Mode
                                    </button>
                                    <button className="btn btn-outline" style={{ width: '100%' }} onClick={() => setShowParagraphBuilder(true)} disabled={annotations.length === 0}><FileText size={18} style={{ marginRight: '0.5rem' }} />Build Paragraph</button>
                                    <button className="btn btn-outline" style={{ width: '100%' }} onClick={() => setShowEssayAssembler(true)} disabled={!thesis && paragraphs.length === 0}><Layers size={18} style={{ marginRight: '0.5rem' }} />View Essay Skeleton ({paragraphs.length})</button>
                                </div>
                            </>
                        ) : (
                            // ANNOTATION CREATE MODE
                            <div className="flex flex-col h-full">
                                <div className="flex justify-between items-center mb-md pb-sm border-b">
                                    <h3 className="text-sans" style={{ fontSize: '1rem', color: 'var(--color-primary)', fontWeight: 700, margin: 0 }}>{editingAnnotationId ? 'Edit Analysis' : 'New Analysis'}</h3>
                                    <button onClick={handleCancelAnnotation} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}><X size={18} /></button>
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
                                                <div style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 700, marginBottom: '0.5rem', textTransform: 'uppercase' }}>{category.category}</div>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                                    {category.verbs.map((verb) => (
                                                        <button key={verb} onClick={() => handleVerbSelect(verb)} className={`btn ${selectedVerb === verb ? 'btn-primary' : 'btn-outline'}`} style={{ fontSize: '0.8rem', padding: '0.5rem', justifyContent: 'flex-start' }}>{verb}</button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col h-full">
                                        <button onClick={() => setCreateStep('verb')} className="text-muted mb-md flex items-center gap-xs" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem' }}><ArrowLeft size={14} /> Back to verbs</button>
                                        <div className="mb-lg">
                                            <div className="text-muted" style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Function</div>
                                            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-primary)' }}>{selectedVerb}</div>
                                        </div>
                                        <div className="flex flex-col gap-sm" style={{ flex: 1 }}>
                                            <label style={{ fontSize: '0.9rem', fontWeight: 600 }}>How does this affect the audience?</label>
                                            <textarea value={commentary} onChange={(e) => setCommentary(e.target.value)} placeholder="This contrast highlights [X] in order to make the audience feel/think [Y]..." style={{ flex: 1, width: '100%', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontFamily: 'var(--font-sans)', fontSize: '0.95rem', resize: 'none', lineHeight: '1.6', boxSizing: 'border-box' }} autoFocus />
                                        </div>
                                        <div className="mt-lg pt-md border-t">
                                            <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleSaveAnnotation} disabled={!commentary.trim()}><Check size={18} style={{ marginRight: '0.5rem' }} />{editingAnnotationId ? 'Update Annotation' : 'Save Annotation'}</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};
