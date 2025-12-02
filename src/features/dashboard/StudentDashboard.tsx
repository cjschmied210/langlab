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
            <div className="flex items-center justify-center h-screen">
                <Loader2 size={32} className="animate-spin text-primary" />
            </div>
        );
    }

    const inProgressCount = assignments.filter(a => startedAssignmentIds.has(a.id)).length;

    return (
        <div className="container max-w-4xl mx-auto py-12">

            {/* Hero Section */}
            <header className="mb-12">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <div className="text-sm font-bold text-muted uppercase tracking-widest mb-2 flex items-center gap-2">
                            <Sparkles size={14} className="text-accent" />
                            Student Dashboard
                        </div>
                        <h1 className="text-4xl font-serif font-bold text-primary">
                            {getGreeting()}, {user?.displayName?.split(' ')[0]}
                        </h1>
                    </div>

                    {/* Mini Stats */}
                    <div className="flex gap-4">
                        <div className="bg-white p-4 rounded-xl border border-border shadow-sm min-w-[120px]">
                            <div className="text-3xl font-bold text-primary mb-1">{assignments.length}</div>
                            <div className="text-xs text-muted font-bold uppercase">Active Tasks</div>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-border shadow-sm min-w-[120px]">
                            <div className="text-3xl font-bold text-accent mb-1">{inProgressCount}</div>
                            <div className="text-xs text-muted font-bold uppercase">In Progress</div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Assignments Feed */}
            <section>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-text flex items-center gap-2">
                        <BookOpen size={20} className="text-muted" />
                        Your Readings
                    </h2>
                </div>

                <div className="grid gap-4">
                    {assignments.length === 0 ? (
                        <div className="text-center py-16 border-2 border-dashed border-border rounded-xl bg-background">
                            <div className="w-16 h-16 bg-muted/10 rounded-full flex items-center justify-center mx-auto mb-4 text-muted">
                                <Sparkles size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-text mb-2">All caught up!</h3>
                            <p className="text-muted max-w-xs mx-auto">
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
                                    className="group relative bg-white rounded-xl border border-border p-6 hover:shadow-lg hover:border-primary/30 transition-all cursor-pointer overflow-hidden"
                                >
                                    {/* Left Border Status Indicator */}
                                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${isStarted ? 'bg-accent' : 'bg-muted/30 group-hover:bg-primary'} transition-colors`} />

                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pl-2">

                                        {/* Main Info */}
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-xs font-bold text-muted uppercase tracking-wider bg-background px-2 py-1 rounded border border-border">
                                                    {className}
                                                </span>
                                                {isDueSoon && (
                                                    <span className="text-xs font-bold text-error flex items-center gap-1 bg-error/5 px-2 py-1 rounded">
                                                        <Clock size={12} /> Due Soon
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="text-xl font-bold text-primary mb-1 font-serif group-hover:text-blue-700 transition-colors">
                                                {assignment.title}
                                            </h3>
                                            <div className="text-sm text-muted flex items-center gap-4">
                                                <span className="flex items-center gap-1">
                                                    <Calendar size={14} />
                                                    {assignment.dueDate ? assignment.dueDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'No Due Date'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Action Area */}
                                        <div className="flex items-center gap-4">
                                            {isStarted ? (
                                                <div className="text-right">
                                                    <div className="text-xs font-bold text-accent uppercase mb-1">In Progress</div>
                                                    <button className="btn btn-primary bg-accent hover:bg-amber-600 text-white border-none text-sm px-4 py-2 rounded-full flex items-center gap-2 shadow-sm">
                                                        Continue <ChevronRight size={16} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <button className="btn btn-outline text-sm px-6 py-2 rounded-full flex items-center gap-2 group-hover:bg-primary group-hover:text-white transition-all">
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
