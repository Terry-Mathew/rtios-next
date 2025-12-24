'use client';

import { useEffect } from 'react';
import { ArrowRight, FileText, BarChart2, Brain, Target, Search, AlertTriangle, CheckCircle2 } from 'lucide-react';
import Footer from '@/src/components/layout/Footer';
import { useAppStore } from '@/src/stores/appStore';

const LandingPage: React.FC = () => {
    const setAuthModalOpen = useAppStore((s) => s.setIsAuthModalOpen);
    const setCurrentView = useAppStore((s) => s.setCurrentView);

    // Sync appStore with current route
    useEffect(() => {
        setCurrentView('landing');
    }, [setCurrentView]);

    const handleStart = () => {
        setAuthModalOpen(true);
    };
    return (
        <div className="min-h-screen bg-surface-base text-text-primary font-sans overflow-x-hidden selection:bg-accent/30 flex flex-col">

            {/* Navigation */}
            <header className="px-6 py-6 md:px-12 flex justify-between items-center max-w-7xl mx-auto w-full border-b border-white/5 md:border-none">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-surface-elevated rounded border border-white/10 flex items-center justify-center">
                        <Target className="w-4 h-4 text-accent" />
                    </div>
                    <div className="font-tiempos text-xl font-bold tracking-tight">Rtios AI</div>
                </div>
                <button onClick={handleStart} className="font-interstate text-xs font-bold uppercase tracking-widest text-text-secondary hover:text-accent transition-colors">
                    Sign In
                </button>
            </header>

            {/* Hero Section */}
            <section className="px-6 py-20 md:py-32 max-w-5xl mx-auto text-center space-y-8 relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-accent/5 rounded-full blur-[120px] -z-10 pointer-events-none opacity-30"></div>

                <h1 className="font-tiempos text-5xl md:text-7xl font-bold leading-[1.1] animate-fade-in-up">
                    Your Next Role <br /> <span className="text-white/90">Starts With Insight.</span>
                </h1>
                <p className="font-interstate text-sm md:text-base text-text-secondary max-w-2xl mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                    Craft compelling narratives. Pinpoint critical gaps. Secure high-signal interviews. This is intelligent career acceleration, designed for precision.
                </p>
                <div className="animate-fade-in-up pt-4" style={{ animationDelay: '200ms' }}>
                    <button
                        onClick={handleStart}
                        className="group relative inline-flex items-center gap-3 px-8 py-4 bg-accent text-white font-interstate font-bold text-sm tracking-widest uppercase hover:bg-accent-hover transition-all overflow-hidden rounded-sm"
                    >
                        Get Started Free
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                    <p className="mt-4 font-interstate text-[10px] text-text-secondary uppercase tracking-widest opacity-60">
                        Free to Start • AI-Powered Analysis
                    </p>
                </div>
            </section>

            {/* Problem Section */}
            <section className="px-6 py-24 bg-surface-elevated border-y border-white/5">
                <div className="max-w-7xl mx-auto">
                    <h2 className="font-tiempos text-3xl md:text-4xl font-bold text-center mb-16 text-text-primary">
                        Beyond Generic. Beyond Guesswork.
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Card 1 */}
                        <div className="p-8 bg-surface-base border border-white/5 hover:border-accent/30 transition-colors group">
                            <div className="w-12 h-12 bg-surface-elevated rounded mb-6 flex items-center justify-center border border-white/5 group-hover:border-accent/20">
                                <FileText className="w-6 h-6 text-text-secondary group-hover:text-text-primary transition-colors" />
                            </div>
                            <h3 className="font-tiempos text-xl font-bold mb-3">The Bland Letter</h3>
                            <p className="font-interstate text-sm text-text-secondary leading-relaxed">
                                {`Your resume is exceptional. Your cover letter shouldn't sound like everyone else's. Stop guessing what they want to hear.`}
                            </p>
                        </div>
                        {/* Card 2 */}
                        <div className="p-8 bg-surface-base border border-white/5 hover:border-alert-gap/30 transition-colors group">
                            <div className="w-12 h-12 bg-surface-elevated rounded mb-6 flex items-center justify-center border border-white/5 group-hover:border-alert-gap/20">
                                <Search className="w-6 h-6 text-text-secondary group-hover:text-text-primary transition-colors" />
                            </div>
                            <h3 className="font-tiempos text-xl font-bold mb-3">The Hidden Gaps</h3>
                            <p className="font-interstate text-sm text-text-secondary leading-relaxed">
                                Is your resume truly optimized? Are you missing critical keywords? Uncover what stands between you and the interview.
                            </p>
                        </div>
                        {/* Card 3 */}
                        <div className="p-8 bg-surface-base border border-white/5 hover:border-accent/30 transition-colors group">
                            <div className="w-12 h-12 bg-surface-elevated rounded mb-6 flex items-center justify-center border border-white/5 group-hover:border-accent/20">
                                <Brain className="w-6 h-6 text-text-secondary group-hover:text-text-primary transition-colors" />
                            </div>
                            <h3 className="font-tiempos text-xl font-bold mb-3">The Interview Jitters</h3>
                            <p className="font-interstate text-sm text-text-secondary leading-relaxed">
                                Every interview question is an opportunity. Know exactly how to leverage your experience—and where to strengthen your story.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Modules Showcase */}
            <section className="max-w-7xl mx-auto px-6 py-24 space-y-32">

                {/* Module 1: Cover Letter */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-24 items-center">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-1.5 bg-accent/10 rounded">
                                <FileText className="w-4 h-4 text-accent" />
                            </div>
                            <span className="font-interstate text-xs font-bold text-accent uppercase tracking-widest">
                                Contextual Engine
                            </span>
                        </div>
                        <h2 className="font-tiempos text-3xl md:text-4xl font-bold mb-6">Craft Your Signature.</h2>
                        <p className="font-interstate text-sm text-text-secondary leading-relaxed mb-8">
                            {`Every word, tailored. Our AI synthesizes your resume, the company's ethos, and the role's demands to write cover letters that resonate. Choose your tone, refine in real-time.`}
                        </p>
                        <ul className="space-y-3 mb-8">
                            <li className="flex items-center gap-3 font-interstate text-xs text-text-primary">
                                <CheckCircle2 className="w-4 h-4 text-accent" /> Authentic Voice Calibration
                            </li>
                            <li className="flex items-center gap-3 font-interstate text-xs text-text-primary">
                                <CheckCircle2 className="w-4 h-4 text-accent" /> Company Research Integration
                            </li>
                        </ul>
                    </div>
                    {/* Visual Mockup */}
                    <div className="relative bg-surface-elevated p-6 border border-white/10 rounded-lg shadow-2xl rotate-1 hover:rotate-0 transition-transform duration-500">
                        <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-4">
                            <div className="flex gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500/20"></div>
                                <div className="w-3 h-3 rounded-full bg-yellow-500/20"></div>
                                <div className="w-3 h-3 rounded-full bg-green-500/20"></div>
                            </div>
                            <div className="font-interstate text-[10px] text-text-secondary uppercase">Draft.txt</div>
                        </div>
                        <div className="space-y-3 font-tiempos text-sm text-text-primary opacity-80 leading-relaxed">
                            <div className="w-3/4 h-3 bg-white/10 rounded animate-pulse"></div>
                            <div className="w-full h-3 bg-white/10 rounded animate-pulse delay-75"></div>
                            <div className="w-5/6 h-3 bg-white/10 rounded animate-pulse delay-150"></div>
                            <div className="w-full h-3 bg-white/10 rounded animate-pulse delay-200"></div>
                        </div>
                        <div className="absolute -bottom-4 -right-4 bg-surface-base border border-white/10 p-3 rounded shadow-lg">
                            <div className="font-interstate text-[10px] text-accent font-bold uppercase tracking-widest flex items-center gap-2">
                                <Target className="w-3 h-3" />
                                Precision: High
                            </div>
                        </div>
                    </div>
                </div>

                {/* Module 2: Analysis */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-24 items-center md:flex-row-reverse">
                    <div className="md:order-2">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-1.5 bg-accent/10 rounded">
                                <BarChart2 className="w-4 h-4 text-accent" />
                            </div>
                            <span className="font-interstate text-xs font-bold text-accent uppercase tracking-widest">
                                Fit Analysis
                            </span>
                        </div>
                        <h2 className="font-tiempos text-3xl md:text-4xl font-bold mb-6">Pinpoint Your Power.</h2>
                        <p className="font-interstate text-sm text-text-secondary leading-relaxed mb-8">
                            Stop guessing. Get a precise fitness score, identify missing keywords, and receive actionable recommendations to optimize your resume for ATS and human review.
                        </p>
                        <ul className="space-y-3 mb-8">
                            <li className="flex items-center gap-3 font-interstate text-xs text-text-primary">
                                <CheckCircle2 className="w-4 h-4 text-accent" /> Instant ATS Scanning
                            </li>
                            <li className="flex items-center gap-3 font-interstate text-xs text-text-primary">
                                <CheckCircle2 className="w-4 h-4 text-accent" /> Keyword Gap Detection
                            </li>
                        </ul>
                    </div>
                    {/* Visual Mockup */}
                    <div className="relative bg-surface-elevated p-8 border border-white/10 rounded-lg shadow-2xl -rotate-1 hover:rotate-0 transition-transform duration-500 md:order-1">
                        <div className="flex items-center justify-center mb-6">
                            <div className="relative w-32 h-32 rounded-full border-8 border-white/5 flex items-center justify-center">
                                <div className="absolute inset-0 border-8 border-accent rounded-full border-l-transparent rotate-45"></div>
                                <span className="font-tiempos text-4xl font-bold text-text-primary">92</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between font-interstate text-xs text-text-secondary">
                                <span>Keywords</span>
                                <span className="text-accent">Optimized</span>
                            </div>
                            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div className="w-[92%] h-full bg-accent"></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Module 3: Interview Prep */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-24 items-center">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-1.5 bg-accent/10 rounded">
                                <Brain className="w-4 h-4 text-accent" />
                            </div>
                            <span className="font-interstate text-xs font-bold text-accent uppercase tracking-widest">
                                Intelligence Briefing
                            </span>
                        </div>
                        <h2 className="font-tiempos text-3xl md:text-4xl font-bold mb-6">Master the Moment.</h2>
                        <p className="font-interstate text-sm text-text-secondary leading-relaxed mb-8">
                            Walk in prepared. Generate high-signal interview questions directly from your resume and the job. Gain structured answer guidance, highlighting your strongest evidence.
                        </p>
                        <ul className="space-y-3 mb-8">
                            <li className="flex items-center gap-3 font-interstate text-xs text-text-primary">
                                <CheckCircle2 className="w-4 h-4 text-accent" /> Role-Specific Questions
                            </li>
                            <li className="flex items-center gap-3 font-interstate text-xs text-text-primary">
                                <CheckCircle2 className="w-4 h-4 text-accent" /> Evidence Gap Warnings
                            </li>
                        </ul>
                    </div>
                    {/* Visual Mockup */}
                    <div className="relative bg-surface-elevated p-6 border border-white/10 rounded-lg shadow-2xl rotate-1 hover:rotate-0 transition-transform duration-500">
                        <div className="mb-4 border-l-2 border-accent pl-4">
                            <div className="font-tiempos text-lg font-bold mb-2">Tell me about a time you managed conflict.</div>
                            <div className="font-interstate text-[10px] text-accent uppercase tracking-widest mb-2">AI Strategy</div>
                            <div className="space-y-2">
                                <div className="h-2 w-full bg-white/10 rounded"></div>
                                <div className="h-2 w-5/6 bg-white/10 rounded"></div>
                            </div>
                        </div>
                        <div className="bg-surface-base p-3 border-l-2 border-alert-gap">
                            <div className="flex items-center gap-2 font-tiempos text-xs font-bold text-alert-gap mb-1">
                                <AlertTriangle className="w-3 h-3" /> Evidence Gap
                            </div>
                            <div className="h-2 w-3/4 bg-white/5 rounded"></div>
                        </div>
                    </div>
                </div>

            </section>

            {/* Testimonials */}
            <section className="py-24 bg-surface-elevated border-y border-white/5">
                <div className="max-w-7xl mx-auto px-6">
                    <h2 className="font-tiempos text-3xl font-bold text-center mb-16">The Edge. Realized.</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        <div className="p-8 bg-surface-base border border-white/5 relative">
                            <span className="absolute top-4 left-6 text-6xl font-serif text-white/5">&ldquo;</span>
                            <p className="font-tiempos text-lg leading-relaxed mb-6 relative z-10">
                                I used to dread writing cover letters. This changed everything. It felt like I had an executive assistant drafting my story, perfectly aligned every time.
                            </p>
                            <div className="font-interstate text-xs font-bold text-text-secondary uppercase tracking-widest">
                                — Alex P., Product Manager
                            </div>
                        </div>
                        <div className="p-8 bg-surface-base border border-white/5 relative">
                            <span className="absolute top-4 left-6 text-6xl font-serif text-white/5">&ldquo;</span>
                            <p className="font-tiempos text-lg leading-relaxed mb-6 relative z-10">
                                The resume analysis surfaced gaps I never would have found. Landed interviews for roles I thought were out of reach.
                            </p>
                            <div className="font-interstate text-xs font-bold text-text-secondary uppercase tracking-widest">
                                — Jordan S., Software Engineer
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-32 px-6 text-center flex-1">
                <h2 className="font-tiempos text-4xl md:text-5xl font-bold mb-6 text-text-primary">
                    Transform Your Applications.<br />Define Your Future.
                </h2>
                <p className="font-interstate text-sm text-text-secondary max-w-xl mx-auto mb-12">
                    Stop applying. Start strategizing. Your career deserves this precision.
                </p>
                <button
                    onClick={handleStart}
                    className="group inline-flex items-center gap-3 px-10 py-5 bg-accent text-white font-interstate font-bold text-sm tracking-widest uppercase hover:bg-accent-hover transition-all overflow-hidden rounded-sm"
                >
                    Start Free Trial
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
            </section>

            {/* Footer */}
            <Footer />
        </div>
    );
};

export default LandingPage;
