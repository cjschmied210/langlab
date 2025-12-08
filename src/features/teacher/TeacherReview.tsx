import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Loader2, ArrowLeft, User as UserIcon } from 'lucide-react';

interface UserProfile {
    uid: string;
    email: string;
    displayName: string;
    photoURL?: string;
    role: 'teacher' | 'student';
    createdAt: Date;
}

interface Annotation {
    id: string;
    text: string;
    verb: string;
    commentary?: string;
    startOffset: number;
    endOffset: number;
    color: string;
    userId: string;
    assignmentId: string;
}

export const TeacherReview: React.FC = () => {
    const { assignmentId } = useParams<{ assignmentId: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [textData, setTextData] = useState<any>(null);
    const [annotations, setAnnotations] = useState<Annotation[]>([]);
    const [students, setStudents] = useState<UserProfile[]>([]);



    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!assignmentId) return;
            setLoading(true);
            try {
                // 1. Fetch Assignment
                const assignDoc = await getDoc(doc(db, 'assignments', assignmentId));
                if (!assignDoc.exists()) {
                    console.error("Assignment not found");
                    return;
                }
                const assignData = assignDoc.data();
                setTextData({
                    title: assignData.title,
                    content: assignData.content,
                    author: "Student Work Review"
                });

                // 2. Fetch All Annotations for this Assignment
                const q = query(
                    collection(db, 'annotations'),
                    where('assignmentId', '==', assignmentId)
                );
                const annSnapshot = await getDocs(q);
                const fetchedAnnotations = annSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as Annotation));
                setAnnotations(fetchedAnnotations);

                // 3. Identify Students and Fetch Profiles
                const studentIds = Array.from(new Set(fetchedAnnotations.map(a => a.userId)));
                if (studentIds.length > 0) {
                    // Firestore 'in' query supports up to 10 items. For robustness, we might need to batch or fetch individually if > 10.
                    // For now, assuming < 10 active students for MVP or just fetching individually.
                    const studentPromises = studentIds.map(uid => getDoc(doc(db, 'users', uid)));
                    const studentDocs = await Promise.all(studentPromises);
                    const fetchedStudents = studentDocs
                        .filter(doc => doc.exists())
                        .map(doc => doc.data() as UserProfile);
                    setStudents(fetchedStudents);
                }

            } catch (error) {
                console.error("Error loading review data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [assignmentId]);



    // State for the new interaction model
    const [selectedAnnotationIds, setSelectedAnnotationIds] = useState<string[]>([]);

    // NEW: State for spacer
    const [spacerHeight, setSpacerHeight] = useState(0);
    const sidebarRef = useRef<HTMLDivElement>(null);

    // Helper to get student name
    const getStudentName = (uid: string) => {
        return students.find(s => s.uid === uid)?.displayName || 'Unknown Student';
    };

    const renderHighlightedContent = () => {
        if (!textData) return null;
        const text = textData.content;

        if (annotations.length === 0) return text;

        // 1. Collect all unique boundaries
        const boundaries = new Set<number>([0, text.length]);
        annotations.forEach(ann => {
            boundaries.add(ann.startOffset);
            boundaries.add(ann.endOffset);
        });
        const sortedBoundaries = Array.from(boundaries).sort((a, b) => a - b);

        // 2. Create segments
        const segments: React.ReactNode[] = [];

        for (let i = 0; i < sortedBoundaries.length - 1; i++) {
            const start = sortedBoundaries[i];
            const end = sortedBoundaries[i + 1];
            const segmentText = text.slice(start, end);

            // Find annotations active in this segment
            const activeAnnotations = annotations.filter(ann =>
                ann.startOffset <= start && ann.endOffset >= end
            );

            if (activeAnnotations.length > 0) {
                // Calculate intensity (Heatmap effect)
                // Cap opacity at 0.6 to ensure readability
                const intensity = Math.min(0.2 + (activeAnnotations.length * 0.15), 0.6);

                // Check if this segment is part of the current selection
                const isSelected = activeAnnotations.some(ann => selectedAnnotationIds.includes(ann.id));

                segments.push(
                    <span
                        key={`${start}-${end}`}
                        onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            if (sidebarRef.current) {
                                const containerRect = sidebarRef.current.getBoundingClientRect();
                                // Offset = Click Top - Container Top - Padding (p-md is approx 1rem/16px)
                                const offset = rect.top - containerRect.top - 16;
                                setSpacerHeight(Math.max(0, offset));
                                sidebarRef.current.scrollTop = 0;
                            }
                            setSelectedAnnotationIds(activeAnnotations.map(a => a.id));
                        }}
                        style={{
                            backgroundColor: isSelected ? 'rgba(251, 191, 36, 0.8)' : `rgba(251, 191, 36, ${intensity})`,
                            cursor: 'pointer',
                            borderBottom: isSelected ? '2px solid var(--color-primary)' : 'none',
                            transition: 'all 0.2s'
                        }}
                        title={`${activeAnnotations.length} annotations`}
                    >
                        {segmentText}
                    </span>
                );
            } else {
                segments.push(<span key={`${start}-${end}`}>{segmentText}</span>);
            }
        }

        return segments;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 size={32} className="animate-spin text-primary" />
            </div>
        );
    }

    // Filter annotations for the sidebar based on selection
    const displayedAnnotations = selectedAnnotationIds.length > 0
        ? annotations.filter(a => selectedAnnotationIds.includes(a.id))
        : []; // Or show all? User said "conjure up corresponding notes", implying filtered view.

    return (
        <div
            className="h-screen w-screen overflow-hidden bg-background"
            style={{
                display: 'grid',
                gridTemplateColumns: '60% 40%',
                alignItems: 'start',
                gap: '0'
            }}
        >
            {/* Main Text Area */}
            <div className="flex flex-col min-w-0 h-full overflow-hidden border-r border-border">
                <header className="flex items-center gap-md p-md border-b border-border bg-surface">
                    <button onClick={() => navigate('/teacher/dashboard')} className="btn btn-ghost">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-lg font-bold">{textData?.title}</h1>
                        <div className="text-sm text-muted">Class Heatmap View</div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-xl">
                    <div className="max-w-3xl mx-auto bg-surface p-xl shadow-sm rounded-lg min-h-full">
                        <div
                            ref={contentRef}
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
            </div>

            {/* Sidebar */}
            <div className="bg-surface flex flex-col h-full overflow-hidden transition-all duration-300 ease-in-out">
                <div className="p-md border-b border-border">
                    <h2 className="font-bold text-lg flex items-center gap-sm">
                        <UserIcon size={20} />
                        Annotation Details
                    </h2>
                    <div className="text-sm text-muted mt-xs">
                        {selectedAnnotationIds.length > 0
                            ? `Showing ${selectedAnnotationIds.length} annotations for selected text.`
                            : "Click on any highlighted text to view student notes."}
                    </div>
                </div>

                <div ref={sidebarRef} className="flex-1 overflow-y-auto p-md flex flex-col gap-md">
                    {/* UPDATE: Insert spacer div */}
                    <div style={{ height: spacerHeight, flexShrink: 0, transition: 'height 0.3s ease' }} />

                    {displayedAnnotations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-muted text-center p-xl opacity-50">
                            <div className="mb-md">👈</div>
                            <div>Select a highlighted section in the text to see what students are saying.</div>
                        </div>
                    ) : (
                        displayedAnnotations.map(ann => (
                            <div
                                key={ann.id}
                                className="card bg-surface"
                                style={{ padding: '1rem', borderLeft: '4px solid var(--color-accent)' }}
                            >
                                <div className="flex justify-between items-start mb-sm">
                                    <div className="flex items-center gap-sm">
                                        <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                                            {getStudentName(ann.userId)[0]}
                                        </div>
                                        <span className="text-xs font-bold text-muted uppercase">
                                            {getStudentName(ann.userId)}
                                        </span>
                                    </div>
                                    <span style={{
                                        backgroundColor: 'var(--color-primary)',
                                        color: 'white',
                                        fontSize: '0.6rem',
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        fontWeight: 600,
                                        textTransform: 'uppercase'
                                    }}>
                                        {ann.verb}
                                    </span>
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
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
