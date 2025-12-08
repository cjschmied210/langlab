import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogIn, UserPlus, User, Lock, AlertCircle, BookOpen, Loader2 } from 'lucide-react';

export const Login: React.FC = () => {
    const { signInWithGoogle, loginWithEmail, signupWithEmail, user } = useAuth();
    const navigate = useNavigate();

    const [mode, setMode] = useState<'login' | 'signup'>('login');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) navigate('/onboarding');
    }, [user, navigate]);

    const handleGoogleLogin = async () => {
        setError(null);
        try {
            await signInWithGoogle();
        } catch (err) {
            setError('Google Sign-In blocked? Try the username option below.');
        }
    };

    // Auto-format username to email domain
    const formatEmail = (input: string) => {
        const cleanInput = input.trim();
        if (cleanInput.includes('@')) return cleanInput;
        return `${cleanInput}@langlab.local`;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        const emailToUse = formatEmail(username);

        try {
            if (mode === 'login') {
                await loginWithEmail(emailToUse, password);
            } else {
                await signupWithEmail(emailToUse, password);
            }
        } catch (err: any) {
            console.error(err);
            if (err.code === 'auth/invalid-credential') setError("Incorrect username or password.");
            else if (err.code === 'auth/email-already-in-use') setError("That username is taken.");
            else if (err.code === 'auth/weak-password') setError("Password must be 6+ characters.");
            else setError("Failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-background)', padding: '1rem' }}>

            {/* Brand Header */}
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '0.5rem', color: 'var(--color-primary)' }}>
                    <BookOpen size={48} />
                    <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '3rem', margin: 0 }}>LangLab</h1>
                </div>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem' }}>The AP Rhetoric Architect</p>
            </div>

            <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '2.5rem' }}>

                {/* Google Button */}
                <button
                    onClick={handleGoogleLogin}
                    className="btn btn-outline"
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '1.5rem', fontSize: '1rem' }}
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" style={{ width: '20px', height: '20px' }}>
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Continue with Google
                </button>

                <div style={{ display: 'flex', alignItems: 'center', margin: '1.5rem 0', color: 'var(--color-border)' }}>
                    <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--color-border)' }}></div>
                    <span style={{ padding: '0 0.5rem', fontSize: '0.85rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Or</span>
                    <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--color-border)' }}></div>
                </div>

                {/* Username Form */}
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {error && (
                        <div style={{ padding: '0.75rem', backgroundColor: '#fef2f2', color: 'var(--color-error)', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid #fee2e2' }}>
                            <AlertCircle size={16} /> {error}
                        </div>
                    )}

                    <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>Username</label>
                        <div style={{ position: 'relative' }}>
                            <User size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                            <input
                                type="text"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                                placeholder="coolstudent22"
                                style={{ width: '100%', padding: '0.6rem 0.75rem 0.6rem 2.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '1rem', outline: 'none', boxSizing: 'border-box' }}
                                className="focus:ring-2 focus:ring-primary/50"
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>Password</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                style={{ width: '100%', padding: '0.6rem 0.75rem 0.6rem 2.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '1rem', outline: 'none', boxSizing: 'border-box' }}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-primary"
                        style={{ width: '100%', marginTop: '0.5rem', fontSize: '1rem', padding: '0.75rem' }}
                    >
                        {loading ? (
                            <>
                                <Loader2 size={20} className="animate-spin" style={{ marginRight: '0.5rem' }} />
                                Processing...
                            </>
                        ) : (
                            mode === 'login' ? <><LogIn size={20} style={{ marginRight: '0.5rem' }} /> Login</> : <><UserPlus size={20} style={{ marginRight: '0.5rem' }} /> Create Account</>
                        )}
                    </button>
                </form>

                <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>
                    <button
                        onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null); }}
                        style={{ background: 'none', border: 'none', color: 'var(--color-primary)', textDecoration: 'underline', cursor: 'pointer' }}
                    >
                        {mode === 'login' ? "Student without an account? Click here." : "Already have a username? Log in here."}
                    </button>
                </div>
            </div>
        </div>
    );
};
