import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, BookOpen, Loader2, FileText, Calendar, ChevronRight, Eye, Users, TrendingUp } from 'lucide-react';
import { collection, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore'; // <--- Added doc, getDoc
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { CreateClassModal } from './components/CreateClassModal';
import { CreateAssignmentModal } from './components/CreateAssignmentModal';
import { ClassSettingsModal } from './components/ClassSettingsModal';
import type { Class, Assignment } from '../../types/class';

// Helper interface for the roster
interface StudentProfile {
    id: string;
    name: string;
    email: string;
}

export const TeacherDashboard: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [classes, setClasses] = useState<Class[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showAssignmentModal, setShowAssignmentModal] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [activeClass, setActiveClass] = useState<Class | null>(null);
    const [assignments, setAssignments] = useState<Assignment[]>([]);

    // State for live stats & students
    const [submissionCounts, setSubmissionCounts] = useState<Record<string, number>>({});
    const [classStudents, setClassStudents] = useState<StudentProfile[]>([]); // <--- New State
    const [activeTab, setActiveTab] = useState<'assignments' | 'students'>('assignments');

    const fetchClasses = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const q = query(
                collection(db, 'classes'),
                where('teacherId', '==', user.uid),
                orderBy('createdAt', 'desc')
            );
            const snapshot = await getDocs(q);
            const fetchedClasses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Class));
            setClasses(fetchedClasses);

            if (fetchedClasses.length > 0) {
                if (activeClass && fetchedClasses.find(c => c.id === activeClass.id)) {
                    setActiveClass(fetchedClasses.find(c => c.id === activeClass.id) || fetchedClasses[0]);
                } else {
                    setActiveClass(fetchedClasses[0]);
                }
            } else {
                setActiveClass(null);
            }
        } catch (error) {
            console.error("Error fetching classes:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAssignmentsAndStats = async () => {
        if (!activeClass) return;
        try {
            // 1. Get Assignments
            const q = query(
                collection(db, 'assignments'),
                where('classId', '==', activeClass.id),
                orderBy('createdAt', 'desc')
            );
            const snapshot = await getDocs(q);
            const fetchedAssignments = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                dueDate: doc.data().dueDate?.toDate()
            } as Assignment));

            setAssignments(fetchedAssignments);

            // 2. Get Submission Counts
            const counts: Record<string, number> = {};
            await Promise.all(fetchedAssignments.map(async (assignment) => {
                const qSub = query(
                    collection(db, 'submissions'),
                    where('assignmentId', '==', assignment.id)
                );
                const subSnap = await getDocs(qSub);
                counts[assignment.id] = subSnap.size;
            }));

            setSubmissionCounts(counts);

        } catch (error) {
            console.error("Error fetching assignments:", error);
        }
    };

    // --- NEW: Fetch Student Profiles for the Active Class ---
    useEffect(() => {
        const fetchStudents = async () => {
            if (!activeClass || !activeClass.studentIds || activeClass.studentIds.length === 0) {
                setClassStudents([]);
                return;
            }

            // Fetch user profile for each ID in the roster
            const profiles = await Promise.all(activeClass.studentIds.map(async (uid) => {
                try {
                    const userSnap = await getDoc(doc(db, 'users', uid));
                    if (userSnap.exists()) {
                        const data = userSnap.data();
                        return {
                            id: uid,
                            name: data.displayName || 'Unknown Name',
                            email: data.email || ''
                        };
                    }
                } catch (e) {
                    console.warn(`Could not fetch user profile for ${uid}`, e);
                }
                return { id: uid, name: 'Unknown Student', email: '' };
            }));

            setClassStudents(profiles);
        };

        fetchStudents();
    }, [activeClass]); // Re-run whenever the teacher switches classes

    useEffect(() => {
        fetchClasses();
    }, [user]);

    useEffect(() => {
        if (activeClass) {
            fetchAssignmentsAndStats();
        } else {
            setAssignments([]);
            setSubmissionCounts({});
        }
    }, [activeClass]);

    const handleClassCreated = () => fetchClasses();
    const handleAssignmentCreated = () => fetchAssignmentsAndStats();
    const handleClassUpdated = () => fetchClasses();
    const handleClassDeleted = () => {
        setActiveClass(null);
        fetchClasses();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 size={32} className="animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="container max-w-6xl" style={{ paddingBottom: '4rem' }}>
            <header className="mb-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border pb-6 mt-8">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <h1 className="text-3xl font-serif font-bold text-primary">
                            {activeClass ? activeClass.name : 'Teacher Dashboard'}
                        </h1>
                        {activeClass && (
                            <button onClick={() => setShowSettingsModal(true)} className="text-muted hover:text-primary transition-colors">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                            </button>
                        )}
                    </div>
                    <div className="text-muted text-sm font-medium flex items-center gap-2">
                        {activeClass ? (
                            <>
                                <span className="bg-muted/10 px-2 py-1 rounded text-primary font-mono font-bold">{activeClass.joinCode}</span>
                                <span>•</span>
                                <span className="flex items-center gap-1"><Users size={14} /> {activeClass.studentIds?.length || 0} Students</span>
                            </>
                        ) : (
                            'Welcome back! Create a class to get started.'
                        )}
                    </div>
                </div>
                <div className="flex gap-3">
                    {activeClass && (
                        <button onClick={() => setShowAssignmentModal(true)} className="btn btn-primary shadow-lg shadow-primary/20">
                            <Plus size={18} className="mr-sm" />
                            New Assignment
                        </button>
                    )}
                </div>
            </header>

            {/* Class Selector Tabs */}
            {classes.length > 0 && (
                <div className="flex gap-2 mb-8 overflow-x-auto pb-2 no-scrollbar">
                    {classes.map(cls => (
                        <button
                            key={cls.id}
                            onClick={() => setActiveClass(cls)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${activeClass?.id === cls.id
                                    ? 'bg-primary text-white shadow-md'
                                    : 'bg-white border border-border text-muted hover:border-primary hover:text-primary'
                                }`}
                        >
                            {cls.name}
                        </button>
                    ))}
                    <button onClick={() => setShowCreateModal(true)} className="px-3 py-2 rounded-full border border-dashed border-border text-muted hover:text-primary hover:border-primary transition-colors flex items-center gap-1 text-sm">
                        <Plus size={14} /> New Class
                    </button>
                </div>
            )}

            {activeClass ? (
                <>
                    {/* Inner Tabs */}
                    <div className="flex border-b border-border mb-8">
                        <button
                            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'assignments' ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-text'}`}
                            onClick={() => setActiveTab('assignments')}
                        >
                            <FileText size={16} /> Assignments
                        </button>
                        <button
                            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'students' ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-text'}`}
                            onClick={() => setActiveTab('students')}
                        >
                            <Users size={16} /> Students
                        </button>
                    </div>

                    {/* Tab Content */}
                    {activeTab === 'assignments' ? (
                        <div>
                            {assignments.length === 0 ? (
                                <div className="text-center py-20 border-2 border-dashed border-border rounded-xl bg-muted/5">
                                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-muted">
                                        <FileText size={32} />
                                    </div>
                                    <h3 className="text-lg font-bold mb-2">No assignments yet</h3>
                                    <p className="text-muted mb-6 max-w-xs mx-auto">Create your first assignment to start tracking student progress.</p>
                                    <button onClick={() => setShowAssignmentModal(true)} className="btn btn-primary">
                                        Create Assignment
                                    </button>
                                </div>
                            ) : (
                                <div className="grid gap-4">
                                    {assignments.map(assignment => {
                                        const submittedCount = submissionCounts[assignment.id] || 0;
                                        const totalStudents = activeClass.studentIds?.length || 0;
                                        const percentage = totalStudents > 0 ? Math.round((submittedCount / totalStudents) * 100) : 0;

                                        return (
                                            <div
                                                key={assignment.id}
                                                onClick={() => navigate(`/teacher/assignment/${assignment.id}`)}
                                                className="group bg-white p-6 rounded-xl border border-border hover:border-primary/30 hover:shadow-md transition-all cursor-pointer"
                                            >
                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                                    {/* Left: Info */}
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <h3 className="text-xl font-bold text-text group-hover:text-primary transition-colors font-serif">
                                                                {assignment.title}
                                                            </h3>
                                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${assignment.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                                                                {assignment.status}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-4 text-sm text-muted">
                                                            <span className="flex items-center gap-1">
                                                                <Calendar size={14} />
                                                                Due: {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'No date'}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Middle: Progress Bar */}
                                                    <div className="flex-1 md:max-w-xs">
                                                        <div className="flex justify-between text-xs font-bold uppercase tracking-wide mb-1.5">
                                                            <span className="text-muted">Completion</span>
                                                            <span className={percentage === 100 ? 'text-success' : 'text-primary'}>{submittedCount} / {totalStudents}</span>
                                                        </div>
                                                        <div className="h-2.5 bg-muted/20 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full transition-all duration-500 ${percentage === 100 ? 'bg-success' : 'bg-primary'}`}
                                                                style={{ width: `${percentage}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>

                                                    {/* Right: Action */}
                                                    <div className="flex items-center justify-end gap-4 md:w-48">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                navigate(`/teacher/assignment/${assignment.id}/review`);
                                                            }}
                                                            className="btn btn-outline text-xs px-4 py-2 flex items-center gap-2 hover:bg-primary hover:text-white hover:border-primary transition-all"
                                                        >
                                                            <Eye size={14} />
                                                            Review
                                                        </button>
                                                        <ChevronRight size={20} className="text-muted/40 group-hover:text-primary transition-colors" />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ) : (
                        // Students Tab (UPDATED)
                        <div>
                            <div className="flex justify-between items-center mb-4 bg-white p-4 rounded-lg border border-border shadow-sm">
                                <h2 className="font-bold text-text flex items-center gap-2">
                                    <Users size={20} className="text-primary" />
                                    Roster
                                </h2>
                                <div className="text-sm font-medium text-muted bg-muted/10 px-3 py-1 rounded-full">
                                    Total: {activeClass.studentIds?.length || 0}
                                </div>
                            </div>

                            <div className="bg-white rounded-xl border border-border overflow-hidden shadow-sm">
                                {classStudents.length === 0 ? (
                                    <div className="text-center py-12 text-muted">
                                        <div className="mb-2">No students enrolled yet.</div>
                                        <div className="text-sm">Share code: <span className="font-mono font-bold text-primary bg-primary/5 px-2 py-1 rounded">{activeClass.joinCode}</span></div>
                                    </div>
                                ) : (
                                    <table className="w-full">
                                        <thead className="bg-gray-50/50 border-b border-border">
                                            <tr>
                                                <th className="text-left p-4 font-bold text-xs text-muted uppercase tracking-wider">Student Name</th>
                                                <th className="text-left p-4 font-bold text-xs text-muted uppercase tracking-wider">Email</th>
                                                <th className="text-left p-4 font-bold text-xs text-muted uppercase tracking-wider">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {classStudents.map(student => (
                                                <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="p-4 font-medium text-sm text-text">{student.name}</td>
                                                    <td className="p-4 text-sm text-muted">{student.email}</td>
                                                    <td className="p-4">
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-100">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                                            Active
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    )}
                </>
            ) : (
                // No Classes State
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="w-24 h-24 bg-primary/5 rounded-full flex items-center justify-center mb-6">
                        <BookOpen size={48} className="text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-text mb-2">Welcome to LangLab</h2>
                    <p className="text-muted mb-8 max-w-md">Create your first class to start assigning texts and tracking rhetorical analysis progress.</p>
                    <button onClick={() => setShowCreateModal(true)} className="btn btn-primary px-8 py-3 text-lg shadow-xl shadow-primary/20 hover:-translate-y-1 transition-all">
                        <Plus size={20} className="mr-2" />
                        Create Class
                    </button>
                </div>
            )}

            {/* Modals */}
            {showCreateModal && (
                <CreateClassModal
                    onClose={() => setShowCreateModal(false)}
                    onClassCreated={handleClassCreated}
                />
            )}

            {showAssignmentModal && activeClass && (
                <CreateAssignmentModal
                    classId={activeClass.id}
                    onClose={() => setShowAssignmentModal(false)}
                    onAssignmentCreated={handleAssignmentCreated}
                />
            )}

            {showSettingsModal && activeClass && (
                <ClassSettingsModal
                    classData={activeClass}
                    onClose={() => setShowSettingsModal(false)}
                    onClassUpdated={handleClassUpdated}
                    onClassDeleted={handleClassDeleted}
                />
            )}
        </div>
    );
};
