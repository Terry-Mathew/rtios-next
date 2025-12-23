/**
 * JobSnapshotController
 * 
 * Manages snapshot/hydration coordination for job switching:
 * - Snapshot: Save current workspace state to a job's outputs
 * - Hydrate: Restore workspace state from a job's outputs
 * - Clear: Reset workspace to empty state
 * 
 * Responsibilities extracted from App.tsx:
 * 1. snapshotCurrentStateToJob logic
 * 2. handleSelectStrategy snapshot/hydrate coordination
 * 3. handleAddNewStrategy workspace clearing
 * 
 * Usage: This controller provides pure functions that take state and return
 * actions. The caller (App.tsx) is responsible for executing the actions.
 */

import type { JobInfo, JobOutputs } from '@/src/domains/jobs/types';
import type { AppState, CoverLetterState, LinkedInState, InterviewPrepState } from '@/src/domains/workspace/types';

import { ToneType, AppStatus } from '@/src/domains/workspace/types';

// Default empty workspace state for hydration fallbacks
const DEFAULT_COVER_LETTER: CoverLetterState = {
  content: '',
  isGenerating: false,
  tone: ToneType.PROFESSIONAL
};

const DEFAULT_LINKEDIN = (existingInput?: LinkedInState['input']): LinkedInState => ({
  input: existingInput || {
    connectionStatus: 'new',
    recruiterName: '',
    recruiterTitle: '',
    connectionContext: '',
    messageIntent: '',
    recentActivity: '',
    mutualConnection: '',
    customAddition: '',
    tone: 'Warm Professional'
  },
  generatedMessage: '',
  isGenerating: false
});

const DEFAULT_INTERVIEW_PREP: InterviewPrepState = {
  questions: [],
  isGenerating: false
};

/**
 * Creates a snapshot of workspace state for saving to job outputs
 */
export function createSnapshot(appState: AppState): JobOutputs {
  return {
    research: appState.research,
    analysis: appState.analysis,
    coverLetter: appState.coverLetter,
    linkedIn: appState.linkedIn,
    interviewPrep: appState.interviewPrep
  };
}

/**
 * Hydrates workspace state from job outputs
 * Returns partial AppState updates (caller merges with existing state)
 */
export function hydrateFromJob(
  job: JobInfo | undefined,
  currentLinkedInInput?: LinkedInState['input']
): Partial<AppState> {
  if (!job) {
    return clearWorkspace(currentLinkedInInput);
  }

  return {
    research: job.outputs?.research || null,
    analysis: job.outputs?.analysis || null,
    coverLetter: job.outputs?.coverLetter || DEFAULT_COVER_LETTER,
    linkedIn: job.outputs?.linkedIn || DEFAULT_LINKEDIN(currentLinkedInInput),
    interviewPrep: job.outputs?.interviewPrep || DEFAULT_INTERVIEW_PREP,
    status: job.outputs?.coverLetter?.content ? AppStatus.COMPLETED : AppStatus.IDLE
  };
}

/**
 * Clears workspace state (for new job creation or job deletion)
 * Preserves LinkedIn input preferences
 */
export function clearWorkspace(currentLinkedInInput?: LinkedInState['input']): Partial<AppState> {
  return {
    research: null,
    analysis: null,
    coverLetter: DEFAULT_COVER_LETTER,
    linkedIn: DEFAULT_LINKEDIN(currentLinkedInInput),
    interviewPrep: DEFAULT_INTERVIEW_PREP,
    status: AppStatus.IDLE
  };
}

/**
 * Hook-style helper: Use with useJobApplications for coordinated operations
 * Returns a set of operations that can be called during job switching
 */
export interface SnapshotOperations {
  snapshot: (jobId: string, appState: AppState) => JobOutputs;
  hydrate: (job: JobInfo | undefined, currentLinkedInInput?: LinkedInState['input']) => Partial<AppState>;
  clear: (currentLinkedInInput?: LinkedInState['input']) => Partial<AppState>;
}

export function createSnapshotOperations(): SnapshotOperations {
  return {
    snapshot: (_jobId: string, appState: AppState) => createSnapshot(appState),
    hydrate: hydrateFromJob,
    clear: clearWorkspace
  };
}

/**
 * Full job switch operation - returns both the snapshot for old job
 * and the hydration state for new job
 */
export interface JobSwitchResult {
  snapshotForOldJob: JobOutputs | null;
  hydratedState: Partial<AppState>;
}

export function performJobSwitch(
  oldJobId: string | null,
  newJob: JobInfo | undefined,
  currentAppState: AppState
): JobSwitchResult {
  // Create snapshot of current state (for old job if exists)
  const snapshotForOldJob = oldJobId ? createSnapshot(currentAppState) : null;

  // Hydrate from new job (or clear if no new job)
  const hydratedState = hydrateFromJob(newJob, currentAppState.linkedIn.input);

  return {
    snapshotForOldJob,
    hydratedState
  };
}

