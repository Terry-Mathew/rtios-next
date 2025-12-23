/**
 * JobApplications Domain Types
 * 
 * Owns: Job list, active job selection, job-owned outputs/history
 * Invariant: Outputs belong to jobs (stored in JobInfo.outputs)
 */

import type { ResearchResult, AnalysisResult } from '@/src/domains/intelligence/types';
import type { CoverLetterState, LinkedInState, InterviewPrepState } from '@/src/domains/workspace/types';

export interface JobOutputs {
  research?: ResearchResult | null;
  analysis?: AnalysisResult | null;
  coverLetter?: CoverLetterState;
  linkedIn?: LinkedInState;
  interviewPrep?: InterviewPrepState;
}

export interface JobInfo {
  id?: string;
  title: string;
  company: string;
  description: string;
  companyUrl?: string;
  sourceUrl?: string;
  dateAdded?: Date;
  contextName?: string; // The "Target Identifier Name"
  linkedResumeId?: string; // To bind a specific resume to this strategy
  outputs?: JobOutputs; // Persisted generation history
}

/**
 * Type for job output updates (used by UI layer for partial updates)
 * Omits 'id' to prevent accidental ID updates, adds updatedAt tracking
 */
export type JobOutputsUpdate = Partial<Omit<JobOutputs, 'id'>> & {
  updatedAt?: Date;
};

