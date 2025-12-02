import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Loader2, Calendar, Sparkles, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Class, Assignment } from '../../types/class';

export const StudentDashboard: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [enrolledClasses, setEnrolledClasses] = useState<Class[]>([]);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [submissions, setSubmissions] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(true);
    const [annotatedAssignmentIds, setAnnotatedAssignmentIds] = useState<Set<string>>(new Set());

    const fetchDashboardData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            // 1. Fetch Classes
            const qClasses = query(collection(db, 'classes'), where('studentIds', 'array-contains', user.uid));
            const classSnapshot = await getDocs(qClasses);
            const classes = classSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Class));
            setEnrolledClasses(classes);

            // 2. Fetch Assignments
            if (classes.length > 0) {
                const classIds = classes.map(c => c.id);
                const qAssignments = query(
                    collection(db, 'assignments'),
                    where('classId', 'in', classIds),
                    where('status', '==', 'active')
                );
                const assignmentSnapshot = await getDocs(qAssignments);
                const fetchedAssignments = assignmentSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    dueDate: doc.data().dueDate?.toDate()
                } as Assignment));

                // Sort by due date
                fetchedAssignments.sort((a, b) => {
                    const dateA = a.dueDate ? a.dueDate.getTime() : 0;
                    const dateB = b.dueDate ? b.dueDate.getTime() : 0;
                    return dateA - dateB;
                });
                setAssignments(fetchedAssignments);

                // 3. Fetch Submissions (Check SPACECAT, Thesis, Paragraphs, Essay)
                const qSubmissions = query(collection(db, 'submissions'), where('userId', '==', user.uid));
                const subSnapshot = await getDocs(qSubmissions);
                const subMap: Record<string, any> = {};
                subSnapshot.forEach(doc => {
                    subMap[doc.data().assignmentId] = doc.data();
                });
                setSubmissions(subMap);

                // 4. Fetch Annotations (Check 1st Step)
                const qAnnotations = query(collection(db, 'annotations'), where('userId', '==', user.uid));
                const annSnapshot = await getDocs(qAnnotations);
                const startedIds = new Set(annSnapshot.docs.map(doc => doc.data().assignmentId));
                setAnnotatedAssignmentIds(startedIds);
            } else {
                setAssignments([]);
            }
        } catch (error) {
            console.error("Error fetching dashboard:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, [user]);

    // Helper to calculate progress
    const getProgress = (assignmentId: string) => {
        const sub = submissions[assignmentId];
        let score = 0;

        // 1. Annotations (20%)
        if (annotatedAssignmentIds.has(assignmentId)) score += 20;

        // 2. SPACECAT (20%)
        if (sub?.spacecat) score += 20;

        // 3. Thesis (20%)
        if (sub?.thesis) score += 20;

        // 4. Paragraphs (20%) - Check if at least one paragraph is built
        if (sub?.paragraphs && sub.paragraphs.length > 0) score += 20;

        // 5. Essay (20%) - Check if submitted
        if (sub?.status === 'submitted') score += 20;

        return score;
    };

    // Helper for time-based greeting
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good morning";
        if (hour < 18) return "Good afternoon";
        return "Good evening";
    };

    if (loading) return <div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin text-primary" /></div>;

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '3rem 1rem' }}>
            <header style={{ marginBottom: '3rem' }}>
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: '1.5rem', flexWrap: 'wrap' }}>
                    <div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Sparkles size={14} style={{ color: 'var(--color-accent)' }} />
                            Student Dashboard
                        </div>
                        <h1 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-serif)', fontWeight: 700, color: 'var(--color-primary)', margin: 0 }}>
                            {getGreeting()}, {user?.displayName?.split(' ')[0]}
                        </h1>
                        <p style={{ color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>Track your progress across reading, analysis, and writing.</p>
                    </div>
                </div>
            </header>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {assignments.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>No active assignments.</div>
                ) : (
                    assignments.map(assignment => {
                        const progress = getProgress(assignment.id);
                        const className = enrolledClasses.find(c => c.id === assignment.classId)?.name || 'Unknown Class';
                        const isDone = progress === 100;

                        return (
                            <div
                                key={assignment.id}
                                onClick={() => navigate(`/assignment/${assignment.id}`)}
                                style={{
                                    backgroundColor: 'white',
                                    borderRadius: 'var(--radius-lg)',
                                    border: '1px solid var(--color-border)',
                                    padding: '1.5rem',
                                    cursor: 'pointer',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    boxShadow: 'var(--shadow-sm)',
                                    transition: 'all 0.2s'
                                }}
                                className="hover-card"
                            >
                                <div style={{
                                    position: 'absolute',
                                    left: 0, top: 0, bottom: 0,
                                    width: '6px',
                                    backgroundColor: isDone ? 'var(--color-success)' : 'var(--color-primary)',
                                    transition: 'background-color 0.2s'
                                }} />

                                <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', gap: '1.5rem', paddingLeft: '1rem' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', border: '1px solid var(--color-border)', padding: '0.125rem 0.5rem', borderRadius: '4px' }}>{className}</span>
                                        </div>
                                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text)', fontFamily: 'var(--font-serif)', marginBottom: '0.25rem' }}>{assignment.title}</h3>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Calendar size={14} /> {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'No Date'}</span>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center', gap: '0.5rem', minWidth: '140px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: isDone ? 'var(--color-success)' : 'var(--color-primary)' }}>{progress}%</span>
                                            {isDone && <CheckCircle2 size={24} style={{ color: 'var(--color-success)' }} />}
                                        </div>

                                        {/* Progress Bar */}
                                        <div style={{ width: '100%', height: '8px', backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: '9999px', overflow: 'hidden' }}>
                                            <div style={{ height: '100%', borderRadius: '9999px', transition: 'all 0.5s', backgroundColor: isDone ? 'var(--color-success)' : 'var(--color-primary)', width: `${progress}%` }} />
                                        </div>

                                        <div style={{ fontSize: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-muted)', fontWeight: 700 }}>
                                            {progress === 0 ? 'Not Started' : isDone ? 'Complete' : 'In Progress'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};
