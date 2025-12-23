/**
 * useJobApplications Hook
 * 
 * Manages JobApplications domain state:
 * - Job library (fetched from Supabase)
 * - Active job selection
 * - Persistence (Save to Supabase)
 * 
 * Responsibilities:
 * 1. jobs state (async fetch)
 * 2. activeJobId state
 * 3. addJob (async)
 * 4. deleteJob (async)
 * 5. updateJobOutputs (async persistence)
 */

import { useState, useCallback, useEffect } from 'react';
import type { JobInfo, JobOutputs } from '@/src/domains/jobs/types';
import * as jobService from '@/src/domains/jobs/services/jobService';

export interface UseJobApplicationsReturn {
  // State
  jobs: JobInfo[];
  activeJobId: string | null;
  currentJob: JobInfo | undefined;

  // Actions
  addJob: (job: JobInfo) => Promise<string>; // Returns new job ID
  selectJob: (id: string) => void;
  deleteJob: (id: string) => Promise<void>;
  updateJobOutputs: (jobId: string, outputs: JobOutputs) => Promise<void>;

  // For backward compatibility during migration
  setJobs: React.Dispatch<React.SetStateAction<JobInfo[]>>;
  setActiveJobId: React.Dispatch<React.SetStateAction<string | null>>;
}

export function useJobApplications(): UseJobApplicationsReturn {
  const [jobs, setJobs] = useState<JobInfo[]>([]);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);

  // Derived: Current job
  const currentJob = jobs.find(j => j.id === activeJobId);

  // --- Persistence Effects ---

  // Initial Load with Service
  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try {
        const fetched = await jobService.fetchJobs();
        if (mounted && fetched.length > 0) {
          setJobs(fetched);
          // Optionally defaults to first one if none active
        }
      } catch (error) {
        console.error('Failed to load jobs:', error);
      }
    };
    init();
    return () => { mounted = false; };
  }, []);

  // --- Actions ---

  /**
   * Add a new job and make it active
   * Returns the new job's ID
   */
  const addJob = useCallback(async (job: JobInfo): Promise<string> => {
    // Generate UUID Client-side for optimistic UI
    const newJobId = crypto.randomUUID();
    const newJob: JobInfo = {
      ...job,
      id: newJobId,
      dateAdded: new Date(),
      outputs: {}
    };

    // Optimistic Update
    setJobs(prev => [newJob, ...prev]);
    setActiveJobId(newJobId);

    // Persist
    try {
      await jobService.saveJob(newJob);
    } catch (e) {
      console.error('Failed to save job:', e);
      // TODO: Toast or Rollback
    }

    return newJobId;
  }, []);

  /**
   * Select a job as active (basic selection only)
   */
  const selectJob = useCallback((id: string) => {
    setActiveJobId(id);
  }, []);

  /**
   * Delete a job
   */
  const deleteJob = useCallback(async (id: string) => {
    // Optimistic
    setJobs(prev => prev.filter(j => j.id !== id));
    if (activeJobId === id) {
      setActiveJobId(null);
    }

    try {
      await jobService.deleteJob(id);
    } catch (e) {
      console.error('Failed to delete job:', e);
    }
  }, [activeJobId]);

  /**
   * Update a job's outputs (for snapshot functionality)
   */
  const updateJobOutputs = useCallback(async (jobId: string, outputs: JobOutputs) => {
    // Optimistic
    setJobs(prevJobs => prevJobs.map(j =>
      j.id === jobId ? { ...j, outputs: { ...j.outputs, ...outputs } } : j
    ));

    // Persist Individual Pieces
    try {
      if (outputs.research) await jobService.saveJobResearch(jobId, outputs.research);
      if (outputs.analysis) await jobService.saveJobAnalysis(jobId, outputs.analysis);
      if (outputs.coverLetter) await jobService.saveCoverLetter(jobId, outputs.coverLetter);
      if (outputs.linkedIn) await jobService.saveLinkedIn(jobId, outputs.linkedIn);
      if (outputs.interviewPrep) await jobService.saveInterviewPrep(jobId, outputs.interviewPrep);
    } catch (e) {
      console.error('Failed to save job outputs:', e);
    }
  }, []);

  return {
    jobs,
    activeJobId,
    currentJob,
    addJob,
    selectJob,
    deleteJob,
    updateJobOutputs,
    setJobs,
    setActiveJobId
  };
}
