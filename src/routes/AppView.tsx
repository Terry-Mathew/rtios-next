'use client';

/**
 * AppView.tsx - Main Application View Component
 * 
 * This component contains the main app layout (NavigationSidebar + Features + RightSidebar).
 * Extracted from App.tsx to support React Router v6 integration.
 */

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useShallow } from 'zustand/react/shallow';
import { useAppStore } from '@/src/stores/appStore';
import { useWorkspaceStore } from '@/src/stores/workspaceStore';
import { NavigationSidebar } from '@/src/components/layout/NavigationSidebar';
import { RightSidebar } from '@/src/components/layout/RightSidebar';
import { CoverLetterFeature } from '@/src/features/CoverLetterFeature';
import { LinkedInFeature } from '@/src/features/LinkedInFeature';
import { InterviewPrepFeature } from '@/src/features/InterviewPrepFeature';
import ContextSwitcher from '@/src/components/layout/ContextSwitcher';
import { useResumeManagement } from '@/src/hooks/useResumeManagement';
import { useJobManagement } from '@/src/hooks/useJobManagement';
import { AppStatus, ToneType } from '@/src/types';
import { Layout, Menu } from 'lucide-react';
import * as GeminiService from '@/src/domains/intelligence/services/gemini';
import { ErrorBoundary } from '@/src/components/errors/ErrorBoundary';
import { FeatureErrorBoundary } from '@/src/components/errors/FeatureErrorBoundary';
import { ToastContainer } from '@/src/components/ui/ToastContainer';
import { errorService } from '@/src/services/errorService';
import { useToastStore } from '@/src/stores/toastStore';

