/**
 * useJobApplications Hook
 * 
 * Manages JobApplications domain state by connecting to the global JobStore.
 * 
 * Responsibilities:
 * 1. Provides jobs list (synchronized across routes)
 * 2. Manages activeJobId (synchronized across routes)
 * 3. Exposes CRUD actions (add, delete, update outputs)
 */

import { useCallback, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useJobStore } from '@/src/stores/jobStore';
import type { JobInfo, JobOutputs } from '@/src/domains/jobs/types';

export interface UseJobApplicationsReturn {
  // State
  jobs: JobInfo[];
  activeJobId: string | null;
  currentJob: JobInfo | undefined;
  isLoading: boolean;

  // Actions
  addJob: (job: JobInfo) => Promise<string>;
  selectJob: (id: string) => void;
  deleteJob: (id: string) => Promise<void>;
  updateJobOutputs: (jobId: string, outputs: JobOutputs, options?: { bulk?: boolean }) => Promise<void>;

  // Legacy/Compatibility
  setJobs: (jobs: JobInfo[]) => void;
  setActiveJobId: (id: string | null) => void;
}

export function useJobApplications(): UseJobApplicationsReturn {
  // Subscribe to global store with shallow comparison for performance
  const {
    jobs,
    activeJobId,
    isLoading,
    fetchJobs,
    addJob,
    deleteJob,
    updateJobOutputs,
    setActiveJobId,
    setJobs
  } = useJobStore(useShallow((s) => ({
    jobs: s.jobs,
    activeJobId: s.activeJobId,
    isLoading: s.isLoading,
    fetchJobs: s.fetchJobs,
    addJob: s.addJob,
    deleteJob: s.deleteJob,
    updateJobOutputs: s.updateJobOutputs,
    setActiveJobId: s.setActiveJobId,
    setJobs: s.setJobs
  })));

  // Derived: Current job
  const currentJob = jobs.find(j => j.id === activeJobId);

  // Initial Fetch on Mount (if not already loaded)
  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  /**
   * Select a job as active
   */
  const selectJob = useCallback((id: string) => {
    setActiveJobId(id);
  }, [setActiveJobId]);

  return {
    jobs,
    activeJobId,
    currentJob,
    isLoading,
    addJob,
    selectJob,
    deleteJob,
    updateJobOutputs,
    setJobs,
    setActiveJobId
  };
}
