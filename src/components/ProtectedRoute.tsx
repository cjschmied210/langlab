import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { UserRole } from '../types/user';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
    const { user, userProfile, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return <div className="flex items-center justify-center h-screen">Loading...</div>;
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // If user is logged in but has no profile, they must go to onboarding
    // unless they are already there.
    if (!userProfile && location.pathname !== '/onboarding') {
        return <Navigate to="/onboarding" replace />;
    }

    // If user has a profile but tries to go to onboarding, send them to their dashboard
    if (userProfile && location.pathname === '/onboarding') {
        return <Navigate to={userProfile.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard'} replace />;
    }

    // If specific roles are required and user doesn't have one of them
    if (allowedRoles && userProfile && !allowedRoles.includes(userProfile.role)) {
        // Redirect to their appropriate dashboard
        return <Navigate to={userProfile.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard'} replace />;
    }

    return <>{children}</>;
};
