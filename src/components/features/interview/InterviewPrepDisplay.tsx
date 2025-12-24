import React from 'react';
import { InterviewPrepState, JobInfo, InterviewQuestion } from '@/src/types';
import { Brain, Plus, ArrowRight, Layers, Target, FileCheck, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface InterviewPrepDisplayProps {
    state: InterviewPrepState;
    jobInfo: JobInfo;
    onGenerateMore: () => void;
    canGenerate: boolean;
}

const ALLOWED_ELEMENTS = [
    'p', 'br', 'strong', 'em', 'ul', 'ol', 'li',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre', 'a'
];

const SafeLink: React.FC<{ href?: string; children?: React.ReactNode }> = ({ href, children }) => {
    try {
        const url = new URL(href || '', typeof window !== 'undefined' ? window.location.origin : '');
        if (!['http:', 'https:'].includes(url.protocol)) {
            return <span>{children}</span>;
        }
        return (
            <a
                href={url.toString()}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="text-accent hover:underline"
            >
                {children}
            </a>
        );
    } catch {
        return <span>{children}</span>;
    }
};

const InterviewQuestionCard: React.FC<{ question: InterviewQuestion; index: number }> = ({ question, index }) => {
    const [isExpanded, setIsExpanded] = React.useState(true);

    return (
        <div
            className="bg-surface-elevated border border-white/5 rounded-lg mb-8 opacity-0 animate-fade-in-up relative overflow-hidden group transition-all hover:border-white/10"
            style={{ animationDelay: `${index * 150}ms`, animationFillMode: 'forwards' }}
        >
            {/* Card Header */}
            <div className="p-6 border-b border-white/5 bg-surface-base cursor-pointer hover:bg-white/5 transition-colors" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                        <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-interstate uppercase tracking-widest border mb-3
                        ${question.type === 'Behavioral' ? 'border-purple-500/30 text-purple-300 bg-purple-500/5' :
                                question.type === 'Technical' ? 'border-blue-500/30 text-blue-300 bg-blue-500/5' :
                                    'border-amber-500/30 text-amber-300 bg-amber-500/5'
                            }`}>
                            {question.type}
                        </span>
                        <h3 className="font-tiempos text-xl md:text-2xl font-bold text-text-primary leading-tight">
                            {question.question}
                        </h3>
                    </div>
                    <div className="text-text-secondary opacity-50">
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                </div>
            </div>

            {isExpanded && (
                <div className="animate-fade-in">
                    {/* HERO SECTION: STRONG SAMPLE ANSWER */}
                    <div className="p-6 bg-accent/5 border-b border-white/5 relative">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-[10px] font-interstate font-bold uppercase tracking-widest flex items-center gap-1.5 text-accent">
                                <FileCheck className="w-3 h-3" />
                                Strong Sample Answer
                            </span>
                        </div>
                        <div className="font-tiempos text-base text-text-primary leading-relaxed relative z-10">
                            <p className="whitespace-pre-line text-opacity-90">{question.sampleAnswer}</p>
                        </div>
                    </div>

                    {/* Guidance Grid (Markdown) */}
                    <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8 border-b border-white/5">

                        {/* Left Column: Evaluation Criteria */}
                        <div>
                            <h4 className="flex items-center gap-2 font-interstate text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-3">
                                <Target className="w-3 h-3" /> What They Are Evaluating
                            </h4>
                            <div className="prose prose-invert prose-sm prose-ul:list-disc prose-li:font-sans prose-li:text-text-primary prose-li:text-xs prose-li:leading-relaxed">
                                <ReactMarkdown
                                    allowedElements={ALLOWED_ELEMENTS}
                                    unwrapDisallowed
                                    components={{ a: SafeLink }}
                                >
                                    {Array.isArray(question.evaluationCriteria) ? question.evaluationCriteria.join('\n') : question.evaluationCriteria}
                                </ReactMarkdown>
                            </div>
                        </div>

                        {/* Right Column: Structure */}
                        <div>
                            <h4 className="flex items-center gap-2 font-interstate text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-3">
                                <Layers className="w-3 h-3" /> Recommended Structure
                            </h4>
                            <div className="prose prose-invert prose-sm prose-ul:list-disc prose-li:font-sans prose-li:text-text-primary prose-li:text-xs prose-li:leading-relaxed">
                                <ReactMarkdown
                                    allowedElements={ALLOWED_ELEMENTS}
                                    unwrapDisallowed
                                    components={{ a: SafeLink }}
                                >
                                    {Array.isArray(question.answerStructure) ? question.answerStructure.join('\n') : question.answerStructure}
                                </ReactMarkdown>
                            </div>
                        </div>
                    </div>

                    {/* Follow-up Questions */}
                    <div className="p-4 bg-surface-base">
                        <h4 className="flex items-center gap-2 font-interstate text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-2 opacity-70">
                            <MessageSquare className="w-3 h-3" /> Likely Follow-ups
                        </h4>
                        <ul className="space-y-1">
                            {question.followUpQuestions && question.followUpQuestions.map((fq, i) => (
                                <li key={i} className="text-xs text-text-secondary font-interstate flex items-start gap-2">
                                    <span className="text-white/20 select-none">•</span>
                                    {fq}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
};

const InterviewPrepDisplay: React.FC<InterviewPrepDisplayProps> = ({
    state,
    jobInfo,
    onGenerateMore,
    canGenerate
}) => {
    const { questions, isGenerating } = state;

    return (
        <div className="h-full bg-surface-base flex flex-col overflow-hidden relative font-sans">

            {/* Header - Editorial Style */}
            <div className="bg-surface-base p-6 md:p-8 border-b border-white/10 shrink-0 z-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-accent/10 p-1.5 rounded">
                            <Brain className="w-5 h-5 text-accent" />
                        </div>
                        <span className="font-interstate text-xs font-bold text-accent uppercase tracking-[0.2em]">
                            Mission Preparation
                        </span>
                    </div>
                    <h2 className="font-tiempos text-3xl md:text-4xl font-bold text-text-primary">
                        The War Room
                    </h2>
                    <p className="text-text-secondary mt-3 font-normal max-w-xl text-sm">
                        High-intensity preparation for <span className="text-white font-medium border-b border-white/20 pb-0.5">{jobInfo.title || 'your target role'}</span>.
                        <br />
                        <span className="text-text-secondary text-sm font-medium mt-2 block">Simulate scenarios. Refine your strategy. Win the offer.</span>
                    </p>
                </div>

                {/* Top Action (Contextual) */}
                {questions.length > 0 && (
                    <div className="hidden md:block">
                        <span className="font-interstate text-xs text-text-secondary">
                            {questions.length} Scenarios Generated
                        </span>
                    </div>
                )}
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">

                {questions.length === 0 && !isGenerating ? (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
                        <div className="w-20 h-20 bg-surface-elevated rounded-full flex items-center justify-center border border-white/5 shadow-2xl">
                            <Brain className="w-8 h-8 text-text-secondary opacity-50" />
                        </div>
                        <div>
                            <h3 className="font-tiempos text-2xl text-text-primary mb-2">Initialize War Room</h3>
                            <p className="font-interstate text-sm text-text-secondary max-w-sm mx-auto leading-relaxed">
                                Generate a high-signal simulation tailored to uncover gaps and highlight strengths.
                            </p>
                        </div>
                        <button
                            onClick={onGenerateMore}
                            disabled={!canGenerate}
                            className="group relative px-8 py-3 bg-accent text-surface-base font-interstate font-bold text-sm tracking-wide hover:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                        >
                            <span className="relative z-10 flex items-center gap-2">
                                DEPLOY WAR ROOM <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </span>
                        </button>
                    </div>
                ) : (
                    <div className="max-w-4xl mx-auto pb-10">
                        {questions.map((q, index) => (
                            <InterviewQuestionCard key={q.id || index} question={q} index={index} />
                        ))}

                        {/* Loading State or "Generate More" */}
                        <div className="mt-12 flex justify-center pb-8">
                            {isGenerating ? (
                                <div className="flex items-center gap-3 font-interstate text-xs text-accent uppercase tracking-widest animate-pulse">
                                    <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                    <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                    <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                    Processing Intelligence...
                                </div>
                            ) : (
                                <button
                                    onClick={onGenerateMore}
                                    className="group flex items-center gap-3 px-6 py-3 border border-white/20 text-text-secondary hover:text-accent hover:border-accent transition-all duration-300 font-interstate text-xs font-bold uppercase tracking-widest"
                                >
                                    <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                                    Add 5 Additional Questions
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// Memoize to prevent unnecessary re-renders
export default React.memo(InterviewPrepDisplay, (prevProps, nextProps) => {
    return (
        prevProps.state.questions.length === nextProps.state.questions.length &&
        prevProps.state.isGenerating === nextProps.state.isGenerating &&
        prevProps.canGenerate === nextProps.canGenerate
    );
});
