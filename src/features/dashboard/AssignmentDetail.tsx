import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { ArrowLeft, Calendar, Clock, CheckCircle, AlertCircle, FileText, Eye } from 'lucide-react';
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

    useEffect(() => {
        const fetchData = async () => {
            if (!assignmentId) return;
            setLoading(true);
            try {
                // 1. Fetch Assignment Details
                const assignmentRef = doc(db, 'assignments', assignmentId);
                const assignmentSnap = await getDoc(assignmentRef);

                if (assignmentSnap.exists()) {
                    const assignmentData = { id: assignmentSnap.id, ...assignmentSnap.data() } as Assignment;
                    setAssignment(assignmentData);

                    // 2. Fetch Class Details to get Student IDs
                    const classRef = doc(db, 'classes', assignmentData.classId);
                    const classSnap = await getDoc(classRef);

                    if (classSnap.exists()) {
                        const classData = classSnap.data();
                        const studentIds = classData.studentIds || [];

                        // 3. Fetch Student Profiles (Mocking progress for now as we don't have a progress collection yet)
                        // In a real app, we'd fetch from a 'users' collection and a 'submissions' collection
                        const studentPromises = studentIds.map(async (uid: string) => {
                            // Try to fetch user profile, fallback to ID if not found
                            // This assumes a 'users' collection exists. If not, we'll just use the ID.
                            let name = `Student ${uid.substring(0, 5)}`;
                            try {
                                const userSnap = await getDoc(doc(db, 'users', uid));
                                if (userSnap.exists()) {
                                    name = userSnap.data().displayName || userSnap.data().email || name;
                                }
                            } catch (e) {
                                console.warn("Could not fetch user", uid);
                            }

                            // Mock Status
                            const statuses: ('Not Started' | 'In Progress' | 'Submitted')[] = ['Not Started', 'In Progress', 'Submitted'];
                            const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

                            return {
                                studentId: uid,
                                name: name,
                                status: randomStatus,
                                lastActive: randomStatus === 'Not Started' ? null : new Date(Date.now() - Math.random() * 100000000)
                            };
                        });

                        const fetchedStudents = await Promise.all(studentPromises);
                        setStudents(fetchedStudents);
                    }
                }
            } catch (error) {
                console.error("Error fetching assignment details:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [assignmentId]);

    if (loading) {
        return <div className="p-xl text-center">Loading assignment details...</div>;
    }

    if (!assignment) {
        return <div className="p-xl text-center">Assignment not found.</div>;
    }

    return (
        <div className="container max-w-5xl mx-auto pb-2xl">
            <button
                onClick={() => navigate('/teacher/dashboard')}
                className="btn btn-ghost mb-lg pl-0 flex items-center gap-sm text-muted hover:text-primary"
            >
                <ArrowLeft size={20} />
                Back to Dashboard
            </button>

            <header className="mb-xl">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold mb-sm">{assignment.title}</h1>
                        <div className="flex items-center gap-lg text-muted">
                            <span className="flex items-center gap-xs">
                                <Calendar size={16} />
                                Due: {assignment.dueDate ? new Date(assignment.dueDate.toDate()).toLocaleDateString() : 'No Due Date'}
                            </span>
                            <span className={`px-sm py-xs rounded-full text-xs border ${assignment.status === 'active' ? 'border-success text-success' : 'border-muted text-muted'}`}>
                                {assignment.status.toUpperCase()}
                            </span>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-bold text-primary">
                            {students.filter(s => s.status === 'Submitted').length} / {students.length}
                        </div>
                        <div className="text-sm text-muted">Submitted</div>
                    </div>
                </div>
            </header>

            <div className="card overflow-hidden p-0">
                <table className="w-full">
                    <thead className="bg-muted/10 border-b border-border">
                        <tr>
                            <th className="text-left p-md font-semibold text-sm text-muted">Student Name</th>
                            <th className="text-left p-md font-semibold text-sm text-muted">Status</th>
                            <th className="text-left p-md font-semibold text-sm text-muted">Last Active</th>
                            <th className="text-right p-md font-semibold text-sm text-muted">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {students.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="p-xl text-center text-muted italic">
                                    No students enrolled in this class yet.
                                </td>
                            </tr>
                        ) : (
                            students.map(student => (
                                <tr key={student.studentId} className="border-b border-border last:border-0 hover:bg-muted/5">
                                    <td className="p-md font-medium">{student.name}</td>
                                    <td className="p-md">
                                        <StatusBadge status={student.status} />
                                    </td>
                                    <td className="p-md text-sm text-muted">
                                        {student.lastActive ? (
                                            <span className="flex items-center gap-xs">
                                                <Clock size={14} />
                                                {student.lastActive.toLocaleDateString()} {student.lastActive.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        ) : (
                                            '--'
                                        )}
                                    </td>
                                    <td className="p-md text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => navigate(`/teacher/review/${assignmentId}/${student.studentId}/reader`)}
                                                className="btn btn-outline btn-sm flex items-center gap-2"
                                            >
                                                <Eye size={14} /> View Work
                                            </button>
                                            <button className="btn btn-outline btn-sm">
                                                Grade / Feedback
                                            </button>
                                        </div>
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
    let colorClass = 'bg-gray-100 text-gray-600 border-gray-200';
    let icon = <AlertCircle size={14} />;

    if (status === 'Submitted') {
        colorClass = 'bg-green-50 text-green-700 border-green-200';
        icon = <CheckCircle size={14} />;
    } else if (status === 'In Progress') {
        colorClass = 'bg-blue-50 text-blue-700 border-blue-200';
        icon = <FileText size={14} />;
    }

    return (
        <span className={`inline-flex items-center gap-xs px-sm py-xs rounded-full text-xs border ${colorClass}`}>
            {icon}
            {status}
        </span>
    );
};