const AppView: React.FC = () => {
    const router = useRouter();

    // --- Navigation State from appStore ---
    const activeModule = useAppStore((s) => s.activeModule);
    const setActiveSidebarTab = useAppStore((s) => s.setActiveSidebarTab);
    const setCurrentView = useAppStore((s) => s.setCurrentView);

    // --- Mobile Sidebar State ---
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    // Sync appStore with current route
    useEffect(() => {
        setCurrentView('app');
    }, [setCurrentView]);

    // --- Domain Hooks (with built-in persistence) ---
    const {
        resumes,
        activeResumeId,
        currentResume,
        userProfile,
        addResume: handleAddResume,
        selectResume: handleSelectResume,
        deleteResume: handleDeleteResume,
        updateProfile: setUserProfile,
        syncFromStorage // NEW: Sync function
    } = useResumeManagement();

    // Sync career data from storage when mounting AppView
    useEffect(() => {
        syncFromStorage();
    }, [syncFromStorage]);

    const {
        jobs,
        activeJobId,
        currentJob,
        addJob: handleAddJob,
        selectJob: handleSelectStrategy,
        deleteJobWithWorkspaceClear: handleDeleteJobWithWorkspaceClear,
        snapshotCurrentJob,
        updateJobOutputs
    } = useJobManagement();

    // --- Workspace State from workspaceStore ---
    const appState = useWorkspaceStore(useShallow((s) => ({
        status: s.status,
        error: s.error,
        resumeText: s.resumeText,
        research: s.research,
        analysis: s.analysis,
        coverLetter: s.coverLetter,
        linkedIn: s.linkedIn,
        interviewPrep: s.interviewPrep
    })));

    const {
        setStatus,
        setError,
        setResumeText,
        setResearch,
        setAnalysis,
        updateCoverLetter,
    } = useWorkspaceStore();

    // --- Library Handlers ---



    const handleError = (message: string) => {
        setStatus(AppStatus.ERROR);
        setError(message);
    };

    const handleGenerate = async () => {
        if (!currentResume || !currentJob.title) return;

        setResumeText(currentResume.textParams);
        setStatus(AppStatus.RESEARCHING);
        setError(undefined);

        try {
            // 1. Parallel: Research & Analysis
            const researchPromise = GeminiService.researchCompany(currentJob.company, currentJob.companyUrl);
            const analysisPromise = GeminiService.analyzeResume(currentResume.textParams, currentJob, { portfolio: userProfile.portfolioUrl, linkedin: userProfile.linkedinUrl });

            const [researchResult, analysisResult] = await Promise.all([researchPromise, analysisPromise]);

            setResearch(researchResult);
            setAnalysis(analysisResult);
            setStatus(AppStatus.GENERATING);

            // 2. Generate Cover Letter (Default Action)
            const coverLetterText = await GeminiService.generateCoverLetter(
                currentResume.textParams,
                currentJob,
                researchResult,
                ToneType.PROFESSIONAL,
                { portfolio: userProfile.portfolioUrl, linkedin: userProfile.linkedinUrl }
            );

            const newCoverLetterState = {
                content: coverLetterText,
                tone: ToneType.PROFESSIONAL,
                isGenerating: false
            };

            setStatus(AppStatus.COMPLETED);
            updateCoverLetter(newCoverLetterState);

            // Update History
            if (activeJobId) {
                updateJobOutputs(activeJobId, {
                    research: researchResult,
                    analysis: analysisResult,
                    coverLetter: newCoverLetterState
                });
            }

            // Switch Sidebar to Analysis on completion
            setActiveSidebarTab('analysis');

            setActiveSidebarTab('analysis');

        } catch (e: unknown) {
            const message = errorService.handleError(e, {
                component: 'AppView',
                action: 'handleGenerate',
                jobId: activeJobId || undefined,
                resumeId: activeResumeId || undefined
            });
            handleError(message);
            useToastStore.getState().addToast({ type: 'error', message });
        }
    };

    return (
        <ErrorBoundary>
            <div className="flex h-screen bg-surface-base text-text-primary overflow-hidden">
                {/* 1. Left Navigation Sidebar (Vertical) */}
                <NavigationSidebar
                    onLogoClick={() => router.push('/')}
                    onSnapshotBeforeDashboard={snapshotCurrentJob}
                />

                {/* 2. Main Content Area (Flexible) */}
                <main className="flex-1 flex flex-col bg-surface-base relative border-r border-white/5 min-w-0 overflow-hidden pb-20 lg:pb-0">
                    {/* Global Context Switcher */}
                    <ContextSwitcher
                        jobs={jobs}
                        activeJobId={activeJobId}
                        resumes={resumes}
                        activeResumeId={activeResumeId}
                        onSelectStrategy={handleSelectStrategy}
                    />

                    {/* Loading Overlay */}
                    {(appState.status === AppStatus.PARSING_RESUME || appState.status === AppStatus.RESEARCHING || appState.status === AppStatus.ANALYZING || appState.status === AppStatus.GENERATING) && (
                        <div className="absolute inset-0 bg-surface-base/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
                            <div className="flex flex-col items-center gap-6">
                                <div className="relative w-16 h-16">
                                    <div className="absolute inset-0 border-t-2 border-accent rounded-full animate-spin"></div>
                                    <div className="absolute inset-2 border-r-2 border-white/20 rounded-full animate-spin [animation-direction:reverse]"></div>
                                </div>
                                <div className="font-interstate text-xs font-bold text-accent uppercase tracking-[0.2em] animate-pulse">
                                    {appState.status === AppStatus.PARSING_RESUME && "Ingesting Profile Data..."}
                                    {appState.status === AppStatus.RESEARCHING && "Running Market Intelligence..."}
                                    {appState.status === AppStatus.ANALYZING && "Calculating Fit Score..."}
                                    {appState.status === AppStatus.GENERATING && "Synthesizing Draft..."}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Empty State */}
                    {appState.status === AppStatus.IDLE && activeModule !== 'linkedin' && !activeJobId && !activeResumeId && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center opacity-30 pointer-events-none mt-20">
                            <Layout className="w-24 h-24 text-text-secondary mb-4" />
                            <h1 className="font-tiempos text-3xl text-text-primary">Rtios AI</h1>
                            <p className="font-interstate text-sm text-text-secondary mt-2">Executive Intelligence Suite</p>
                        </div>
                    )}

                    {/* Module Render */}
                    <>
                        <div className={`h-full flex flex-col ${activeModule === 'coverLetter' ? 'block' : 'hidden'}`}>
                            <FeatureErrorBoundary featureName="Cover Letter">
                                <CoverLetterFeature
                                    currentResume={currentResume || null}
                                    currentJob={currentJob}
                                    userProfile={userProfile}
                                    activeJobId={activeJobId}
                                    onUpdateJobOutputs={updateJobOutputs}
                                />
                            </FeatureErrorBoundary>
                        </div>
                        <div className={`h-full flex flex-col ${activeModule === 'linkedin' ? 'block' : 'hidden'}`}>
                            <FeatureErrorBoundary featureName="LinkedIn">
                                <LinkedInFeature
                                    currentResume={currentResume || null}
                                    currentJob={currentJob}
                                    activeJobId={activeJobId}
                                    onUpdateJobOutputs={updateJobOutputs}
                                />
                            </FeatureErrorBoundary>
                        </div>
                        <div className={`h-full flex flex-col ${activeModule === 'interview' ? 'block' : 'hidden'}`}>
                            <FeatureErrorBoundary featureName="Interview Prep">
                                <InterviewPrepFeature
                                    currentResume={currentResume || null}
                                    currentJob={currentJob}
                                    userProfile={userProfile}
                                    activeJobId={activeJobId}
                                    onUpdateJobOutputs={updateJobOutputs}
                                />
                            </FeatureErrorBoundary>
                        </div>
                    </>
                </main>

                {/* 3. Right Sidebar (Context & Intelligence) */}
                <RightSidebar
                    resumes={resumes}
                    activeResumeId={activeResumeId}
                    onAddResume={handleAddResume}
                    onSelectResume={handleSelectResume}
                    onDeleteResume={handleDeleteResume}
                    jobs={jobs}
                    activeJobId={activeJobId}
                    onAddJob={handleAddJob}
                    onSelectJob={handleSelectStrategy}
                    onDeleteJob={handleDeleteJobWithWorkspaceClear}
                    onGenerate={handleGenerate}
                    appStatus={appState.status}
                    isMobileOpen={isMobileSidebarOpen}
                    onMobileClose={() => setIsMobileSidebarOpen(false)}
                />

                {/* Mobile Floating Action Button to open sidebar */}
                <button
                    onClick={() => setIsMobileSidebarOpen(true)}
                    className="lg:hidden fixed bottom-20 right-4 z-30 w-14 h-14 bg-accent rounded-full shadow-lg flex items-center justify-center hover:bg-accent-hover transition-colors"
                    aria-label="Open workspace"
                >
                    <Menu className="w-6 h-6 text-surface-base" />
                </button>

                <ToastContainer />
            </div>
        </ErrorBoundary>
    );
};

export default AppView;
