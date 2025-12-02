import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Loader2, Calendar, ChevronRight, Clock, BookOpen, Sparkles, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Class, Assignment } from '../../types/class';

export const StudentDashboard: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [enrolledClasses, setEnrolledClasses] = useState<Class[]>([]);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [startedAssignmentIds, setStartedAssignmentIds] = useState<Set<string>>(new Set());

    const fetchClassesAndAssignments = async () => {
        if (!user) return;
        setLoading(true);
        try {
            // 1. Fetch Classes
            const qClasses = query(collection(db, 'classes'), where('studentIds', 'array-contains', user.uid));
            const classSnapshot = await getDocs(qClasses);
            const classes = classSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Class));
            setEnrolledClasses(classes);

            // 2. Fetch Assignments for these classes
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

                // Sort: Earliest due date first
                fetchedAssignments.sort((a, b) => {
                    const dateA = a.dueDate ? a.dueDate.getTime() : (a.createdAt?.seconds * 1000 || 0);
                    const dateB = b.dueDate ? b.dueDate.getTime() : (b.createdAt?.seconds * 1000 || 0);
                    return dateA - dateB;
                });

                setAssignments(fetchedAssignments);

                // 3. Check status (fetch annotations)
                const qAnnotations = query(collection(db, 'annotations'), where('userId', '==', user.uid));
                const annSnapshot = await getDocs(qAnnotations);
                const startedIds = new Set(annSnapshot.docs.map(doc => doc.data().assignmentId));
                setStartedAssignmentIds(startedIds);

            } else {
                setAssignments([]);
            }

        } catch (error) {
            console.error("Error fetching dashboard data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClassesAndAssignments();
    }, [user]);

    // Helper for time-based greeting
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good morning";
        if (hour < 18) return "Good afternoon";
        return "Good evening";
    };

    if (loading) {
        return (
            <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Loader2 size={32} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
            </div>
        );
    }

    const inProgressCount = assignments.filter(a => startedAssignmentIds.has(a.id)).length;

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '3rem 1rem' }}>

            {/* Hero Section */}
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
                    </div>

                    {/* Mini Stats */}
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div style={{ backgroundColor: 'white', padding: '1rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)', minWidth: '120px' }}>
                            <div style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '0.25rem', lineHeight: 1 }}>{assignments.length}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Active Tasks</div>
                        </div>
                        <div style={{ backgroundColor: 'white', padding: '1rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)', minWidth: '120px' }}>
                            <div style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--color-accent)', marginBottom: '0.25rem', lineHeight: 1 }}>{inProgressCount}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>In Progress</div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Assignments Feed */}
            <section>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                        <BookOpen size={20} style={{ color: 'var(--color-text-muted)' }} />
                        Your Readings
                    </h2>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {assignments.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '4rem', border: '2px dashed var(--color-border)', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--color-background)' }}>
                            <div style={{ width: '4rem', height: '4rem', backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto', color: 'var(--color-text-muted)' }}>
                                <Sparkles size={24} />
                            </div>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '0.5rem' }}>All caught up!</h3>
                            <p style={{ color: 'var(--color-text-muted)', maxWidth: '300px', margin: '0 auto' }}>
                                No active assignments right now. Take a break or explore past readings.
                            </p>
                        </div>
                    ) : (
                        assignments.map(assignment => {
                            const isStarted = startedAssignmentIds.has(assignment.id);
                            const className = enrolledClasses.find(c => c.id === assignment.classId)?.name || 'Unknown Class';
                            const isDueSoon = assignment.dueDate && (assignment.dueDate.getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000); // 3 days

                            return (
                                <div
                                    key={assignment.id}
                                    onClick={() => navigate(`/assignment/${assignment.id}`)}
                                    style={{
                                        position: 'relative',
                                        backgroundColor: 'white',
                                        borderRadius: 'var(--radius-lg)',
                                        border: '1px solid var(--color-border)',
                                        padding: '1.5rem',
                                        cursor: 'pointer',
                                        overflow: 'hidden',
                                        transition: 'all 0.2s',
                                        boxShadow: 'var(--shadow-sm)',
                                        display: 'flex',
                                        flexDirection: 'column'
                                    }}
                                    className="hover-card"
                                >
                                    {/* Left Border Status Indicator */}
                                    <div style={{
                                        position: 'absolute',
                                        left: 0, top: 0, bottom: 0,
                                        width: '4px',
                                        backgroundColor: isStarted ? 'var(--color-accent)' : 'transparent',
                                        transition: 'background-color 0.2s'
                                    }} />

                                    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem', paddingLeft: '0.5rem' }}>

                                        {/* Main Info */}
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', backgroundColor: 'var(--color-background)', padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)' }}>
                                                    {className}
                                                </span>
                                                {isDueSoon && (
                                                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-error)', display: 'flex', alignItems: 'center', gap: '0.25rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                                                        <Clock size={12} /> Due Soon
                                                    </span>
                                                )}
                                            </div>
                                            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '0.25rem', fontFamily: 'var(--font-serif)' }}>
                                                {assignment.title}
                                            </h3>
                                            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                    <Calendar size={14} />
                                                    {assignment.dueDate ? assignment.dueDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'No Due Date'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Action Area */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            {isStarted ? (
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-accent)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>In Progress</div>
                                                    <button className="btn btn-primary" style={{ backgroundColor: 'var(--color-accent)', borderColor: 'var(--color-accent)', fontSize: '0.875rem', padding: '0.5rem 1rem', borderRadius: '9999px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        Continue <ChevronRight size={16} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <button className="btn btn-outline" style={{ fontSize: '0.875rem', padding: '0.5rem 1.5rem', borderRadius: '9999px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <Play size={16} /> Start Reading
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
