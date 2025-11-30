import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, PenTool, BookOpen, Users } from 'lucide-react';

export const Home: React.FC = () => {
    return (
        <div className="text-center" style={{ maxWidth: '800px', margin: '0 auto', padding: '4rem 0' }}>
            <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>The AP Rhetoric Architect</h1>
            <p className="text-muted" style={{ fontSize: '1.25rem', marginBottom: '2rem', lineHeight: 1.6 }}>
                Scaffold the transition from deep reading to analytical writing with interactive annotation,
                specific rhetorical frameworks, and AI-assisted feedback.
            </p>

            <div className="flex justify-center gap-md mb-lg">
                <Link to="/login" className="btn btn-primary">
                    Get Started <ArrowRight size={18} style={{ marginLeft: '0.5rem' }} />
                </Link>
                <Link to="/about" className="btn btn-outline">
                    Learn More
                </Link>
            </div>

            <div className="flex gap-lg justify-center mt-lg" style={{ marginTop: '4rem' }}>
                <FeatureCard
                    icon={<BookOpen size={32} />}
                    title="Smart Reading"
                    description="Distraction-free reading with chunking and focus tools."
                />
                <FeatureCard
                    icon={<PenTool size={32} />}
                    title="Strategic Annotation"
                    description="Tag functions, not just devices, with the RAV Engine."
                />
                <FeatureCard
                    icon={<Users size={32} />}
                    title="Collaborative Review"
                    description="See peer confusion heatmaps and social annotations."
                />
            </div>
        </div>
    );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
    <div className="card" style={{ flex: 1, padding: '2rem' }}>
        <div style={{ color: 'var(--color-primary)', marginBottom: '1rem' }}>{icon}</div>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{title}</h3>
        <p className="text-muted" style={{ fontSize: '0.9rem' }}>{description}</p>
    </div>
);
