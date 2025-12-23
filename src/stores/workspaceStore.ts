/**
 * Workspace Store - Zustand Store for Workspace Execution State
 * 
 * Manages transient workspace state:
 * - status, error, resumeText
 * - research, analysis (AI outputs)
 * - coverLetter, linkedIn, interviewPrep (module states)
 * 
 * Uses Immer middleware for immutable state updates.
 * 
 * NOTE: Does NOT include 'library' or 'activeJobId' - those belong elsewhere.
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { 
  AppStatus, 
  ResearchResult, 
  AnalysisResult, 
  CoverLetterState, 
  LinkedInState, 
  InterviewPrepState,
  ToneType 
} from '@/src/types';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * State properties for the workspace store
 */
interface WorkspaceStoreState {
  status: AppStatus;
  error: string | undefined;
  resumeText: string;
  research: ResearchResult | null;
  analysis: AnalysisResult | null;
  coverLetter: CoverLetterState;
  linkedIn: LinkedInState;
  interviewPrep: InterviewPrepState;
}

/**
 * Action methods for the workspace store
 */
interface WorkspaceStoreActions {
  setStatus: (status: AppStatus) => void;
  setError: (error: string | undefined) => void;
  setResumeText: (text: string) => void;
  setResearch: (research: ResearchResult | null) => void;
  setAnalysis: (analysis: AnalysisResult | null) => void;
  updateCoverLetter: (updates: Partial<CoverLetterState>) => void;
  updateLinkedIn: (updates: Partial<LinkedInState>) => void;
  updateInterviewPrep: (updates: Partial<InterviewPrepState>) => void;
  clearWorkspace: (linkedInInput: LinkedInState['input']) => void;
}

/**
 * Combined store type
 */
type WorkspaceStore = WorkspaceStoreState & WorkspaceStoreActions;

// ============================================================================
// Initial State Constants
// ============================================================================

const initialCoverLetterState: CoverLetterState = {
  content: '',
  isGenerating: false,
  tone: ToneType.PROFESSIONAL
};

const initialLinkedInState: LinkedInState = {
  input: {
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
};

const initialInterviewPrepState: InterviewPrepState = {
  questions: [],
  isGenerating: false
};

// ============================================================================
// Store Implementation
// ============================================================================

export const useWorkspaceStore = create<WorkspaceStore>()(
  immer((set) => ({
    // Initial state
    status: AppStatus.IDLE,
    error: undefined,
    resumeText: '',
    research: null,
    analysis: null,
    coverLetter: initialCoverLetterState,
    linkedIn: initialLinkedInState,
    interviewPrep: initialInterviewPrepState,

    // Simple setters
    setStatus: (status) => set((state) => {
      state.status = status;
    }),

    setError: (error) => set((state) => {
      state.error = error;
    }),

    setResumeText: (text) => set((state) => {
      state.resumeText = text;
    }),

    setResearch: (research) => set((state) => {
      state.research = research;
    }),

    setAnalysis: (analysis) => set((state) => {
      state.analysis = analysis;
    }),

    // Partial updates for nested objects
    updateCoverLetter: (updates) => set((state) => {
      Object.assign(state.coverLetter, updates);
    }),

    updateLinkedIn: (updates) => set((state) => {
      Object.assign(state.linkedIn, updates);
    }),

    updateInterviewPrep: (updates) => set((state) => {
      Object.assign(state.interviewPrep, updates);
    }),

    // Clear workspace (reset to initial but preserve LinkedIn input)
    clearWorkspace: (linkedInInput) => set((state) => {
      state.status = AppStatus.IDLE;
      state.error = undefined;
      state.resumeText = '';
      state.research = null;
      state.analysis = null;
      state.coverLetter = { ...initialCoverLetterState };
      state.linkedIn = {
        input: linkedInInput,
        generatedMessage: '',
        isGenerating: false
      };
      state.interviewPrep = { ...initialInterviewPrepState };
    }),
  }))
);

