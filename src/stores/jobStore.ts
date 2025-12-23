/**
 * Job Store - Zustand Store for Job Application Library
 * 
 * Centralizes job data to prevent redundant fetching across routes.
 * Caches job list and manages active job selection globally.
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist } from 'zustand/middleware';
import type { JobInfo, JobOutputs } from '@/src/domains/jobs/types';
import * as jobService from '@/src/domains/jobs/services/jobService';

interface JobStoreState {
    jobs: JobInfo[];
    activeJobId: string | null;
    isLoading: boolean;
    hasLoaded: boolean;
}

interface JobStoreActions {
    fetchJobs: (force?: boolean) => Promise<void>;
    addJob: (job: JobInfo) => Promise<string>;
    deleteJob: (id: string) => Promise<void>;
    updateJobOutputs: (jobId: string, outputs: JobOutputs, options?: { bulk?: boolean }) => Promise<void>;
    setActiveJobId: (id: string | null) => void;
    // Fallback for direct state manipulation during migration if needed
    setJobs: (jobs: JobInfo[]) => void;
}

type JobStore = JobStoreState & JobStoreActions;

export const useJobStore = create<JobStore>()(
    persist(
        immer((set, get) => ({
            // Initial state
            jobs: [],
            activeJobId: null,
            isLoading: false,
            hasLoaded: false,

            // Actions
            fetchJobs: async (force = false) => {
                // Return early if already loaded and not forcing a refresh
                if (get().hasLoaded && !force) return;

                set((state) => { state.isLoading = true; });
                try {
                    const fetched = await jobService.fetchJobs();
                    set((state) => {
                        state.jobs = fetched;
                        state.hasLoaded = true;
                        state.isLoading = false;
                    });
                } catch (error) {
                    console.error('[JobStore] Fetch failed:', error);
                    set((state) => { state.isLoading = false; });
                }
            },

            addJob: async (job: JobInfo) => {
                // Optimistic update
                const newJobId = job.id || crypto.randomUUID();
                const newJob = { ...job, id: newJobId, dateAdded: new Date(), outputs: job.outputs || {} };

                set((state) => {
                    state.jobs = [newJob, ...state.jobs];
                    state.activeJobId = newJobId;
                });

                // Persistence - MUST complete before returning
                try {
                    await jobService.saveJob(newJob);
                } catch (error) {
                    console.error('[JobStore] Add job failed:', {
                        error,
                        message: error instanceof Error ? error.message : 'Unknown error'
                    });
                    // Rollback optimistic update on failure
                    set((state) => {
                        state.jobs = state.jobs.filter(j => j.id !== newJobId);
                        if (state.activeJobId === newJobId) state.activeJobId = null;
                    });
                    throw error; // Re-throw to notify caller
                }
                return newJobId;
            },

            deleteJob: async (id: string) => {
                const { activeJobId, jobs } = get();

                // Optimistic delete
                set((state) => {
                    state.jobs = state.jobs.filter(j => j.id !== id);
                    if (state.activeJobId === id) state.activeJobId = null;
                });

                // Persistence
                try {
                    await jobService.deleteJob(id);
                } catch (error) {
                    console.error('[JobStore] Delete job failed:', error);
                    // Handle error/rollback
                }
            },

            updateJobOutputs: async (jobId: string, outputs: JobOutputs, options: { bulk?: boolean } = {}) => {
                // Optimistic update
                set((state) => {
                    const job = state.jobs.find(j => j.id === jobId);
                    if (job) {
                        job.outputs = { ...job.outputs, ...outputs };
                    }
                });

                // Persistence
                try {
                    if (options.bulk) {
                        await jobService.saveJobOutputsBulk(jobId, outputs);
                    } else {
                        // Fallback to individual updates if needed
                        if (outputs.research) await jobService.saveJobResearch(jobId, outputs.research);
                        if (outputs.analysis) await jobService.saveJobAnalysis(jobId, outputs.analysis);
                        if (outputs.coverLetter) await jobService.saveCoverLetter(jobId, outputs.coverLetter);
                        if (outputs.linkedIn) await jobService.saveLinkedIn(jobId, outputs.linkedIn);
                        if (outputs.interviewPrep) await jobService.saveInterviewPrep(jobId, outputs.interviewPrep);
                    }
                } catch (error) {
                    console.error('[JobStore] Update outputs failed:', {
                        error,
                        stringified: JSON.stringify(error, null, 2),
                        message: error instanceof Error ? error.message : 'Unknown error'
                    });
                }
            },

            setActiveJobId: (id) => set((state) => {
                state.activeJobId = id;
            }),

            setJobs: (jobs) => set((state) => {
                state.jobs = jobs;
                state.hasLoaded = true;
            }),
        })),
        {
            name: 'rtios_job_storage',
        }
    )
);
