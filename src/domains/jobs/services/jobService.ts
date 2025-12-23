import { supabaseBrowser } from '@/src/services/supabase';
import type { JobInfo, JobOutputs } from '@/src/domains/jobs/types';
import type { AnalysisResult, ResearchResult } from '@/src/domains/intelligence/types';
import type { CoverLetterState, LinkedInState, InterviewPrepState } from '@/src/domains/workspace/types';

// Enums mapping types in code to DB enums
type OutputType = 'resume_scan' | 'company_research' | 'cover_letter' | 'linkedin_message' | 'interview_prep';

/**
 * Job Service - Handles Persistence for Jobs and their Intelligence Outputs
 */

// --- Fetching ---

export const fetchJobs = async (): Promise<JobInfo[]> => {
    const { data: { user } } = await supabaseBrowser.auth.getUser();
    if (!user) return [];

    // Fetch jobs with their outputs joined
    const { data, error } = await supabaseBrowser
        .from('jobs')
        .select(`
      *,
      job_outputs (
        type,
        content,
        created_at
      )
    `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching jobs:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
        });
        return [];
    }

    // Transform DB rows to JobInfo objects
    return data.map((row: any) => {
        // Pivot the outputs array back into an object
        const outputs: JobOutputs = {};
        if (Array.isArray(row.job_outputs)) {
            row.job_outputs.forEach((out: any) => {
                switch (out.type) {
                    case 'resume_scan': outputs.analysis = out.content; break;
                    case 'company_research': outputs.research = out.content; break;
                    case 'cover_letter': outputs.coverLetter = out.content; break;
                    case 'linkedin_message': outputs.linkedIn = out.content; break;
                    case 'interview_prep': outputs.interviewPrep = out.content; break;
                }
            });
        }

        return {
            id: row.id,
            title: row.title,
            company: row.company,
            description: row.description,
            companyUrl: row.company_url || undefined,
            sourceUrl: row.source_url || undefined,
            contextName: row.context_name || undefined,
            linkedResumeId: row.resume_id || undefined,
            dateAdded: new Date(row.created_at),
            outputs: outputs
        };
    });
};

// --- Saving Jobs ---

export const saveJob = async (job: JobInfo): Promise<string> => {
    const { data: { user } } = await supabaseBrowser.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const payload = {
        id: job.id, // Include ID for Upsert
        user_id: user.id,
        title: job.title,
        company: job.company,
        description: job.description,
        company_url: job.companyUrl,
        source_url: job.sourceUrl,
        context_name: job.contextName,
        resume_id: job.linkedResumeId,
        status: job.status || 'saved'
    };

    // Use Upsert to handle both Insert (New Job) and Update (Existing Job)
    const { data, error } = await supabaseBrowser
        .from('jobs')
        .upsert(payload, { onConflict: 'id' })
        .select()
        .single();

    if (error) {
        console.error('Error saving job:', error);
        throw error;
    }
    return data.id;
};

export const deleteJob = async (id: string) => {
    const { error } = await supabaseBrowser
        .from('jobs')
        .delete()
        .eq('id', id);

    if (error) throw error;
};

// --- Saving Outputs ---

const saveOutput = async (jobId: string, type: OutputType, content: any) => {
    // Leverage the new unique index on (job_id, type) for atomic upserts
    // This replaces the previous delete-then-insert cycle, reducing DB roundtrips
    const { error } = await supabaseBrowser
        .from('job_outputs')
        .upsert(
            { job_id: jobId, type, content },
            { onConflict: 'job_id,type' }
        );

    if (error) {
        console.error(`Error upserting job output (${type}):`, {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
        });
        throw error;
    }
};

/**
 * Persists multiple job outputs in a single transaction/request
 * Significant performance improvement during "Run Intelligence" flows
 */
export const saveJobOutputsBulk = async (jobId: string, outputs: JobOutputs): Promise<void> => {
    const upserts = [];

    if (outputs.research) upserts.push({ job_id: jobId, type: 'company_research', content: outputs.research });
    if (outputs.analysis) upserts.push({ job_id: jobId, type: 'resume_scan', content: outputs.analysis });
    if (outputs.coverLetter) upserts.push({ job_id: jobId, type: 'cover_letter', content: outputs.coverLetter });
    if (outputs.linkedIn) upserts.push({ job_id: jobId, type: 'linkedin_message', content: outputs.linkedIn });
    if (outputs.interviewPrep) upserts.push({ job_id: jobId, type: 'interview_prep', content: outputs.interviewPrep });

    if (upserts.length === 0) return;

    const { error } = await supabaseBrowser
        .from('job_outputs')
        .upsert(upserts, { onConflict: 'job_id,type' });

    if (error) {
        console.error('Error batch saving job outputs:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
        });
        throw error;
    }
};

// Typed helpers for saving specific outputs
export const saveJobResearch = (jobId: string, data: ResearchResult) => saveOutput(jobId, 'company_research', data);
export const saveJobAnalysis = (jobId: string, data: AnalysisResult) => saveOutput(jobId, 'resume_scan', data);
export const saveCoverLetter = (jobId: string, data: CoverLetterState) => saveOutput(jobId, 'cover_letter', data);
export const saveLinkedIn = (jobId: string, data: LinkedInState) => saveOutput(jobId, 'linkedin_message', data);
export const saveInterviewPrep = (jobId: string, data: InterviewPrepState) => saveOutput(jobId, 'interview_prep', data);
