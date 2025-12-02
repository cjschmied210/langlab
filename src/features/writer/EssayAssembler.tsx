import React from 'react';
import { ArrowLeft, Copy, Send } from 'lucide-react';
import type { ParagraphState } from './ParagraphBuilder';

interface EssayAssemblerProps {
    thesis: string;
    paragraphs: ParagraphState[];
    onBack: () => void;
    onSubmit: () => void;
}

export const EssayAssembler: React.FC<EssayAssemblerProps> = ({ thesis, paragraphs, onBack, onSubmit }) => {

    const handleCopy = () => {
        const text = `Thesis: ${thesis}\n\n` + paragraphs.map(p =>
            `Paragraph:\nClaim: ${p.claimVerb?.verb} - ${p.claimVerb?.commentary}\nEvidence: "${p.evidence}"\nCommentary: ${p.commentary}`
        ).join('\n\n');

        navigator.clipboard.writeText(text);
        alert('Essay skeleton copied to clipboard!');
    };

    return (
        <div className="flex flex-col h-full bg-surface">
            <header className="flex items-center justify-between p-md border-b bg-white">
                <button onClick={onBack} className="btn btn-ghost">
                    <ArrowLeft size={20} className="mr-sm" />
                    Back to Reading
                </button>
                <div className="flex gap-sm">
                    <button onClick={handleCopy} className="btn btn-outline">
                        <Copy size={18} className="mr-sm" />
                        Copy to Clipboard
                    </button>
                    <button onClick={onSubmit} className="btn btn-primary bg-success hover:bg-green-700 border-success">
                        <Send size={18} className="mr-sm" />
                        Submit Essay
                    </button>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-xl">
                <div className="max-w-3xl mx-auto space-y-xl">

                    {/* Thesis Section */}
                    <section className="card p-lg border-l-4 border-primary">
                        <h3 className="text-sm font-bold text-muted uppercase mb-sm">Thesis Statement</h3>
                        <p className="text-lg font-serif leading-relaxed">{thesis || "No thesis statement constructed yet."}</p>
                    </section>

                    {/* Paragraphs Section */}
                    <div className="space-y-lg">
                        <h3 className="text-lg font-bold text-primary border-b pb-sm">Body Paragraphs ({paragraphs.length})</h3>

                        {paragraphs.length === 0 ? (
                            <div className="text-center py-xl text-muted italic bg-background rounded-lg border border-dashed">
                                No paragraphs added yet. Go back to the builder to create one.
                            </div>
                        ) : (
                            paragraphs.map((para, index) => (
                                <div key={para.id || index} className="card p-lg">
                                    <div className="flex items-center gap-sm mb-md">
                                        <span className="bg-primary text-white text-xs font-bold px-sm py-xs rounded">
                                            Paragraph {index + 1}
                                        </span>
                                        <span className="text-sm text-muted font-bold uppercase">
                                            Focus: {para.claimVerb?.verb || "Unknown Verb"}
                                        </span>
                                    </div>

                                    <div className="space-y-md">
                                        <div>
                                            <div className="text-xs font-bold text-muted uppercase mb-xs">Claim</div>
                                            <p className="mb-sm">{para.claimVerb?.commentary}</p>
                                        </div>

                                        <div className="pl-md border-l-2 border-accent">
                                            <div className="text-xs font-bold text-muted uppercase mb-xs">Evidence</div>
                                            <p className="italic mb-sm">"{para.evidence}"</p>
                                        </div>

                                        <div>
                                            <div className="text-xs font-bold text-muted uppercase mb-xs">Commentary</div>
                                            <p>{para.commentary}</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
