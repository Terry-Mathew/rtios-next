'use client';

/**
 * DashboardView.tsx - Dashboard Route Wrapper
 * 
 * This component wraps the Dashboard component and provides it with data from hooks.
 */

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Dashboard from '@/src/components/layout/Dashboard';
import { useResumeManagement } from '@/src/hooks/useResumeManagement';
import { useJobManagement } from '@/src/hooks/useJobManagement';
import { useAppStore } from '@/src/stores/appStore';
import { ErrorBoundary } from '@/src/components/errors/ErrorBoundary';
import { ToastContainer } from '@/src/components/ui/ToastContainer';

const DashboardView: React.FC = () => {
    const router = useRouter();
    const setCurrentView = useAppStore((s) => s.setCurrentView);
    const setActiveModule = useAppStore((s) => s.setActiveModule);

    // Sync appStore with current route
    useEffect(() => {
        setCurrentView('dashboard');
    }, [setCurrentView]);

    const {
        resumes,
        activeResumeId,
        userProfile,
        isLoading: isResumesLoading,
        addResume: handleAddResume,
        deleteResume: handleDeleteResume,
        updateProfile: setUserProfile,
        syncFromStorage // NEW: Sync function
    } = useResumeManagement();

    // Sync career data from storage when mounting DashboardView
    useEffect(() => {
        syncFromStorage();
    }, [syncFromStorage]);

    const {
        jobs,
        activeJobId,
        isLoading: isJobsLoading,
        selectJob: handleSelectStrategy,
        deleteJobWithWorkspaceClear: handleDeleteJobWithWorkspaceClear,
    } = useJobManagement();

    const isLoading = isResumesLoading || isJobsLoading;



    const handleNavigateToApp = () => {
        router.push('/app');
    };

    return (
        <ErrorBoundary>
            <div className="flex h-screen bg-surface-base text-text-primary overflow-hidden">
                {/* Navigation Sidebar - Custom for Dashboard Route */}
                <nav className="w-20 bg-surface-base border-r border-white/5 flex flex-col items-center py-6 shrink-0 z-20">
                    {/* Logo */}
                    <div className="mb-8 cursor-pointer" onClick={() => router.push('/')}>
                        <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(0,255,127,0.2)]">
                            <svg className="w-6 h-6 text-surface-base fill-surface-base" viewBox="0 0 24 24">
                                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                            </svg>
                        </div>
                    </div>

                    {/* Navigation Items */}
                    <div className="flex-1 flex flex-col gap-6 w-full px-2">
                        {/* Dashboard Button - Active */}
                        <button
                            className="group flex flex-col items-center gap-1.5 p-2 rounded-lg transition-all bg-white/5 text-accent"
                        >
                            <svg className="w-5 h-5 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="3" width="7" height="7"></rect>
                                <rect x="14" y="3" width="7" height="7"></rect>
                                <rect x="14" y="14" width="7" height="7"></rect>
                                <rect x="3" y="14" width="7" height="7"></rect>
                            </svg>
                            <span className="text-[9px] font-interstate uppercase font-bold text-center">Command</span>
                        </button>

                        {/* Divider */}
                        <div className="h-px w-full bg-white/10 my-2"></div>

                        {/* Cover Letter Button */}
                        <button
                            onClick={() => { setActiveModule('coverLetter'); router.push('/app'); }}
                            className="group flex flex-col items-center gap-1.5 p-2 rounded-lg transition-all text-text-secondary hover:text-text-primary hover:bg-white/5"
                        >
                            <svg className="w-5 h-5 text-text-secondary group-hover:text-text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                <line x1="16" y1="17" x2="8" y2="17"></line>
                                <polyline points="10 9 9 9 8 9"></polyline>
                            </svg>
                            <span className="text-[9px] font-interstate uppercase font-bold">Pitch</span>
                        </button>

                        {/* LinkedIn Button */}
                        <button
                            onClick={() => { setActiveModule('linkedin'); router.push('/app'); }}
                            className="group flex flex-col items-center gap-1.5 p-2 rounded-lg transition-all text-text-secondary hover:text-text-primary hover:bg-white/5"
                        >
                            <svg className="w-5 h-5 text-text-secondary group-hover:text-text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                            </svg>
                            <span className="text-[9px] font-interstate uppercase font-bold">Signal</span>
                        </button>

                        {/* Interview Prep Button */}
                        <button
                            onClick={() => { setActiveModule('interview'); router.push('/app'); }}
                            className="group flex flex-col items-center gap-1.5 p-2 rounded-lg transition-all text-text-secondary hover:text-text-primary hover:bg-white/5"
                        >
                            <svg className="w-5 h-5 text-text-secondary group-hover:text-text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 2a10 10 0 1 0 10 10H12V2z"></path>
                                <path d="M12 12h10a10 10 0 0 1-10 10V12z"></path>
                            </svg>
                            <span className="text-[9px] font-interstate uppercase font-bold">War Room</span>
                        </button>
                    </div>
                </nav>

                <Dashboard
                    jobs={jobs}
                    resumes={resumes}
                    userProfile={userProfile}
                    activeJobId={activeJobId}
                    activeResumeId={activeResumeId}
                    isLoading={isLoading}
                    onSelectStrategy={handleSelectStrategy}
                    onDeleteJob={handleDeleteJobWithWorkspaceClear}
                    onDeleteResume={handleDeleteResume}
                    onAddResume={handleAddResume}
                    onUpdateProfile={setUserProfile}
                    onNavigateToApp={handleNavigateToApp}
                />
                <ToastContainer />
            </div>
        </ErrorBoundary>
    );
};

export default DashboardView;
