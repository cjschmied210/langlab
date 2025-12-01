import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Loader2, Calendar, ChevronRight, Clock, Circle } from 'lucide-react';
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
                // Firestore 'in' query supports up to 10 items.
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

                // Sort in memory
                fetchedAssignments.sort((a, b) => {
                    const dateA = a.dueDate ? a.dueDate.getTime() : (a.createdAt?.seconds * 1000 || 0);
                    const dateB = b.dueDate ? b.dueDate.getTime() : (b.createdAt?.seconds * 1000 || 0);
                    return dateA - dateB; // Ascending by due date (soonest first)
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

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 size={32} className="animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="p-xl max-w-3xl mx-auto">
            <header className="mb-2xl text-center">
                <h1 className="text-3xl font-serif font-bold text-primary mb-sm">
                    Hello, {user?.displayName?.split(' ')[0]}
                </h1>
                <p className="text-muted">
                    You have {assignments.length} active assignments.
                </p>
            </header>

            {/* Assignments Feed */}
            <section>
                <div className="flex flex-col gap-md">
                    {assignments.length === 0 ? (
                        <div className="text-center py-2xl border-2 border-dashed border-border rounded-lg bg-muted/5">
                            <div className="text-muted mb-md">No upcoming assignments!</div>
                            <div className="text-sm text-muted">Time to relax or read ahead.</div>
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
                                    className="card p-lg hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer bg-surface flex flex-col sm:flex-row sm:items-center justify-between gap-md group border border-border"
                                >
                                    {/* Left: Info */}
                                    <div className="flex-1">
                                        <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors mb-xs">
                                            {assignment.title}
                                        </h3>
                                        <div className="text-sm text-muted font-medium">
                                            {className}
                                        </div>
                                    </div>

                                    {/* Right: Status & Date */}
                                    <div className="flex items-center gap-lg">
                                        <div className="flex flex-col items-end gap-xs">
                                            {/* Status Badge */}
                                            <div className={`text-xs font-bold px-sm py-1 rounded-full flex items-center gap-xs ${isStarted
                                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                                                }`}>
                                                {isStarted ? (
                                                    <>
                                                        <Clock size={12} />
                                                        In Progress
                                                    </>
                                                ) : (
                                                    <>
                                                        <Circle size={12} />
                                                        Not Started
                                                    </>
                                                )}
                                            </div>

                                            {/* Due Date */}
                                            <div className={`text-sm flex items-center gap-xs ${isDueSoon ? 'text-red-600 font-medium' : 'text-muted'}`}>
                                                <Calendar size={14} />
                                                {assignment.dueDate ? assignment.dueDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'No Due Date'}
                                            </div>
                                        </div>

                                        <ChevronRight className="text-muted/50 group-hover:text-primary transition-colors" />
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
