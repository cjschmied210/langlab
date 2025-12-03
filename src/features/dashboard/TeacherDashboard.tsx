import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, BookOpen, Loader2, FileText, Calendar, ChevronRight, Eye, Sparkles } from 'lucide-react';
import { collection, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { CreateClassModal } from './components/CreateClassModal';
import { CreateAssignmentModal } from './components/CreateAssignmentModal';
import { ClassSettingsModal } from './components/ClassSettingsModal';
import type { Class, Assignment } from '../../types/class';

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

    const [submissionCounts, setSubmissionCounts] = useState<Record<string, number>>({});
    const [classStudents, setClassStudents] = useState<StudentProfile[]>([]);
    const [activeTab, setActiveTab] = useState<'assignments' | 'students'>('assignments');

    // --- Fetch Logic (Same as before) ---
    const fetchClasses = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const q = query(collection(db, 'classes'), where('teacherId', '==', user.uid), orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);
            const fetchedClasses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Class));
            setClasses(fetchedClasses);
            if (fetchedClasses.length > 0) {
                if (activeClass && fetchedClasses.find(c => c.id === activeClass.id)) {
                    setActiveClass(fetchedClasses.find(c => c.id === activeClass.id) || fetchedClasses[0]);
                } else {
                    setActiveClass(fetchedClasses[0]);
                }
            } else { setActiveClass(null); }
        } catch (error) { console.error(error); } finally { setLoading(false); }
    };

    const fetchAssignmentsAndStats = async () => {
        if (!activeClass) return;
        try {
            const q = query(collection(db, 'assignments'), where('classId', '==', activeClass.id), orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);
            const fetchedAssignments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), dueDate: doc.data().dueDate?.toDate() } as Assignment));
            setAssignments(fetchedAssignments);

            const counts: Record<string, number> = {};
            await Promise.all(fetchedAssignments.map(async (assignment) => {
                const qSub = query(collection(db, 'submissions'), where('assignmentId', '==', assignment.id));
                const subSnap = await getDocs(qSub);
                counts[assignment.id] = subSnap.size;
            }));
            setSubmissionCounts(counts);
        } catch (error) { console.error(error); }
    };

    useEffect(() => {
        const fetchStudents = async () => {
            if (!activeClass || !activeClass.studentIds || activeClass.studentIds.length === 0) {
                setClassStudents([]); return;
            }
            const profiles = await Promise.all(activeClass.studentIds.map(async (uid) => {
                try {
                    const userSnap = await getDoc(doc(db, 'users', uid));
                    if (userSnap.exists()) {
                        const data = userSnap.data();
                        return { id: uid, name: data.displayName || 'Unknown Name', email: data.email || '' };
                    }
                } catch (e) { console.warn(e); }
                return { id: uid, name: 'Unknown Student', email: '' };
            }));
            setClassStudents(profiles);
        };
        fetchStudents();
    }, [activeClass]);

    useEffect(() => { fetchClasses(); }, [user]);
    useEffect(() => { if (activeClass) { fetchAssignmentsAndStats(); } else { setAssignments([]); setSubmissionCounts({}); } }, [activeClass]);

    // Handlers
    const handleClassCreated = () => fetchClasses();
    const handleAssignmentCreated = () => fetchAssignmentsAndStats();
    const handleClassUpdated = () => fetchClasses();
    const handleClassDeleted = () => { setActiveClass(null); fetchClasses(); };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good morning";
        if (hour < 18) return "Good afternoon";
        return "Good evening";
    };

    if (loading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Loader2 className="animate-spin" size={32} color="var(--color-primary)" /></div>;

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '3rem 2rem' }}>

            {/* Hero Header */}
            <header style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '3rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '2rem' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)', letterSpacing: '0.05em' }}>
                        <BookOpen size={16} /> Teacher HQ
                    </div>
                    <h1 style={{ fontSize: '2.5rem', color: 'var(--color-primary)', margin: 0, lineHeight: 1.2, fontFamily: 'var(--font-serif)' }}>
                        {getGreeting()}, {user?.displayName?.split(' ')[0]}
                    </h1>
                </div>
                {activeClass && (
                    <button
                        onClick={() => setShowAssignmentModal(true)}
                        className="btn btn-primary"
                        style={{ borderRadius: '99px', padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: 'var(--shadow-md)' }}
                    >
                        <Plus size={18} /> New Assignment
                    </button>
                )}
            </header>

            {/* Class Selector Pills */}
            {classes.length > 0 && (
                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                    {classes.map(cls => (
                        <button
                            key={cls.id}
                            onClick={() => setActiveClass(cls)}
                            style={{
                                padding: '0.5rem 1.25rem',
                                borderRadius: '99px',
                                fontSize: '0.9rem',
                                fontWeight: 500,
                                transition: 'all 0.2s',
                                border: activeClass?.id === cls.id ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                                backgroundColor: activeClass?.id === cls.id ? 'var(--color-primary)' : 'white',
                                color: activeClass?.id === cls.id ? 'white' : 'var(--color-text-muted)',
                                boxShadow: activeClass?.id === cls.id ? 'var(--shadow-sm)' : 'none'
                            }}
                        >
                            {cls.name}
                        </button>
                    ))}
                    <button onClick={() => setShowCreateModal(true)} style={{ padding: '0.5rem 1rem', borderRadius: '99px', border: '1px dashed var(--color-border)', background: 'transparent', color: 'var(--color-text-muted)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Plus size={14} /> Add Class
                    </button>
                </div>
            )}

            {activeClass ? (
                <>
                    {/* Class Header & Settings */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <div style={{ display: 'flex', gap: '2rem' }}>
                            <button
                                onClick={() => setActiveTab('assignments')}
                                style={{
                                    background: 'none', border: 'none', padding: '0.5rem 0',
                                    borderBottom: activeTab === 'assignments' ? '2px solid var(--color-primary)' : '2px solid transparent',
                                    color: activeTab === 'assignments' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                    fontWeight: 600, fontSize: '1rem', cursor: 'pointer'
                                }}
                            >
                                Assignments
                            </button>
                            <button
                                onClick={() => setActiveTab('students')}
                                style={{
                                    background: 'none', border: 'none', padding: '0.5rem 0',
                                    borderBottom: activeTab === 'students' ? '2px solid var(--color-primary)' : '2px solid transparent',
                                    color: activeTab === 'students' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                    fontWeight: 600, fontSize: '1rem', cursor: 'pointer'
                                }}
                            >
                                Students
                            </button>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', backgroundColor: 'var(--color-background)', padding: '0.25rem 0.75rem', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
                                Code: <span style={{ fontWeight: 700, fontFamily: 'monospace', color: 'var(--color-text)' }}>{activeClass.joinCode}</span>
                            </div>
                            <button onClick={() => setShowSettingsModal(true)} className="btn btn-ghost" style={{ padding: '0.5rem', color: 'var(--color-text-muted)' }}>
                                <Sparkles size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Tab Content */}
                    {activeTab === 'assignments' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {assignments.length === 0 ? (
                                <div style={{ padding: '4rem', border: '2px dashed var(--color-border)', borderRadius: 'var(--radius-lg)', textAlign: 'center', backgroundColor: '#f9fafb' }}>
                                    <FileText size={48} style={{ margin: '0 auto 1rem', color: 'var(--color-border)' }} />
                                    <h3 style={{ margin: '0 0 0.5rem 0' }}>No assignments yet</h3>
                                    <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>Create your first assignment to start tracking.</p>
                                    <button onClick={() => setShowAssignmentModal(true)} className="btn btn-primary">Create Assignment</button>
                                </div>
                            ) : (
                                assignments.map(assignment => {
                                    const submittedCount = submissionCounts[assignment.id] || 0;
                                    const totalStudents = activeClass.studentIds?.length || 0;
                                    const percentage = totalStudents > 0 ? Math.round((submittedCount / totalStudents) * 100) : 0;

                                    return (
                                        <div
                                            key={assignment.id}
                                            className="card"
                                            onClick={() => navigate(`/teacher/assignment/${assignment.id}`)}
                                            style={{
                                                padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                gap: '2rem', cursor: 'pointer', transition: 'all 0.2s',
                                                borderLeft: `4px solid ${percentage === 100 ? 'var(--color-success)' : 'var(--color-primary)'}`
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                                        >
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                                                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text)' }}>{assignment.title}</h3>
                                                    <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', padding: '0.15rem 0.5rem', borderRadius: '4px', backgroundColor: '#f3f4f6', color: 'var(--color-text-muted)' }}>{assignment.status}</span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                                    <Calendar size={14} />
                                                    Due: {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'No date'}
                                                </div>
                                            </div>

                                            <div style={{ width: '200px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem', color: 'var(--color-text-muted)' }}>
                                                    <span>Progress</span>
                                                    <span style={{ color: percentage === 100 ? 'var(--color-success)' : 'var(--color-primary)' }}>{submittedCount} / {totalStudents}</span>
                                                </div>
                                                <div style={{ height: '8px', width: '100%', backgroundColor: '#f3f4f6', borderRadius: '99px', overflow: 'hidden' }}>
                                                    <div style={{ width: `${percentage}%`, height: '100%', backgroundColor: percentage === 100 ? 'var(--color-success)' : 'var(--color-primary)', transition: 'width 0.5s ease' }}></div>
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); navigate(`/teacher/assignment/${assignment.id}/review`); }}
                                                    className="btn btn-outline"
                                                    style={{ fontSize: '0.85rem', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                                >
                                                    <Eye size={14} /> Heatmap
                                                </button>
                                                <ChevronRight size={20} color="var(--color-border)" />
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    ) : (
                        // Students Tab
                        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid var(--color-border)' }}>
                                    <tr>
                                        <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Name</th>
                                        <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Email</th>
                                        <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {classStudents.length === 0 ? (
                                        <tr><td colSpan={3} style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>No students yet. Share the code: {activeClass.joinCode}</td></tr>
                                    ) : (
                                        classStudents.map(student => (
                                            <tr key={student.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                                <td style={{ padding: '1rem', fontWeight: 500 }}>{student.name}</td>
                                                <td style={{ padding: '1rem', color: 'var(--color-text-muted)' }}>{student.email}</td>
                                                <td style={{ padding: '1rem' }}>
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0.75rem', borderRadius: '99px', backgroundColor: '#ecfdf5', color: 'var(--color-success)', fontSize: '0.75rem', fontWeight: 700 }}>
                                                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--color-success)' }}></span> Active
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            ) : (
                // No Classes State
                <div style={{ textAlign: 'center', padding: '6rem 0' }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'rgba(30, 58, 138, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                        <BookOpen size={40} color="var(--color-primary)" />
                    </div>
                    <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Welcome to LangLab</h2>
                    <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>Create your first class to get started.</p>
                    <button onClick={() => setShowCreateModal(true)} className="btn btn-primary" style={{ fontSize: '1.1rem', padding: '0.75rem 2rem' }}>
                        <Plus size={20} style={{ marginRight: '0.5rem' }} /> Create Class
                    </button>
                </div>
            )}

            {/* Modals */}
            {showCreateModal && <CreateClassModal onClose={() => setShowCreateModal(false)} onClassCreated={handleClassCreated} />}
            {showAssignmentModal && activeClass && <CreateAssignmentModal classId={activeClass.id} onClose={() => setShowAssignmentModal(false)} onAssignmentCreated={handleAssignmentCreated} />}
            {showSettingsModal && activeClass && <ClassSettingsModal classData={activeClass} onClose={() => setShowSettingsModal(false)} onClassUpdated={handleClassUpdated} onClassDeleted={handleClassDeleted} />}
        </div>
    );
};
