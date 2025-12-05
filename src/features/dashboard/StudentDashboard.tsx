import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Loader2, Calendar, ChevronRight, Clock, BookOpen, Sparkles, Play, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Class, Assignment } from '../../types/class';

export const StudentDashboard: React.FC = () => {
    const { user, userProfile } = useAuth(); // <--- Added userProfile here
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

                // 3. Fetch Submissions
                const qSubmissions = query(collection(db, 'submissions'), where('userId', '==', user.uid));
                const subSnapshot = await getDocs(qSubmissions);
                const subMap: Record<string, any> = {};
                subSnapshot.forEach(doc => {
                    subMap[doc.data().assignmentId] = doc.data();
                });
                setSubmissions(subMap);

                // 4. Fetch Annotations
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

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good morning";
        if (hour < 18) return "Good afternoon";
        return "Good evening";
    };

    // Helper to calculate progress
    const getProgress = (assignmentId: string) => {
        const sub = submissions[assignmentId];
        let score = 0;
        if (annotatedAssignmentIds.has(assignmentId)) score += 20;
        if (sub?.spacecat) score += 20;
        if (sub?.thesis) score += 20;
        if (sub?.paragraphs && sub.paragraphs.length > 0) score += 20;
        if (sub?.status === 'submitted') score += 20;
        return score;
    };

    if (loading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Loader2 className="animate-spin" size={32} color="var(--color-primary)" /></div>;

    const inProgressCount = assignments.filter(a => {
        const p = getProgress(a.id);
        return p > 0 && p < 100;
    }).length;

    // Use profile name first, then fallback to user name, then generic
    const displayName = userProfile?.displayName?.split(' ')[0] || user?.displayName?.split(' ')[0] || 'Student';

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '3rem 1rem' }}>

            {/* Hero Section */}
            <header style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '3rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '2rem' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-accent)', letterSpacing: '0.05em' }}>
                        <Sparkles size={16} /> Student Dashboard
                    </div>
                    <h1 style={{ fontSize: '2.5rem', color: 'var(--color-primary)', margin: 0, lineHeight: 1.2 }}>
                        {getGreeting()}, {displayName}
                    </h1>
                </div>

                {/* Mini Stats */}
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div className="card" style={{ padding: '1rem 1.5rem', minWidth: '120px', textAlign: 'center' }}>
                        <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-primary)', lineHeight: 1 }}>{assignments.length}</div>
                        <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>Active Tasks</div>
                    </div>
                    <div className="card" style={{ padding: '1rem 1.5rem', minWidth: '120px', textAlign: 'center', border: '1px solid var(--color-accent)', backgroundColor: 'rgba(245, 158, 11, 0.05)' }}>
                        <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-accent)', lineHeight: 1 }}>{inProgressCount}</div>
                        <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>In Progress</div>
                    </div>
                </div>
            </header>

            {/* Assignments Feed */}
            <section>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    <BookOpen size={20} color="var(--color-text-muted)" />
                    <h2 style={{ fontSize: '1.25rem', margin: 0, color: 'var(--color-text)' }}>Your Readings</h2>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {assignments.length === 0 ? (
                        <div style={{ padding: '4rem', border: '2px dashed var(--color-border)', borderRadius: 'var(--radius-lg)', textAlign: 'center', backgroundColor: 'white' }}>
                            <div style={{ width: '64px', height: '64px', backgroundColor: 'var(--color-background)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                                <Sparkles size={24} color="var(--color-text-muted)" />
                            </div>
                            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>All caught up!</h3>
                            <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>No active assignments right now.</p>
                        </div>
                    ) : (
                        assignments.map(assignment => {
                            const progress = getProgress(assignment.id);
                            const isStarted = progress > 0;
                            const isDone = progress === 100;
                            const className = enrolledClasses.find(c => c.id === assignment.classId)?.name || 'Unknown Class';

                            return (
                                <div
                                    key={assignment.id}
                                    className="card"
                                    onClick={() => navigate(`/assignment/${assignment.id}`)}
                                    style={{
                                        padding: '0', cursor: 'pointer', transition: 'all 0.2s', overflow: 'hidden',
                                        borderLeft: isStarted ? `4px solid ${isDone ? 'var(--color-success)' : 'var(--color-accent)'}` : '1px solid var(--color-border)'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', padding: '1.5rem', gap: '1.5rem' }}>

                                        {/* Left: Progress Circle */}
                                        <div style={{ position: 'relative', width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <svg width="50" height="50" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                                                <circle cx="50" cy="50" r="45" fill="none" stroke="var(--color-border)" strokeWidth="8" />
                                                <circle
                                                    cx="50" cy="50" r="45" fill="none"
                                                    stroke={isDone ? 'var(--color-success)' : 'var(--color-primary)'}
                                                    strokeWidth="8"
                                                    strokeDasharray="283"
                                                    strokeDashoffset={283 - (283 * progress) / 100}
                                                    style={{ transition: 'stroke-dashoffset 1s ease' }}
                                                />
                                            </svg>
                                            <div style={{ position: 'absolute', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text)' }}>
                                                {isDone ? <CheckCircle2 size={18} color="var(--color-success)" /> : `${progress}%`}
                                            </div>
                                        </div>

                                        {/* Middle: Info */}
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                                                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', border: '1px solid var(--color-border)', padding: '2px 6px', borderRadius: '4px' }}>
                                                    {className}
                                                </span>
                                                {isStarted && !isDone && (
                                                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-accent)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <Clock size={12} /> IN PROGRESS
                                                    </span>
                                                )}
                                            </div>
                                            <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                                                {assignment.title}
                                            </h3>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <Calendar size={14} />
                                                Due: {assignment.dueDate ? assignment.dueDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'No Date'}
                                            </div>
                                        </div>

                                        {/* Right: Action Button */}
                                        <div>
                                            {isStarted ? (
                                                <button className="btn btn-primary" style={{ borderRadius: '99px', padding: '0.5rem 1.25rem', fontSize: '0.9rem' }}>
                                                    Continue <ChevronRight size={16} style={{ marginLeft: '0.25rem' }} />
                                                </button>
                                            ) : (
                                                <button className="btn btn-outline" style={{ borderRadius: '99px', padding: '0.5rem 1.25rem', fontSize: '0.9rem' }}>
                                                    <Play size={16} style={{ marginRight: '0.5rem' }} /> Start
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </section>
        </div>
    );
};
