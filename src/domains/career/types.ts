/**
 * CareerContext Domain Types
 * 
 * Owns: Resume library, user profile links
 * Invariant: Single resume only
 */

export interface SavedResume {
  id: string;
  fileName: string;
  file?: File; // Optional: File object is not persisted to localStorage
  textParams: string; // The extracted text
  uploadDate: Date;
}

export interface UserProfile {
  // Active selection
  activeResumeId: string | null;
  portfolioUrl?: string;
  linkedinUrl?: string;
}

