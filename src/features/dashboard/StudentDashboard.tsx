import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

export const StudentDashboard: React.FC = () => {
    const { user } = useAuth();

    return (
        <div className="p-xl max-w-7xl mx-auto">
            <header className="mb-xl">
                <h1 className="text-3xl font-serif font-bold text-primary mb-sm">
                    Welcome back, {user?.displayName?.split(' ')[0]}
                </h1>
                <p className="text-muted">
                    Here are your active classes and assignments.
                </p>
            </header>

            <div className="card p-xl text-center border-dashed border-2 border-border bg-muted/20">
                <p className="text-muted">You haven't joined any classes yet.</p>
                <button className="btn btn-primary mt-md">
                    Join a Class
                </button>
            </div>
        </div>
    );
};
