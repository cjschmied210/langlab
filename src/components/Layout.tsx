import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, User, Eye } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const Layout: React.FC = () => {
    const { user, userProfile } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const isTeacher = userProfile?.role === 'teacher';
    const isStudentView = location.pathname.startsWith('/student');

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
                                <Link to={getDashboardLink()} style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text)', textDecoration: 'none' }}>Dashboard</Link>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                                    <User size={16} />
                                    <span>{user.displayName?.split(' ')[0] || 'User'}</span>
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
        </div>
    );
};
