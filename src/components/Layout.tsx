import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, User, Eye, Plus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { JoinClassModal } from '../features/dashboard/components/JoinClassModal';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const Layout: React.FC = () => {
    const { user, userProfile } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [hasClasses, setHasClasses] = useState(false);

    const isTeacher = userProfile?.role === 'teacher';
    const isStudentView = location.pathname.startsWith('/student');

    // Check if student has joined any classes
    useEffect(() => {
        const checkEnrollment = async () => {
            // Only check for students (or teachers in student view)
            if (user && !isTeacher) {
                try {
                    const q = query(
                        collection(db, 'classes'),
                        where('studentIds', 'array-contains', user.uid)
                    );
                    const snapshot = await getDocs(q);
                    setHasClasses(!snapshot.empty);
                } catch (error) {
                    console.error("Error checking enrollment:", error);
                }
            }
        };

        checkEnrollment();
    }, [user, isTeacher]);

    // Helper to get the display name safely
    const getDisplayName = () => {
        if (userProfile?.displayName) return userProfile.displayName.split(' ')[0];
        if (user?.displayName) return user.displayName.split(' ')[0];
        return 'User';
    };

    const getDashboardLink = () => {
        if (!user) return '/login';
        if (!userProfile) return '/onboarding';
        if (isStudentView) return '/student/dashboard';
        return userProfile.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard';
    };

    const handleToggleView = () => {
        if (isStudentView) {
            navigate('/teacher/dashboard');
        } else {
            navigate('/student/dashboard');
        }
    };

    const handleClassJoined = () => {
        window.location.reload();
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <header style={{ backgroundColor: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', position: 'sticky', top: 0, zIndex: 10 }}>
                <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '4rem' }}>
                    <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)', fontFamily: 'var(--font-serif)', fontWeight: 'bold', fontSize: '1.25rem', textDecoration: 'none' }}>
                        <BookOpen size={24} />
                        LangLab
                    </Link>
                    <nav style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {user ? (
                            <>
                                {isTeacher && (
                                    <button
                                        onClick={handleToggleView}
                                        className="btn btn-outline"
                                        style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem', gap: '0.5rem' }}
                                    >
                                        <Eye size={16} />
                                        {isStudentView ? 'Exit Student View' : 'Student View'}
                                    </button>
                                )}

                                {/* FIXED LOGIC: Show if (Student OR StudentView) AND (Not Enrolled) */}
                                {((!isTeacher || isStudentView) && !hasClasses) && (
                                    <button
                                        onClick={() => setShowJoinModal(true)}
                                        className="btn btn-ghost"
                                        style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem', gap: '0.5rem', color: 'var(--color-primary)' }}
                                    >
                                        <Plus size={16} />
                                        Join Class
                                    </button>
                                )}

                                <Link to={getDashboardLink()} style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text)', textDecoration: 'none' }}>Dashboard</Link>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                                    <User size={16} />
                                    <span>{getDisplayName()}</span>
                                </div>
                            </>
                        ) : (
                            <Link to="/login" style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-primary)', textDecoration: 'none' }}>Login</Link>
                        )}
                    </nav>
                </div>
            </header>
            <main style={{ flex: 1, padding: '2rem 0' }} className="container">
                <Outlet />
            </main>
            <footer style={{ backgroundColor: 'var(--color-surface)', borderTop: '1px solid var(--color-border)', padding: '1.5rem 0', marginTop: 'auto' }}>
                <div className="container text-center text-muted" style={{ fontSize: '0.875rem' }}>
                    © {new Date().getFullYear()} LangLab. The AP Rhetoric Architect.
                </div>
            </footer>

            {showJoinModal && (
                <JoinClassModal
                    onClose={() => setShowJoinModal(false)}
                    onClassJoined={handleClassJoined}
                />
            )}
        </div>
    );
};
