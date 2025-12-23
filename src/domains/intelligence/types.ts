/**
 * GeneratedIntelligence Domain Types
 * 
 * Owns: AI generation result types (stateless)
 * Invariant: Pure and stateless, no UI/storage dependencies
 */

export interface ResearchResult {
  summary: string;
  sources: Array<{ title: string; uri: string }>;
}

export interface AnalysisResult {
  score: number;
  missingKeywords: string[];
  recommendations: string[];
  atsCompatibility: string;
}

export enum ToneType {
  PROFESSIONAL = 'Professional',
  CONVERSATIONAL = 'Conversational',
  CREATIVE = 'Creative',
  BOLD = 'Bold',
}

export type ConnectionStatus = 'new' | 'existing';

export type LinkedInTone = 'Warm Professional' | 'Professional' | 'Casual Confident' | 'Industry-Specific';

export interface LinkedInMessageInput {
  connectionStatus: ConnectionStatus;
  recruiterName: string;
  recruiterTitle: string;
  connectionContext: string;
  messageIntent: string;
  recentActivity: string;
  mutualConnection: string;
  customAddition: string;
  tone: LinkedInTone;
  missingContext?: string;
}

export interface InterviewQuestion {
  id: string;
  question: string;
  type: 'Behavioral' | 'Technical' | 'Situational';

  // Evaluation Criteria (Markdown)
  evaluationCriteria: string[];

  // Structural Guidance (Markdown)
  answerStructure: string[];

  // The Hero content
  sampleAnswer: string;

  // Follow-ups
  followUpQuestions: string[];
}

// Constants for LinkedIn message generation
export const CONNECTION_CONTEXTS = [
  "Applied to specific role",
  "Interested in company/opportunities",
  "Following their content/posts",
  "Alumni/school connection",
  "Mutual connection introduction",
  "Professional networking",
  "Met at event/conference"
] as const;

export const MESSAGE_INTENTS = [
  "Express Interest in Specific Role",
  "Explore Future Opportunities",
  "Seek Advice/Insights",
  "Build Professional Relationship"
] as const;

