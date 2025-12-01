import React, { useState } from 'react';
import { Lock, Unlock, X } from 'lucide-react';

interface SpacecatData {
    speaker: string;
    purpose: string;
    audience: string;
    context: string;
    exigence: string;
    choices: string;
    appeals: string;
    tone: string;
}

interface SpacecatModalProps {
    onUnlock: (data: SpacecatData) => void;
    onClose: () => void;
}

export const SpacecatModal: React.FC<SpacecatModalProps> = ({ onUnlock, onClose }) => {
    const [formData, setFormData] = useState<SpacecatData>({
        speaker: '',
        purpose: '',
        audience: '',
        context: '',
        exigence: '',
        choices: '',
        appeals: '',
        tone: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // In a real app, we might validate that fields are not empty
        onUnlock(formData);
    };

    const isFormValid = Object.values(formData).every(val => val.trim().length > 0);

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(248, 249, 250, 0.95)', // High opacity parchment
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(5px)'
        }}>
            <div className="card" style={{
                width: '100%',
                maxWidth: '800px',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: 'var(--shadow-lg)',
                border: '1px solid var(--color-primary)',
                position: 'relative'
            }}>
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '1rem',
                        right: '1rem',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--color-text-muted)'
                    }}
                >
                    <X size={24} />
                </button>

                <div className="text-center mb-lg">
                    <div style={{
                        display: 'inline-flex',
                        padding: '1rem',
                        borderRadius: '50%',
                        backgroundColor: 'var(--color-primary)',
                        color: 'white',
                        marginBottom: '1rem'
                    }}>
                        <Lock size={32} />
                    </div>
                    <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>The "Space" Check</h2>
                    <p className="text-muted">
                        Analyze the rhetorical situation to unlock the text.
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div className="form-group">
                            <label className="text-sans" style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem' }}>Speaker</label>
                            <input
                                type="text"
                                name="speaker"
                                value={formData.speaker}
                                onChange={handleChange}
                                placeholder="Who is writing/speaking?"
                                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontFamily: 'var(--font-sans)' }}
                            />
                        </div>
                        <div className="form-group">
                            <label className="text-sans" style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem' }}>Audience</label>
                            <input
                                type="text"
                                name="audience"
                                value={formData.audience}
                                onChange={handleChange}
                                placeholder="Who is the intended audience?"
                                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontFamily: 'var(--font-sans)' }}
                            />
                        </div>

                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                            <label className="text-sans" style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem' }}>Context</label>
                            <textarea
                                name="context"
                                value={formData.context}
                                onChange={handleChange}
                                placeholder="What is happening in the world at this time?"
                                rows={2}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontFamily: 'var(--font-sans)', resize: 'vertical' }}
                            />
                        </div>

                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                            <label className="text-sans" style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem' }}>Exigence</label>
                            <textarea
                                name="exigence"
                                value={formData.exigence}
                                onChange={handleChange}
                                placeholder="Why does this need to be written NOW? What is the spark?"
                                rows={2}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontFamily: 'var(--font-sans)', resize: 'vertical' }}
                            />
                        </div>

                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                            <label className="text-sans" style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem' }}>Purpose</label>
                            <textarea
                                name="purpose"
                                value={formData.purpose}
                                onChange={handleChange}
                                placeholder="What does the speaker want the audience to DO or THINK?"
                                rows={2}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontFamily: 'var(--font-sans)', resize: 'vertical' }}
                            />
                        </div>

                        {/* Simplified CAT for now, focus on SPACE first as per prompt, but prompt said SPACECAT form */}
                        <div className="form-group">
                            <label className="text-sans" style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem' }}>Choices</label>
                            <input
                                type="text"
                                name="choices"
                                value={formData.choices}
                                onChange={handleChange}
                                placeholder="Key rhetorical choices?"
                                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontFamily: 'var(--font-sans)' }}
                            />
                        </div>
                        <div className="form-group">
                            <label className="text-sans" style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem' }}>Appeals</label>
                            <input
                                type="text"
                                name="appeals"
                                value={formData.appeals}
                                onChange={handleChange}
                                placeholder="Ethos, Pathos, Logos?"
                                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontFamily: 'var(--font-sans)' }}
                            />
                        </div>
                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                            <label className="text-sans" style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem' }}>Tone</label>
                            <input
                                type="text"
                                name="tone"
                                value={formData.tone}
                                onChange={handleChange}
                                placeholder="What is the speaker's attitude?"
                                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontFamily: 'var(--font-sans)' }}
                            />
                        </div>

                    </div>

                    <div className="flex justify-center mt-lg">
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={!isFormValid}
                            style={{
                                opacity: isFormValid ? 1 : 0.5,
                                cursor: isFormValid ? 'pointer' : 'not-allowed',
                                padding: '1rem 3rem',
                                fontSize: '1.1rem'
                            }}
                        >
                            <Unlock size={20} style={{ marginRight: '0.5rem' }} />
                            Unlock Text
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
