/**
 * Root Types - Re-exports from Domain Types
 */

// Career Domain
export type { SavedResume, UserProfile } from '@/src/domains/career/types';

// Jobs Domain
export type { JobInfo, JobOutputs } from '@/src/domains/jobs/types';

// Intelligence Domain
export { 
  ToneType,
  CONNECTION_CONTEXTS,
  MESSAGE_INTENTS 
} from '@/src/domains/intelligence/types';
export type { 
  ResearchResult, 
  AnalysisResult, 
  InterviewQuestion,
  ConnectionStatus,
  LinkedInTone,
  LinkedInMessageInput
} from '@/src/domains/intelligence/types';

// Workspace Domain
export { AppStatus } from '@/src/domains/workspace/types';
export type { 
  AppState, 
  View, 
  LibraryState,
  CoverLetterState, 
  LinkedInState, 
  InterviewPrepState 
} from '@/src/domains/workspace/types';
