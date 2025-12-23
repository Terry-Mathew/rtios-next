/**
 * useJobManagement Hook
 * 
 * Consolidates all job management logic from route components:
 * - Job CRUD operations (add, delete, select)
 * - Workspace synchronization (snapshot/hydrate)
 * - Job switching with automatic state preservation
 * 
 * This hook eliminates duplicate logic between AppView and DashboardView
 * and provides a single source of truth for job management operations.
 */

import { useCallback, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useJobApplications } from '@/src/domains/jobs/hooks/useJobApplications';
import { useWorkspaceStore } from '@/src/stores/workspaceStore';
import { createSnapshot, hydrateFromJob } from '@/src/domains/jobs/controllers/JobSnapshotController';
import { AppStatus } from '@/src/types';
import type { JobInfo } from '@/src/types';
import { errorService } from '@/src/services/errorService';
import { useToastStore } from '@/src/stores/toastStore';

interface UseJobManagementReturn {
    // Data
    jobs: JobInfo[];
    activeJobId: string | null;
    currentJob: JobInfo;
    isLoading: boolean;

    // Actions
    addJob: (job: JobInfo) => Promise<void>;
    selectJob: (jobId: string) => void;
    deleteJob: (jobId: string) => void;
    deleteJobWithWorkspaceClear: (jobId: string) => void;
    snapshotCurrentJob: () => void;
    addNewJobStrategy: () => void;

    // Low-level operations
    updateJobOutputs: (jobId: string, outputs: import('@/src/domains/jobs/types').JobOutputsUpdate) => void;
    setActiveJobId: (id: string | null) => void;
    setJobs: (jobs: JobInfo[]) => void;
}

export const useJobManagement = (): UseJobManagementReturn => {
    // Get job domain state
    const {
        jobs,
        activeJobId,
        addJob: addJobToApplications,
        deleteJob: handleDeleteJob,
        updateJobOutputs,
        setActiveJobId,
        setJobs,
        isLoading
    } = useJobApplications();

    // Get workspace state and actions (using useShallow to prevent infinite re-renders)
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
        setResumeText,
        setResearch,
        setAnalysis,
        updateCoverLetter,
        updateLinkedIn,
        updateInterviewPrep,
        clearWorkspace: clearWorkspaceStore
    } = useWorkspaceStore();

    // Derived data - memoized to prevent recalculation on every render
    const currentJob = useMemo(
        () => jobs.find(j => j.id === activeJobId) || {
            id: '',
            title: '',
            company: '',
            description: '',
            companyUrl: ''
        },
        [jobs, activeJobId]
    );

    // Snapshot current workspace to active job
    const snapshotCurrentJob = useCallback(() => {
        try {
            if (!activeJobId) return;
            const snapshot = createSnapshot(appState);
            updateJobOutputs(activeJobId, snapshot);
        } catch (error) {
            console.error('Failed to snapshot job:', error);
            // Silent fail for auto-save, but log it
        }
    }, [activeJobId, updateJobOutputs, appState]);

    // Add new job (snapshots current first)
    const addJob = useCallback(async (job: JobInfo) => {
        try {
            if (activeJobId) snapshotCurrentJob();
            await addJobToApplications(job);
            clearWorkspaceStore(appState.linkedIn.input);
            setStatus(AppStatus.IDLE);
            useToastStore.getState().addToast({ type: 'success', message: 'Job added successfully' });
        } catch (error: unknown) {
            const message = errorService.handleError(error, {
                component: 'useJobManagement',
                action: 'addJob',
                jobTitle: job.title
            });
            useToastStore.getState().addToast({ type: 'error', message });
        }
    }, [activeJobId, snapshotCurrentJob, addJobToApplications, clearWorkspaceStore, setStatus, appState]);

    // Select/switch to different job
    const selectJob = useCallback((jobId: string) => {
        // 1. Snapshot current job (bulk save recommended)
        if (activeJobId) {
            const snapshot = createSnapshot(appState);
            updateJobOutputs(activeJobId, snapshot, { bulk: true });
        }

        // 2. Hydrate from target job
        const targetJob = jobs.find(j => j.id === jobId);
        const hydratedState = hydrateFromJob(targetJob, appState.linkedIn.input);

        // 3. Batch apply updates to workspace store
        // We do this individually but sequentially; however, because they are inside a useCallback
        // that's triggered by a UI event, React 18 will batch these automatically.
        // We also ensure we only update if values actually changed to prevent redundant work.
        useWorkspaceStore.setState((state) => {
            if (hydratedState.status !== undefined) state.status = hydratedState.status;
            if (hydratedState.resumeText !== undefined) state.resumeText = hydratedState.resumeText;
            if (hydratedState.research !== undefined) state.research = hydratedState.research;
            if (hydratedState.analysis !== undefined) state.analysis = hydratedState.analysis;

            if (hydratedState.coverLetter) {
                state.coverLetter = { ...state.coverLetter, ...hydratedState.coverLetter };
            }
            if (hydratedState.linkedIn) {
                state.linkedIn = { ...state.linkedIn, ...hydratedState.linkedIn };
            }
            if (hydratedState.interviewPrep) {
                state.interviewPrep = { ...state.interviewPrep, ...hydratedState.interviewPrep };
            }

            if (!hydratedState.status) state.status = AppStatus.IDLE;
        });

        // 4. Set as active
        setActiveJobId(jobId);
    }, [
        activeJobId,
        jobs,
        updateJobOutputs,
        setStatus,
        setResumeText,
        setResearch,
        setAnalysis,
        updateCoverLetter,
        updateLinkedIn,
        updateInterviewPrep,
        setActiveJobId,
        appState
    ]);

    // Delete job (simple)
    const deleteJob = useCallback((jobId: string) => {
        try {
            handleDeleteJob(jobId);
            useToastStore.getState().addToast({ type: 'success', message: 'Job deleted' });
        } catch (error: unknown) {
            const message = errorService.handleError(error, {
                component: 'useJobManagement',
                action: 'deleteJob',
                jobId
            });
            useToastStore.getState().addToast({ type: 'error', message });
        }
    }, [handleDeleteJob]);

    // Delete job with workspace clear
    const deleteJobWithWorkspaceClear = useCallback((jobId: string) => {
        try {
            const wasActive = activeJobId === jobId;
            handleDeleteJob(jobId);
            if (wasActive) {
                clearWorkspaceStore(appState.linkedIn.input);
            }
            useToastStore.getState().addToast({ type: 'success', message: 'Job deleted' });
        } catch (error: unknown) {
            const message = errorService.handleError(error, {
                component: 'useJobManagement',
                action: 'deleteJobWithWorkspaceClear',
                jobId
            });
            useToastStore.getState().addToast({ type: 'error', message });
        }
    }, [activeJobId, handleDeleteJob, clearWorkspaceStore, appState]);

    // Add new job strategy (clears workspace)
    const addNewJobStrategy = useCallback(() => {
        if (activeJobId) snapshotCurrentJob();
        setActiveJobId(null);
        clearWorkspaceStore(appState.linkedIn.input);
        setStatus(AppStatus.IDLE);
    }, [activeJobId, snapshotCurrentJob, setActiveJobId, clearWorkspaceStore, setStatus, appState]);

    return {
        // Data
        jobs,
        activeJobId,
        currentJob,
        isLoading,

        // Actions
        addJob,
        selectJob,
        deleteJob,
        deleteJobWithWorkspaceClear,
        snapshotCurrentJob,
        addNewJobStrategy,

        // Low-level
        updateJobOutputs,
        setActiveJobId,
        setJobs
    };
};
