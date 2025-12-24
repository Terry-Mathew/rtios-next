import React, { lazy, Suspense } from 'react';
import { useAppStore } from '@/src/stores/appStore';
import InputForm from '@/src/components/layout/InputForm';
import CompanyResearchDisplay from '@/src/components/features/research/CompanyResearchDisplay';
import { useShallow } from 'zustand/react/shallow';
import { useWorkspaceStore } from '@/src/stores/workspaceStore';
import type { SavedResume, UserProfile, JobInfo, AppStatus } from '@/src/types';
import LoadingFallback from '@/src/components/shared/LoadingFallback';
import { X } from 'lucide-react';
import UsageCounter from '@/src/components/layout/UsageCounter';

// Lazy load heavy chart component
const ResumeAnalysisDisplay = lazy(() => import('@/src/components/features/analysis/ResumeAnalysisDisplay'));

interface RightSidebarProps {
    // Resume/Profile data
    resumes: SavedResume[];
    activeResumeId: string | null;
    onAddResume: (file: File) => Promise<void>;
    onSelectResume: (id: string) => void;
    onDeleteResume: (id: string) => void;

    // Job data
    jobs: JobInfo[];
    activeJobId: string | null;
    onAddJob: (job: JobInfo) => Promise<void>;
    onSelectJob: (id: string) => void;
    onDeleteJob: (id: string) => void;

    // Actions
    onGenerate: () => Promise<void>;
    appStatus: AppStatus;

    // Mobile drawer control
    isMobileOpen?: boolean;
    onMobileClose?: () => void;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({
    resumes,
    activeResumeId,
    onAddResume,
    onSelectResume,
    onDeleteResume,
    jobs,
    activeJobId,
    onAddJob,
    onSelectJob,
    onDeleteJob,
    onGenerate,
    appStatus,
    isMobileOpen = false,
    onMobileClose
}) => {
    // Get tab state from appStore
    const activeSidebarTab = useAppStore((s) => s.activeSidebarTab);
    const setActiveSidebarTab = useAppStore((s) => s.setActiveSidebarTab);

    // Get workspace data for display components (use useShallow)
    const { research, analysis } = useWorkspaceStore(
        useShallow((s) => ({
            research: s.research,
            analysis: s.analysis
        }))
    );

    return (
        <>
            {/* Mobile overlay backdrop */}
            <div
                className={`lg:hidden fixed inset-0 bg-black/50 z-30 transition-opacity duration-300 ${isMobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
                onClick={onMobileClose}
                aria-hidden="true"
            />

            <aside className={`
                fixed lg:relative
                right-0 top-0 h-full
                w-[85vw] max-w-[400px] lg:w-[400px] xl:w-[35%] lg:max-w-[600px]
                bg-surface-elevated border-l border-white/5
                flex flex-col shrink-0
                transition-transform duration-300 ease-out z-40
                ${isMobileOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
            `}>
                {/* Mobile close button */}
                <button
                    onClick={onMobileClose}
                    className="lg:hidden absolute top-4 right-4 z-50 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                    aria-label="Close sidebar"
                >
                    <X className="w-5 h-5 text-text-secondary" />
                </button>


                {/* Sidebar Tabs */}
                <div className="flex items-center border-b border-white/5">
                    <button
                        onClick={() => setActiveSidebarTab('input')}
                        className={`flex-1 py-4 text-xs font-interstate font-bold uppercase tracking-widest transition-colors
            ${activeSidebarTab === 'input'
                                ? 'text-text-primary border-b border-accent bg-white/5'
                                : 'text-text-secondary hover:text-text-primary hover:bg-white/5'}`}
                    >
                        Workspace
                    </button>
                    <button
                        onClick={() => setActiveSidebarTab('analysis')}
                        className={`flex-1 py-4 text-xs font-interstate font-bold uppercase tracking-widest transition-colors
            ${activeSidebarTab === 'analysis'
                                ? 'text-text-primary border-b border-accent bg-white/5'
                                : 'text-text-secondary hover:text-text-primary hover:bg-white/5'}`}
                    >
                        Analysis
                    </button>
                    <button
                        onClick={() => setActiveSidebarTab('research')}
                        className={`flex-1 py-4 text-xs font-interstate font-bold uppercase tracking-widest transition-colors
            ${activeSidebarTab === 'research'
                                ? 'text-text-primary border-b border-accent bg-white/5'
                                : 'text-text-secondary hover:text-text-primary hover:bg-white/5'}`}
                    >
                        Intel
                    </button>
                </div>

                {/* Usage Counter - Shows free tier usage */}
                <UsageCounter />

                {/* Sidebar Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className={`h-full ${activeSidebarTab === 'input' ? 'block' : 'hidden'}`}>
                        <InputForm
                            resumes={resumes}
                            activeResumeId={activeResumeId}
                            onAddResume={onAddResume}
                            onSelectResume={onSelectResume}
                            onDeleteResume={onDeleteResume}
                            jobs={jobs}
                            activeJobId={activeJobId}
                            onAddJob={onAddJob}
                            onSelectJob={onSelectJob}
                            onDeleteJob={onDeleteJob}
                            onGenerate={onGenerate}
                            appStatus={appStatus}
                        />
                    </div>
                    <div className={`h-full ${activeSidebarTab === 'analysis' ? 'block' : 'hidden'}`}>
                        <Suspense fallback={<LoadingFallback />}>
                            <ResumeAnalysisDisplay analysis={analysis} />
                        </Suspense>
                    </div>
                    <div className={`h-full ${activeSidebarTab === 'research' ? 'block' : 'hidden'}`}>
                        <CompanyResearchDisplay research={research} />
                    </div>
                </div>

            </aside>
        </>
    );
};
