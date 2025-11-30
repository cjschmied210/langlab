import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';

export const Login: React.FC = () => {
    const { signInWithGoogle, user } = useAuth();
    const navigate = useNavigate();

    React.useEffect(() => {
        if (user) {
            navigate('/onboarding');
        }
    }, [user, navigate]);

    const handleLogin = async () => {
        try {
            await signInWithGoogle();
        } catch (error) {
            alert('Failed to sign in. Check console for details.');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <div className="card p-xl text-center max-w-md w-full shadow-lg border-t-4 border-primary">
                <h1 className="text-2xl font-serif font-bold mb-md text-primary">LangLab</h1>
                <p className="text-muted mb-xl">
                    Sign in to access your classroom dashboard and assignments.
                </p>

                <button
                    onClick={handleLogin}
                    className="btn btn-primary w-full flex justify-center items-center gap-sm py-md text-lg"
                >
                    <LogIn size={20} />
                    Sign in with Google
                </button>

                <div className="mt-lg text-sm text-muted">
                    <p>Don't have an account? It will be created automatically.</p>
                </div>
            </div>
        </div>
    );
};
