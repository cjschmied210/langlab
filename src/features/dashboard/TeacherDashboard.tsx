import React from 'react';
import { MOCK_CLASS_DATA } from './mockData';
import { Users, Clock, CheckCircle, AlertTriangle, BarChart2, Activity, FileText } from 'lucide-react';

export const TeacherDashboard: React.FC = () => {
    return (
        <div className="container" style={{ paddingBottom: '4rem' }}>
            <header className="mb-xl flex justify-between items-center">
                <div>
                    <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{MOCK_CLASS_DATA.className}</h1>
                    <div className="text-muted text-sans" style={{ fontSize: '1.1rem' }}>
                        Assignment: <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{MOCK_CLASS_DATA.activeAssignment}</span>
                    </div>
                </div>
                <div className="flex gap-md">
                    <button className="btn btn-outline">Manage Class</button>
                    <button className="btn btn-primary">New Assignment</button>
                </div>
            </header>

            {/* Top Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                <StatCard
                    icon={<Users size={24} />}
                    label="Active Students"
                    value={MOCK_CLASS_DATA.studentCount.toString()}
                    trend="+2 absent"
                />
                <StatCard
                    icon={<CheckCircle size={24} />}
                    label="Completion Rate"
                    value={`${MOCK_CLASS_DATA.completionRate}%`}
                    trend="On track"
                    color="var(--color-success)"
                />
                <StatCard
                    icon={<Clock size={24} />}
                    label="Avg. Reading Time"
                    value={MOCK_CLASS_DATA.averageReadingTime}
                    trend="Deep reading detected"
                />
                <StatCard
                    icon={<AlertTriangle size={24} />}
                    label="Confusion Spikes"
                    value="3"
                    trend="Needs Review"
                    color="var(--color-accent)"
                />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>

                {/* Main Column */}
                <div className="flex flex-col gap-xl">

                    {/* Confusion Heatmap */}
                    <div className="card">
                        <div className="flex justify-between items-center mb-lg">
                            <h3 className="flex items-center gap-sm" style={{ margin: 0 }}>
                                <Activity size={20} color="var(--color-primary)" />
                                Confusion Report
                            </h3>
                            <span className="text-muted" style={{ fontSize: '0.8rem' }}>Based on dwell time & re-reads</span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'flex-end', height: '200px', gap: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--color-border)' }}>
                            {MOCK_CLASS_DATA.confusionPoints.map((point, i) => (
                                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                                    <div style={{
                                        width: '100%',
                                        backgroundColor: point.confusionScore > 50 ? 'var(--color-error)' : 'var(--color-primary-light)',
                                        opacity: point.confusionScore > 50 ? 0.8 : 0.4,
                                        height: `${point.confusionScore}%`,
                                        borderRadius: '4px 4px 0 0',
                                        transition: 'all 0.3s'
                                    }} />
                                    <span className="text-muted" style={{ fontSize: '0.8rem' }}>P{point.paragraph}</span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-md text-muted" style={{ fontSize: '0.9rem', fontStyle: 'italic' }}>
                            <span style={{ color: 'var(--color-error)', fontWeight: 'bold' }}>Alert:</span> Paragraph 4 ("pay any price") is causing significant friction. Consider a mini-lesson on Cold War context.
                        </div>
                    </div>

                    {/* Verb Usage Chart */}
                    <div className="card">
                        <div className="flex justify-between items-center mb-lg">
                            <h3 className="flex items-center gap-sm" style={{ margin: 0 }}>
                                <BarChart2 size={20} color="var(--color-primary)" />
                                RAV Engine Analytics
                            </h3>
                            <span className="text-muted" style={{ fontSize: '0.8rem' }}>Top Verbs Used</span>
                        </div>

                        <div className="flex flex-col gap-sm">
                            {MOCK_CLASS_DATA.verbUsage.map((item) => (
                                <div key={item.verb} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ width: '100px', fontWeight: 600, fontSize: '0.9rem', textAlign: 'right' }}>{item.verb}</div>
                                    <div style={{ flex: 1, height: '24px', backgroundColor: 'var(--color-background)', borderRadius: '12px', overflow: 'hidden' }}>
                                        <div style={{
                                            height: '100%',
                                            width: `${(item.count / 50) * 100}%`,
                                            backgroundColor: item.category === 'Banned' ? 'var(--color-text-muted)' : 'var(--color-primary)',
                                            borderRadius: '12px'
                                        }} />
                                    </div>
                                    <div style={{ width: '40px', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{item.count}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Student Submissions (Real Data) */}
                    <div className="card">
                        <div className="flex justify-between items-center mb-lg">
                            <h3 className="flex items-center gap-sm" style={{ margin: 0 }}>
                                <FileText size={20} color="var(--color-primary)" />
                                Student Submissions
                            </h3>
                            <span className="text-muted" style={{ fontSize: '0.8rem' }}>From Local Storage</span>
                        </div>

                        {(() => {
                            const submissions = JSON.parse(localStorage.getItem('essay_submissions') || '[]');
                            if (submissions.length === 0) {
                                return <div className="text-muted italic">No submissions yet.</div>;
                            }
                            return (
                                <div className="flex flex-col gap-md">
                                    {submissions.map((sub: any, i: number) => (
                                        <div key={i} style={{ padding: '1rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                                            <div className="flex justify-between mb-sm">
                                                <span style={{ fontWeight: 600 }}>{sub.studentName}</span>
                                                <span className="text-muted" style={{ fontSize: '0.8rem' }}>{sub.submittedAt}</span>
                                            </div>
                                            <div className="mb-sm">
                                                <span className="text-muted text-xs uppercase">Thesis:</span>
                                                <p style={{ fontStyle: 'italic', fontSize: '0.9rem' }}>{sub.thesis}</p>
                                            </div>
                                            <div className="text-xs text-muted">
                                                {sub.paragraphs.length} Paragraphs
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            );
                        })()}
                    </div>

                </div>

                {/* Sidebar Column */}
                <div className="flex flex-col gap-lg">

                    {/* Recent Activity */}
                    <div className="card">
                        <h3 className="mb-md" style={{ fontSize: '1.1rem' }}>Live Classroom</h3>
                        <div className="flex flex-col gap-md">
                            {MOCK_CLASS_DATA.recentActivity.map((activity, i) => (
                                <div key={i} className="flex gap-sm items-start" style={{ paddingBottom: '0.75rem', borderBottom: i < MOCK_CLASS_DATA.recentActivity.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                                    <div style={{
                                        width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--color-primary-light)', color: 'white',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold'
                                    }}>
                                        {activity.student.charAt(0)}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{activity.student}</div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{activity.action}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>{activity.time}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="card" style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>
                        <h3 className="mb-md" style={{ fontSize: '1.1rem', color: 'white' }}>Teacher Tools</h3>
                        <div className="flex flex-col gap-sm">
                            <button className="btn" style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', justifyContent: 'flex-start', border: '1px solid rgba(255,255,255,0.2)' }}>
                                Toggle Class Layer
                            </button>
                            <button className="btn" style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', justifyContent: 'flex-start', border: '1px solid rgba(255,255,255,0.2)' }}>
                                Push "Pause & Reflect"
                            </button>
                            <button className="btn" style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', justifyContent: 'flex-start', border: '1px solid rgba(255,255,255,0.2)' }}>
                                Export Grades
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

const StatCard = ({ icon, label, value, trend, color = 'var(--color-primary)' }: any) => (
    <div className="card" style={{ padding: '1.5rem' }}>
        <div className="flex justify-between items-start mb-sm">
            <div style={{ color: color }}>{icon}</div>
            <span style={{ fontSize: '0.8rem', color: trend.includes('+') || trend === 'Needs Review' ? color : 'var(--color-success)', fontWeight: 600 }}>{trend}</span>
        </div>
        <div style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.25rem' }}>{value}</div>
        <div className="text-muted" style={{ fontSize: '0.9rem' }}>{label}</div>
    </div>
);
