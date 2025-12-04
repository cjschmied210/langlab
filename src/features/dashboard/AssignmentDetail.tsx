import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { ArrowLeft, Calendar, CheckCircle, AlertCircle, FileText, Eye, Loader2, Trash2 } from 'lucide-react';
import type { Assignment } from '../../types/class';

interface StudentProgress {
    studentId: string;
    name: string;
    status: 'Not Started' | 'In Progress' | 'Submitted';
    lastActive: Date | null;
}

export const AssignmentDetail: React.FC = () => {
    const { assignmentId } = useParams<{ assignmentId: string }>();
    const navigate = useNavigate();
    const [assignment, setAssignment] = useState<Assignment | null>(null);
    const [students, setStudents] = useState<StudentProgress[]>([]);
    const [loading, setLoading] = useState(true);

    const handleDelete = async () => {
        if (!assignmentId) return;
        if (window.confirm('Are you sure you want to delete this assignment? This cannot be undone.')) {
            try {
                await deleteDoc(doc(db, 'assignments', assignmentId));
                navigate('/teacher/dashboard');
            } catch (error) {
                console.error('Error deleting assignment:', error);
                alert('Failed to delete assignment');
            }
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            if (!assignmentId) return;
            setLoading(true);
            try {
                const assignmentRef = doc(db, 'assignments', assignmentId);
                const assignmentSnap = await getDoc(assignmentRef);

                if (assignmentSnap.exists()) {
                    const assignmentData = { id: assignmentSnap.id, ...assignmentSnap.data() } as Assignment;
                    setAssignment(assignmentData);

                    const classRef = doc(db, 'classes', assignmentData.classId);
                    const classSnap = await getDoc(classRef);

                    if (classSnap.exists()) {
                        const classData = classSnap.data();
                        const studentIds: string[] = classData.studentIds || [];

                        const studentPromises = studentIds.map(async (uid) => {
                            let name = `Student ${uid.slice(0, 5)}`;
                            try {
                                const userSnap = await getDoc(doc(db, 'users', uid));
                                if (userSnap.exists()) name = userSnap.data().displayName || userSnap.data().email;
                            } catch (e) { console.warn(e); }

                            let status: StudentProgress['status'] = 'Not Started';
                            let lastActive: Date | null = null;

                            try {
                                const subRef = doc(db, 'submissions', `${uid}_${assignmentId}`);
                                const subSnap = await getDoc(subRef);
                                if (subSnap.exists()) {
                                    const subData = subSnap.data();
                                    if (subData.status === 'submitted') status = 'Submitted';
                                    else if (subData.spacecat || subData.thesis) status = 'In Progress';
                                    if (subData.updatedAt) lastActive = subData.updatedAt.toDate();
                                }
                            } catch (e) { console.error(e); }

                            return { studentId: uid, name, status, lastActive };
                        });

                        setStudents(await Promise.all(studentPromises));
                    }
                }
            } catch (error) { console.error(error); } finally { setLoading(false); }
        };
        fetchData();
    }, [assignmentId]);

    if (loading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Loader2 className="animate-spin" size={32} color="var(--color-primary)" /></div>;
    if (!assignment) return <div>Assignment not found</div>;

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '3rem 2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <button
                    onClick={() => navigate('/teacher/dashboard')}
                    className="btn btn-ghost"
                    style={{ padding: '0.5rem 0', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <ArrowLeft size={20} /> Back to Dashboard
                </button>
                <button
                    onClick={handleDelete}
                    className="btn btn-ghost"
                    style={{ color: 'var(--color-error)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}
                >
                    <Trash2 size={18} /> Delete Assignment
                </button>
            </div>

            <header style={{ marginBottom: '2rem', padding: '2rem', backgroundColor: 'white', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: 'var(--shadow-sm)' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-primary)', margin: 0, fontFamily: 'var(--font-serif)' }}>{assignment.title}</h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Calendar size={16} />
                            Due: {assignment.dueDate ? new Date(assignment.dueDate.toDate()).toLocaleDateString() : 'No Date'}
                        </span>
                        <span style={{ padding: '0.1rem 0.5rem', border: '1px solid var(--color-border)', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
                            {assignment.status}
                        </span>
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--color-primary)', lineHeight: 1 }}>
                        {students.filter(s => s.status === 'Submitted').length} <span style={{ fontSize: '1.5rem', color: 'var(--color-border)' }}>/ {students.length}</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Submissions</div>
                </div>
            </header>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid var(--color-border)' }}>
                        <tr>
                            <th style={{ textAlign: 'left', padding: '1.5rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Student</th>
                            <th style={{ textAlign: 'left', padding: '1.5rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Status</th>
                            <th style={{ textAlign: 'left', padding: '1.5rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Last Active</th>
                            <th style={{ textAlign: 'right', padding: '1.5rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {students.length === 0 ? (
                            <tr><td colSpan={4} style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>No students enrolled yet.</td></tr>
                        ) : (
                            students.map(student => (
                                <tr key={student.studentId} style={{ borderBottom: '1px solid var(--color-border)', transition: 'background 0.2s' }} className="hover-row">
                                    <td style={{ padding: '1.5rem', fontWeight: 500 }}>{student.name}</td>
                                    <td style={{ padding: '1.5rem' }}><StatusBadge status={student.status} /></td>
                                    <td style={{ padding: '1.5rem', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                                        {student.lastActive ? student.lastActive.toLocaleDateString() : '--'}
                                    </td>
                                    <td style={{ padding: '1.5rem', textAlign: 'right' }}>
                                        {student.status !== 'Not Started' && (
                                            <button
                                                onClick={() => navigate(`/teacher/review/${assignment.id}/${student.studentId}/reader`)}
                                                className="btn btn-outline"
                                                style={{ fontSize: '0.8rem', padding: '0.5rem 1rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                                            >
                                                <Eye size={14} /> View Work
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const StatusBadge = ({ status }: { status: string }) => {
    let bg = '#f3f4f6';
    let color = '#6b7280';
    let icon = <AlertCircle size={14} />;

    if (status === 'Submitted') {
        bg = '#ecfdf5'; color = '#047857'; icon = <CheckCircle size={14} />;
    } else if (status === 'In Progress') {
        bg = '#eff6ff'; color = '#1d4ed8'; icon = <FileText size={14} />;
    }

    return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0.75rem', borderRadius: '99px', backgroundColor: bg, color: color, fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
            {icon} {status}
        </span>
    );
};
