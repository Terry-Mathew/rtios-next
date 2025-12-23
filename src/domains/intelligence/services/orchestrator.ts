/**
 * IntelligenceOrchestrator
 * 
 * Coordinates AI generation pipelines - pure orchestration that takes inputs
 * and returns outputs. No state mutation - the caller handles state updates.
 * 
 * This is a stateless service that can be tested with mock data.
 */

import type { JobInfo } from '@/src/domains/jobs/types';
import type { UserProfile } from '@/src/domains/career/types';
import type {
  ResearchResult,
  AnalysisResult,
  ToneType,
  LinkedInMessageInput,
  InterviewQuestion
} from '@/src/domains/intelligence/types';
import type { CoverLetterState } from '@/src/domains/workspace/types';

import {
  researchCompany,
  analyzeResume,
  generateCoverLetter,
  generateLinkedInMessage,
  generateInterviewQuestions
} from '@/src/domains/intelligence/actions';

/**
 * Result of the initial generation pipeline (research + analysis + cover letter)
 */
export interface InitialGenerationResult {
  research: ResearchResult;
  analysis: AnalysisResult;
  coverLetter: CoverLetterState;
}

/**
 * Runs the initial generation pipeline:
 * 1. Research company (in parallel with analysis)
 * 2. Analyze resume against job
 * 3. Generate cover letter
 */
export async function generateInitial(
  resumeText: string,
  job: JobInfo,
  profile: UserProfile,
  tone: ToneType = 'Professional' as ToneType
): Promise<InitialGenerationResult> {
  // 1. Parallel: Research & Analysis
  const [research, analysis] = await Promise.all([
    researchCompany(job.company, job.companyUrl),
    analyzeResume(resumeText, job, {
      portfolio: profile.portfolioUrl,
      linkedin: profile.linkedinUrl
    })
  ]);

  // 2. Generate Cover Letter (depends on research)
  const coverLetterContent = await generateCoverLetter(
    resumeText,
    job,
    research,
    tone,
    { portfolio: profile.portfolioUrl, linkedin: profile.linkedinUrl }
  );

  return {
    research,
    analysis,
    coverLetter: {
      content: coverLetterContent,
      tone,
      isGenerating: false
    }
  };
}

/**
 * Regenerates a cover letter with a different tone
 */
export async function regenerateCoverLetter(
  resumeText: string,
  job: JobInfo,
  research: ResearchResult,
  tone: ToneType,
  profile: UserProfile
): Promise<string> {
  return generateCoverLetter(
    resumeText,
    job,
    research,
    tone,
    { portfolio: profile.portfolioUrl, linkedin: profile.linkedinUrl }
  );
}

/**
 * Generates a LinkedIn outreach message
 */
export async function generateLinkedIn(
  resumeText: string,
  job: JobInfo,
  input: LinkedInMessageInput,
  researchSummary: string
): Promise<string> {
  return generateLinkedInMessage(resumeText, job, input, researchSummary);
}

/**
 * Generates interview prep questions (appends to existing)
 */
export async function generateInterview(
  resumeText: string,
  job: JobInfo,
  profile: UserProfile,
  existingQuestions: string[] = []
): Promise<InterviewQuestion[]> {
  return generateInterviewQuestions(resumeText, job, existingQuestions, {
    portfolio: profile.portfolioUrl,
    linkedin: profile.linkedinUrl
  });
}

