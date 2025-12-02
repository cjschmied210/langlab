import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, BookOpen, Loader2, FileText, Calendar, ChevronRight, Eye, Trash2 } from 'lucide-react';
import { collection, query, where, getDocs, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { CreateClassModal } from './components/CreateClassModal';
import { CreateAssignmentModal } from './components/CreateAssignmentModal';
import { ClassSettingsModal } from './components/ClassSettingsModal';
import type { Class, Assignment } from '../../types/class';

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

    // New State for Tabs
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

    const fetchAssignments = async () => {
        if (!activeClass) return;
        try {
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
        } catch (error) {
            console.error("Error fetching assignments:", error);
        }
    };

    useEffect(() => {
        fetchClasses();
    }, [user]);

    useEffect(() => {
        if (activeClass) {
            fetchAssignments();
        } else {
            setAssignments([]);
        }
    }, [activeClass]);

    const handleClassCreated = () => fetchClasses();
    const handleAssignmentCreated = () => fetchAssignments();
    const handleClassUpdated = () => fetchClasses();
    const handleClassDeleted = () => {
        setActiveClass(null);
        fetchClasses();
    };

    const handleDeleteAssignment = async (assignmentId: string) => {
        if (!window.confirm("Are you sure you want to delete this assignment? This action cannot be undone.")) return;

        try {
            await deleteDoc(doc(db, 'assignments', assignmentId));
            // Ideally we should also delete related annotations and submissions, but for now we'll just delete the assignment doc.
            fetchAssignments();
        } catch (error) {
            console.error("Error deleting assignment:", error);
            alert("Failed to delete assignment.");
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 size={32} className="animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="container" style={{ paddingBottom: '4rem' }}>
            <header className="mb-lg flex justify-between items-center">
                <div>
                    <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
                        {activeClass ? activeClass.name : 'Teacher Dashboard'}
                    </h1>
                    <div className="text-muted text-sans" style={{ fontSize: '1.1rem' }}>
                        {activeClass ? (
                            <>
                                Join Code: <span style={{ color: 'var(--color-primary)', fontWeight: 600, fontFamily: 'monospace', fontSize: '1.2em' }}>{activeClass.joinCode}</span>
                            </>
                        ) : (
                            'Welcome back! Create a class to get started.'
                        )}
                    </div>
                </div>
                <div className="flex gap-md">
                    {activeClass && (
                        <>
                            <button onClick={() => setShowSettingsModal(true)} className="btn btn-outline">
                                Settings
                            </button>
                            <button onClick={() => setShowAssignmentModal(true)} className="btn btn-primary">
                                <Plus size={18} className="mr-sm" />
                                New Assignment
                            </button>
                        </>
                    )}
                </div>
            </header>

            {/* Class Selector */}
            {classes.length > 0 && (
                <div className="flex gap-sm mb-lg overflow-x-auto pb-sm">
                    {classes.map(cls => (
                        <button
                            key={cls.id}
                            onClick={() => setActiveClass(cls)}
                            className={`btn ${activeClass?.id === cls.id ? 'btn-primary' : 'btn-outline'}`}
                            style={{ whiteSpace: 'nowrap' }}
                        >
                            {cls.name}
                        </button>
                    ))}
                </div>
            )}

            {activeClass ? (
                <>
                    {/* Tabs */}
                    <div className="flex border-b border-border mb-lg">
                        <button
                            className={`px-lg py-md font-medium text-sm border-b-2 transition-colors ${activeTab === 'assignments' ? 'border-primary text-primary font-bold' : 'border-transparent text-muted hover:text-text'}`}
                            onClick={() => setActiveTab('assignments')}
                        >
                            Assignments
                        </button>
                        <button
                            className={`px-lg py-md font-medium text-sm border-b-2 transition-colors ${activeTab === 'students' ? 'border-primary text-primary font-bold' : 'border-transparent text-muted hover:text-text'}`}
                            onClick={() => setActiveTab('students')}
                        >
                            Students
                        </button>
                    </div>

                    {/* Tab Content */}
                    {activeTab === 'assignments' ? (
                        <div>
                            {assignments.length === 0 ? (
                                <div className="text-center py-2xl border-2 border-dashed border-border rounded-lg">
                                    <FileText size={48} className="mx-auto text-muted mb-md" />
                                    <h3 className="text-lg font-medium mb-sm">No assignments yet</h3>
                                    <p className="text-muted mb-lg">Create your first assignment to get started.</p>
                                    <button onClick={() => setShowAssignmentModal(true)} className="btn btn-primary">
                                        Create Assignment
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-md">
                                    {assignments.map(assignment => (
                                        <div
                                            key={assignment.id}
                                            onClick={() => navigate(`/teacher/assignment/${assignment.id}`)}
                                            className="card hover:border-primary cursor-pointer transition-all"
                                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem' }}
                                        >
                                            {/* Left Section: Title & Date */}
                                            <div style={{ flex: 1 }}>
                                                <h3 className="text-xl font-bold mb-xs text-text">{assignment.title}</h3>
                                                <div className="flex items-center gap-xs text-sm text-muted">
                                                    <Calendar size={14} />
                                                    Due: {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'No date'}
                                                </div>
                                            </div>

                                            {/* Middle Section: Status Badge */}
                                            <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                                                <span className={`px-md py-xs rounded-full text-xs font-bold uppercase tracking-wide border ${assignment.status === 'active' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                                    {assignment.status}
                                                </span>
                                            </div>

                                            {/* Right Section: Stats & Chevron */}
                                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '1rem' }}>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/teacher/assignment/${assignment.id}/review`);
                                                    }}
                                                    className="btn btn-outline flex items-center gap-xs px-md py-sm hover:bg-primary/5 hover:border-primary transition-colors"
                                                >
                                                    <Eye size={16} />
                                                    Review Work
                                                </button>

                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteAssignment(assignment.id);
                                                    }}
                                                    className="btn btn-ghost text-muted hover:text-error p-sm transition-colors"
                                                    title="Delete Assignment"
                                                >
                                                    <Trash2 size={18} />
                                                </button>

                                                <div className="text-right pl-4 border-l border-border">
                                                    <div className="text-sm font-semibold text-muted mb-xs">
                                                        0 / {activeClass.studentIds?.length || 0} Submitted
                                                    </div>
                                                    <div className="w-32 bg-muted/20 rounded-full h-2 ml-auto">
                                                        <div
                                                            className="bg-primary h-2 rounded-full"
                                                            style={{ width: '0%' }} // Mocked for now
                                                        ></div>
                                                    </div>
                                                </div>
                                                <ChevronRight size={24} className="text-muted" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div>
                            <div className="flex justify-between items-center mb-md">
                                <h2 className="text-xl font-bold">Enrolled Students</h2>
                                <div className="text-muted">
                                    Total: {activeClass.studentIds?.length || 0}
                                </div>
                            </div>

                            <div className="card">
                                {(!activeClass.studentIds || activeClass.studentIds.length === 0) ? (
                                    <div className="text-center py-xl text-muted">
                                        No students enrolled yet. Share the join code:
                                        <span className="font-mono font-bold text-primary ml-xs">{activeClass.joinCode}</span>
                                    </div>
                                ) : (
                                    <table className="w-full">
                                        <thead className="bg-muted/10 border-b border-border">
                                            <tr>
                                                <th className="text-left p-md font-semibold text-sm text-muted">Student ID</th>
                                                <th className="text-left p-md font-semibold text-sm text-muted">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {activeClass.studentIds.map(studentId => (
                                                <tr key={studentId} className="border-b border-border last:border-0">
                                                    <td className="p-md font-mono text-sm">{studentId}</td>
                                                    <td className="p-md">
                                                        <span className="inline-flex items-center gap-xs px-sm py-xs rounded-full text-xs border bg-success/10 text-success border-success/20">
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
                <div className="text-center py-2xl">
                    <div className="w-24 h-24 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-lg text-muted">
                        <BookOpen size={48} />
                    </div>
                    <h2 className="text-2xl font-bold mb-sm">No Classes Yet</h2>
                    <p className="text-muted mb-xl">Create your first class to start tracking student progress.</p>
                    <button onClick={() => setShowCreateModal(true)} className="btn btn-primary btn-lg">
                        <Plus size={20} className="mr-sm" />
                        Create Class
                    </button>
                </div>
            )}

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
