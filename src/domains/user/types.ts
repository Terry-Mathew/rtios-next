export interface UserProfile {
    id: string;
    email: string;
    fullName: string | null;
    linkedinUrl: string | null;
    portfolioUrl: string | null;
    createdAt: string;
}

export interface UserStats {
    totalJobs: number;
    totalResumes: number;
    coverLettersGenerated: number;
    accountAge: string; // e.g., "3 months"
}
